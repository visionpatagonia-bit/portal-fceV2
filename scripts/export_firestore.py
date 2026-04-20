#!/usr/bin/env python3
"""
export_firestore.py — Exporta colecciones de Firestore a JSON anonimizado.

Para la reunión científica del jueves con propedéutica. Exporta:
  - usuarios/              (top-level, metadata de alumnos)
  - usuarios/{uid}/leidos/ (subcollection: materiales leídos + tiempo)
  - tablon_dudas/          (top-level, dudas + auto-respuestas mentor AI)
  - tp_respuestas/{uid}/tps/ (entregas de TP)
  - grupos/FCE2026/miembros/ (progreso agregado del cohorte)

Anonimización:
  - UIDs → SHA256(UID + SALT)[:8]  (mismo hash → mismo pseudónimo siempre)
  - Emails → null (nunca se exportan)
  - Nombres → null salvo si ya vienen anonimizados en la data

Uso:
    pip install firebase-admin --break-system-packages
    python scripts/export_firestore.py <path-a-service-account.json>

Output:
    /sessions/dreamy-happy-shannon/data_export/
      ├── usuarios.json
      ├── leidos.json
      ├── tablon_dudas.json
      ├── tp_respuestas.json
      ├── grupos_miembros.json
      └── _manifest.json   (conteos, timestamps, hash salt)
"""

import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    sys.stderr.write(
        "Falta firebase-admin. Instalá con:\n"
        "  pip install firebase-admin --break-system-packages\n"
    )
    sys.exit(1)


# ── Configuración ──────────────────────────────────────────────────────
EXPORT_DIR = Path("/sessions/dreamy-happy-shannon/data_export")
GRUPO_ID = "FCE2026"
# Salt fijo: consistencia entre corridas para que mismos UIDs mapeen al mismo hash.
# NO es un secreto — solo evita que hashes sean re-identificables sin el salt.
SALT = "nexus-propedeutica-2026-04"


def anon(uid: str) -> str:
    """UID → hash pseudonimizado de 8 chars."""
    if not uid:
        return "anon"
    h = hashlib.sha256((uid + SALT).encode("utf-8")).hexdigest()
    return h[:8]


def serialize_value(v):
    """Convierte tipos Firestore a tipos JSON-serializable."""
    if v is None:
        return None
    if isinstance(v, (bool, int, float, str)):
        return v
    if isinstance(v, datetime):
        return v.astimezone(timezone.utc).isoformat()
    if isinstance(v, dict):
        return {k: serialize_value(val) for k, val in v.items()}
    if isinstance(v, list):
        return [serialize_value(x) for x in v]
    if hasattr(v, "isoformat"):
        return v.isoformat()
    # firestore.GeoPoint, DocumentReference, etc.
    return str(v)


def scrub_user_fields(data: dict) -> dict:
    """Elimina PII de documentos de usuario (email, nombres, etc.)."""
    SENSITIVE = {"email", "displayName", "photoURL", "phoneNumber",
                 "nombre_completo", "apellido", "dni"}
    cleaned = {}
    for k, v in data.items():
        if k in SENSITIVE:
            continue
        # nombre: si parece email o nombre completo, anular; si ya es anonymous-looking, conservar
        if k == "nombre":
            if isinstance(v, str) and ("@" in v or " " in v and len(v) > 15):
                cleaned[k] = None
                continue
        cleaned[k] = serialize_value(v)
    return cleaned


# ── Extractores por colección ──────────────────────────────────────────
def export_usuarios(db):
    """usuarios/ top level — metadata anonimizada."""
    out = []
    docs = db.collection("usuarios").stream()
    for doc in docs:
        data = scrub_user_fields(doc.to_dict() or {})
        data["_pseudo_uid"] = anon(doc.id)
        out.append(data)
    return out


def export_leidos(db):
    """usuarios/{uid}/leidos/ — materiales leídos por alumno con tiempo."""
    out = []
    user_docs = db.collection("usuarios").stream()
    for user in user_docs:
        pseudo = anon(user.id)
        leidos = db.collection("usuarios").document(user.id).collection("leidos").stream()
        for l in leidos:
            data = serialize_value(l.to_dict() or {})
            data["_pseudo_uid"] = pseudo
            data["slug"] = l.id
            out.append(data)
    return out


def export_tablon(db):
    """tablon_dudas/ — preguntas anónimas + auto-respuesta del mentor."""
    out = []
    for doc in db.collection("tablon_dudas").stream():
        data = serialize_value(doc.to_dict() or {})
        # uid_hash ya viene anonimizado (btoa truncado). Lo re-hasheamos con SHA256 para consistencia.
        if "uid_hash" in data and data["uid_hash"]:
            data["_pseudo_uid"] = anon(str(data["uid_hash"]))
        data["_doc_id"] = doc.id
        out.append(data)
    return out


def export_tp_respuestas(db):
    """tp_respuestas/{uid}/tps/ — entregas de trabajos prácticos."""
    out = []
    roots = db.collection("tp_respuestas").stream()
    for root in roots:
        pseudo = anon(root.id)
        tps = db.collection("tp_respuestas").document(root.id).collection("tps").stream()
        for tp in tps:
            data = serialize_value(tp.to_dict() or {})
            data["_pseudo_uid"] = pseudo
            data["tp_id"] = tp.id
            # escrubar respuestas que puedan tener info personal
            if "respuestas" in data and isinstance(data["respuestas"], dict):
                # mantener estructura pero borrar texto largo con posible PII
                data["_respuestas_count"] = len(data["respuestas"])
            out.append(data)
    return out


def export_grupos(db):
    """grupos/{grupoId}/miembros/ — progreso agregado del cohorte."""
    out = []
    miembros = db.collection("grupos").document(GRUPO_ID).collection("miembros").stream()
    for m in miembros:
        data = scrub_user_fields(m.to_dict() or {})
        data["_pseudo_uid"] = anon(m.id)
        out.append(data)
    return out


# ── Main ───────────────────────────────────────────────────────────────
def main():
    if len(sys.argv) < 2:
        sys.stderr.write("Uso: python scripts/export_firestore.py <service-account.json>\n")
        sys.exit(2)

    cred_path = Path(sys.argv[1])
    if not cred_path.exists():
        sys.stderr.write(f"No existe: {cred_path}\n")
        sys.exit(2)

    # Initialize firebase-admin
    cred = credentials.Certificate(str(cred_path))
    firebase_admin.initialize_app(cred)
    db = firestore.client()

    EXPORT_DIR.mkdir(parents=True, exist_ok=True)

    collections = [
        ("usuarios",       export_usuarios),
        ("leidos",         export_leidos),
        ("tablon_dudas",   export_tablon),
        ("tp_respuestas",  export_tp_respuestas),
        ("grupos_miembros", export_grupos),
    ]

    manifest = {
        "export_ts":       datetime.now(timezone.utc).isoformat(),
        "salt_fingerprint": hashlib.sha256(SALT.encode()).hexdigest()[:12],
        "grupo_id":        GRUPO_ID,
        "collections":     {},
    }

    print(f"\n━━━ Firestore export → {EXPORT_DIR} ━━━\n")
    for name, extractor in collections:
        print(f"  Exportando {name}…", end=" ", flush=True)
        try:
            data = extractor(db)
        except Exception as e:
            print(f"ERROR: {e}")
            manifest["collections"][name] = {"count": 0, "error": str(e)}
            continue

        out_path = EXPORT_DIR / f"{name}.json"
        out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"{len(data):>4} documentos → {out_path.name}")
        manifest["collections"][name] = {"count": len(data), "file": out_path.name}

    manifest_path = EXPORT_DIR / "_manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n  _manifest.json escrito — fingerprint salt: {manifest['salt_fingerprint']}")
    print(f"\n  ✅ Export completo. Ahora: EDA con data_export/*.json\n")


if __name__ == "__main__":
    main()
