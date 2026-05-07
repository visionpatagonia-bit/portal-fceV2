# =====================================================================
# deploy_y_versionar_post_anubis_smoke.ps1
# Cierre sesion Anubis pre-demo 9-may · 2026-05-06 noche
#
# Hace 1 cosa:
#   Commit + push de los 4 entregables de la sesion (smoke + datos + check + checklist)
#
# NO toca dashboard HTML (no se modifico) · no requiere vercel deploy.
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_y_versionar_post_anubis_smoke.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_anubis_smoke.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== PASO 1/2: Estado actual del repo ===" -ForegroundColor Cyan
git status --short
Write-Host ""

Write-Host "=== PASO 2/2: Commit + Push (sesion Anubis pre-demo 9-may) ===" -ForegroundColor Cyan

# Stage selectivo de los 4 entregables + checklist actualizado
git add "NEXUS FITNES/scripts/smoke_headless.js"
git add "NEXUS FITNES/clientes/anubis/imports/demo_pre_9may.json"
git add "NEXUS FITNES/PRE_DEMO_CHECK.ps1"
git add "NEXUS FITNES/docs/CHECKLIST_DEMO_9MAY.md"
git add "SCRIPTS_DEPLOY/deploy_y_versionar_post_anubis_smoke.ps1"
git add "SCRIPTS_DEPLOY/commit_message_anubis_smoke.txt"

# Commit con mensaje desde archivo
git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile

git push origin main

Write-Host ""
Write-Host "=== CIERRE SESION ANUBIS PRE-DEMO COMPLETO ===" -ForegroundColor Green
Write-Host "OK Commit + push a GitHub completado"
Write-Host ""
Write-Host "Entregables versionados:" -ForegroundColor DarkGray
Write-Host "  - NEXUS FITNES/scripts/smoke_headless.js" -ForegroundColor DarkGray
Write-Host "  - NEXUS FITNES/clientes/anubis/imports/demo_pre_9may.json" -ForegroundColor DarkGray
Write-Host "  - NEXUS FITNES/PRE_DEMO_CHECK.ps1" -ForegroundColor DarkGray
Write-Host "  - NEXUS FITNES/docs/CHECKLIST_DEMO_9MAY.md (actualizado)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Antes de demo 9-may correr:" -ForegroundColor Yellow
Write-Host "  cd NEXUS FITNES; .\PRE_DEMO_CHECK.ps1" -ForegroundColor Yellow
