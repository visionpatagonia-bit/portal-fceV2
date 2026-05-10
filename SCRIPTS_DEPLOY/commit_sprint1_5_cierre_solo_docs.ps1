# =====================================================================
# commit_sprint1_5_cierre_solo_docs.ps1
# Sprint 1.5 cierre formal · SOLO commit docs (sin redeploy)
# 4 deploys ya estan en produccion validados.
# Este script solo agrega los docs de cierre formal al repo.
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\commit_sprint1_5_cierre_solo_docs.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint1_5_cierre.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== Sprint 1.5 CIERRE FORMAL · solo commit docs ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASO 1/3: Estado git" -ForegroundColor Cyan
git status --short
Write-Host ""

Write-Host "PASO 2/3: Stage docs cierre" -ForegroundColor Cyan
git add "NEXUS FITNES/docs/SPRINT1_5_CIERRE_FORMAL.md"
git add "NEXUS FITNES/docs/MINI_INFORME_CTO_SPRINT1_5_CIERRE.md"
git add "SCRIPTS_DEPLOY/commit_message_sprint1_5_cierre.txt"
git add "SCRIPTS_DEPLOY/commit_sprint1_5_cierre_solo_docs.ps1"
Write-Host ""

Write-Host "PASO 3/3: Commit + Push" -ForegroundColor Cyan
git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile

git push origin main

Write-Host ""
Write-Host "=== SPRINT 1.5 CERRADO FORMAL ===" -ForegroundColor Green
Write-Host ""
Write-Host "Estado producción: nexus-fitness-ruby.vercel.app (4 deploys validados)" -ForegroundColor Yellow
Write-Host "Total asserts: 95/96 (5 smokes nuevos · 0 FAIL · 1 WARN preexistente)" -ForegroundColor Yellow
Write-Host "Kill-switches: ?dexie=0 · toggle catalogo OFF · NX_CATALOG.getError · NX_SW.purge" -ForegroundColor Yellow
Write-Host ""
Write-Host "Roadmap inmediato:" -ForegroundColor Cyan
Write-Host "  - Sprint 2 Trucco lunes 19-23 may (auditoria CTO previa lunes-martes)" -ForegroundColor Cyan
Write-Host "  - Backlog Sprint 1.6: D3.B traduccion + render thumbnail EXT" -ForegroundColor Cyan
Write-Host ""
