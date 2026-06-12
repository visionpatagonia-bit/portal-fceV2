# Auditoría del repo portal-fceV2 — Veredicto, barrido de valor y manifiesto de limpieza
**2026-06-12 · Auditoría de primera mano sobre clone completo (main + feat/study-cockpit)**

---

## 1. SEGURIDAD (lo urgente primero)

| # | Hallazgo | Severidad | Acción |
|---|---|---|---|
| S1 | **NEXUS FITNES completo (9.5MB) quedó PÚBLICO** al abrir el repo: producto pago (USD 12-17K de costo de reemplazo), scripts del cliente Ariel, demos. Sin secretos ni datos reales, pero es el código fuente de tu negocio a la vista. | **ALTA (negocio)** | **Volver el repo a PRIVADO HOY** (la auditoría ya está hecha, tengo el clone). Luego ejecutar M1 del manifiesto. |
| S2 | Firebase Web API key en index.html (AIza...TxI). | BAJA | Las keys web de Firebase son identificadores semi-públicos por diseño; **verifiqué las reglas de Firestore desde afuera: PERMISSION_DENIED** — las reglas sostienen. No requiere rotación, sí mantener reglas estrictas. |
| S3 | Proxy AI con fallback `'nexus-fce-2026-changeme'` (server.js:38). Es solo fallback de env var. | MEDIA | Verificar que el proxy DEPLOYADO tenga API_KEY seteada en env (no el default). Si algún deploy vivo usa el default → rotar ya. Si el proxy viejo ya no se usa → apagarlo. |
| S4 | Datos personales: el único JSON con campos tipo cliente es `demo_pre_9may.json` — **3 clientes FICTICIOS de demo** (Susana, Lucía...). Cero emails, cero teléfonos reales en todo el repo. | LIMPIO | Nada. Bien hecho desde el origen. |
| S5 | Basura con riesgo cero pero fea ante terceros: `.~lock.INFORME_AUDITOR.pdf#`, `lu322793he1c9.tmp` (228KB). | — | Borrar (M4). |

**Veredicto de seguridad: sin fuego activo.** El único riesgo real es S1 (exposición comercial), y se resuelve con un click: repo → Settings → Private.

---

## 2. BARRIDO DE VALOR — lo que el repo viejo le regala al cockpit

Esto es lo que pediste: qué nos sirve, con mi criterio. Cuatro gemas, en orden de valor:

| Activo | Qué es | Para qué sirve AHORA |
|---|---|---|
| **`nexus-ckg/`** (6.6MB) | Contable Knowledge Graph con doctrina **"literal quote or refuse"**: ninguna afirmación sale sin cita textual al párrafo de fuente canónica. Con blind tests documentados (rondas 5-6). | **Es el ancestro directo del pilar Fidelidad al Corpus (Vía D) y de F7.** La doctrina de cita-o-rechazo es exactamente el gate que el generador de ítems necesita. NO se tira: se estudia y se porta al cockpit. |
| **`kb/knowledge_base.json`** | Las 246 entradas validadas con las 7 heurísticas anti-alucinación (las del documento de Propedéutica). | Contenido curado para la vista Aprender del cockpit + evidencia viva para la vuelta a Propedéutica ("esto es lo que ya validamos en 2026"). |
| **`pipeline/`** | Ingesta de PDF → KB (ingest_pdf.py, clean_ocr.py, generate_kb.py) con heurísticas H1-H7. | **Es el prototipo del driver de prácticos de NEXUS OS** y la boca de carga de la Torre de Control. Cuando llegue el segundo cuatrimestre, esto se resucita, no se reescribe. |
| **`materiales.json`** (776KB) + `portal.js` | Todo el contenido de las 4 materias del portal viejo, estructurado. | Cantera de contenido para los contratos del cockpit (con pase F7 antes de usar). |

---

## 3. MANIFIESTO DE LIMPIEZA (ejecutable, en orden)

### M0 · PREVIO (acción del fundador, 1 minuto)
Repo `portal-fceV2` → Settings → **Private**. Antes de tocar nada más.

### M1 · SEPARAR NEXUS FITNESS (programador)
- Crear repo privado `nexus-fitness`, mover `NEXUS FITNES/` + `SCRIPTS_DEPLOY/*anubis*` con historial si es barato (`git filter-repo`) o como import simple si no.
- El repo del portal deja de contener el producto Fitness. Dos negocios, dos repos.

### M2 · ARCHIVAR (ya empaquetado — descarga lista)
Los 28 archivos históricos ya están en `NEXUS_ARCHIVO_HISTORICO_2026-06-12.zip`
(informes INFORME_AUDITOR.*, FASE4_*, HALLUCINATION_AUDIT*, DEMO_*,
NEXUS_HYBRID_ARCHITECTURE*, OCR_SCOUTING, AUDITORIA_EXTERNA/, las 4
presentaciones pptx + pdf, preview-sovereign). **El fundador guarda el zip
donde quiera → después el programador los borra del repo.** El historial git
los preserva igual; esto limpia el working tree.

### M3 · CONSERVAR EN SU LUGAR (no tocar)
- Todo el portal viejo deployado: `index.html`, `portal.js`, `materiales.json`,
  `nexus-sovereign.css`, `nexus-ui-system.css`, `fonts/`, `kb/`, `nexus-ai.js`,
  `nexus-ai-proxy/` — es producto vivo (portal-fce-v2.vercel.app) y evidencia
  para Propedéutica.
- `nexus-ckg/` y `pipeline/` — gemas (sección 2). Se conservan; opcionalmente
  se mueven a `legacy-assets/` para señalizar su estatus.
- Branch `feat/study-cockpit` completo — sagrado, ni mirarlo en esta limpieza.

### M4 · BORRAR (basura objetiva)
- `.~lock.INFORME_AUDITOR.pdf#`, `lu322793he1c9.tmp`.
- `nexus-contabilidad-deploy/` → **PENDIENTE DE CONFIRMACIÓN del fundador**:
  parece deploy duplicado viejo (difiere del index actual = quedó desactualizado).
  Si ningún dominio de Vercel apunta ahí, se borra. Confirmar antes.

### M5 · README de orientación (programador, 10 min)
Un README.md raíz nuevo de 15 líneas: qué es este repo, qué vive dónde
(portal viejo / cockpit en su branch / legacy-assets), y dónde está el
archivo histórico. Para que el próximo agente no nade en el pantano que
vos nadaste.

---

## 4. Criterio aplicado (para el registro)
Nada valioso se destruye: el zip preserva lo archivado, git preserva el
historial, las gemas quedan señalizadas para las Vías D/E. Lo único que
muere es la fricción: un agente que abre este repo mañana entiende en 30
segundos qué es cada cosa. Esa es la definición de orden que vale.
