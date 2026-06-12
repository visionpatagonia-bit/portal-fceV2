#!/usr/bin/env bash
# scripts/deploy.sh — LA ÚNICA forma sancionada de deployar el cockpit a Render.
#
#   "deployado" = este script imprimió VERDE. Ninguna otra definición vale.
#
# Lección 2026-06-11 (por la que existe este script): el deploy hook RECONSTRUYE LO QUE ESTÁ EN ORIGIN,
# no el working tree local. Disparar el hook sin pushear deja prod en el commit viejo mientras uno cree
# que está "live". Este script hace push PRIMERO, verifica origin==local, dispara el hook y recién
# declara éxito tras un SMOKE TEST CONTRA PROD (no local). A prueba de olvidos.
#
# Uso:   bash scripts/deploy.sh        (desde cualquier carpeta dentro del repo portal-fceV2)
# Hook:  export RENDER_DEPLOY_HOOK="https://api.render.com/deploy/srv-...?key=..."
#        o crear  scripts/.deploy-hook  con esa URL (gitignored, NUNCA se commitea).

set -uo pipefail

BRANCH="feat/study-cockpit"
PROD="https://nexus-study-cockpit.onrender.com"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

R='\033[1;31m'; G='\033[1;32m'; Y='\033[1;33m'; N='\033[0m'
say()  { printf "%b%s%b\n" "$Y" "$*" "$N"; }
fail() { printf "%b\n🔴 DEPLOY ROJO — %s%b\n" "$R" "$*" "$N"; exit 1; }

# Las operaciones de git corren en la raíz del repo (portal-fceV2).
ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || fail "no estás dentro del repo git (corré esto desde el repo portal-fceV2 / study-cockpit)"
cd "$ROOT"

# Hook secreto: env var, o archivo .deploy-hook junto al script (gitignored).
HOOK="${RENDER_DEPLOY_HOOK:-}"
if [ -z "$HOOK" ] && [ -f "$SCRIPT_DIR/.deploy-hook" ]; then HOOK="$(tr -d '[:space:]' < "$SCRIPT_DIR/.deploy-hook")"; fi
[ -n "$HOOK" ] || fail "falta el deploy hook (export RENDER_DEPLOY_HOOK=... o crear $SCRIPT_DIR/.deploy-hook)"

# 1) PUSH (aborta si falla)
say "1/5 · git push origin $BRANCH"
git push origin "$BRANCH" || fail "git push falló"

# 2) origin == local (aborta si difieren) — la causa exacta del bug que motivó este script
say "2/5 · verificar origin == local"
git fetch -q origin "$BRANCH" || fail "git fetch falló"
LOCAL="$(git rev-parse HEAD)"; REMOTE="$(git rev-parse FETCH_HEAD)"
[ "$LOCAL" = "$REMOTE" ] || fail "origin ($REMOTE) != local ($LOCAL): el push no impactó, NO se deploya"
printf "      ✓ origin == local @ %s\n" "${LOCAL:0:8}"

# 3) disparar deploy hook
say "3/5 · disparar deploy hook"
CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$HOOK" || echo 000)"
case "$CODE" in 200|201|202) printf "      ✓ hook aceptado (HTTP %s)\n" "$CODE";; *) fail "el hook devolvió HTTP $CODE";; esac

# 4) SMOKE TEST CONTRA PROD (reintentos por el build de Docker en Render free)
say "4/5 · smoke test contra PROD (esperando el build, hasta ~8 min)"
LM=""; DIFF=""
for i in $(seq 1 16); do
  LM="$(curl -s --max-time 60 "$PROD/api/learner-model" || true)"
  DIFF="$(curl -s --max-time 60 "$PROD/api/analytics/difficulty?subjectId=contabilidad_2p" || true)"
  if printf '%s' "$LM" | grep -q '"persistence":"firestore"' && printf '%s' "$DIFF" | grep -q '"items"'; then
    # 5) VERDE
    printf "%b\n════════════════════════════════════════════\n ✅ DEPLOY VERDE — verificado CONTRA PROD\n    commit:                       %s\n    /api/learner-model            → persistence:\"firestore\" ✓\n    /api/analytics/difficulty     → items[] ✓\n════════════════════════════════════════════%b\n" "$G" "${LOCAL:0:8}" "$N"
    exit 0
  fi
  printf "      intento %s/16 — aún buildeando…\n" "$i"
  sleep 30
done

# 5) ROJO con el/los endpoint(s) que fallaron
printf "%b\n════════════════════════════════════════════\n 🔴 DEPLOY ROJO — el smoke test NO pasó tras ~8 min%b\n" "$R" "$N"
printf '%s' "$LM"   | grep -q '"persistence":"firestore"' || printf "    ✗ /api/learner-model NO dio persistence:\"firestore\"\n      respuesta: %s\n" "$(printf '%s' "$LM" | head -c 160)"
printf '%s' "$DIFF" | grep -q '"items"'                   || printf "    ✗ /api/analytics/difficulty NO contiene items[]\n      respuesta: %s\n" "$(printf '%s' "$DIFF" | head -c 160)"
printf "    (origin está OK @ %s → el fallo está en el BUILD de Render, revisar sus logs)\n" "${LOCAL:0:8}"
printf "════════════════════════════════════════════\n"
exit 1
