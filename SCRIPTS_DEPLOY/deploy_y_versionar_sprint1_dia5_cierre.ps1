# =====================================================================
# deploy_y_versionar_sprint1_dia5_cierre.ps1
# Sprint 1 Stack A · Día 5 · CIERRE · 2026-05-09 noche
#
# Cambio único: flippear flag a default ON. ?dexie=0 = kill-switch.
# Ariel hereda Dexie automático sin tocar URL.
#
# md5 parity-check pre-deploy embebido.
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_y_versionar_sprint1_dia5_cierre.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint1_dia5_cierre.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== Sprint 1 Dia 5 CIERRE ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASO 1/4: md5 parity-check master vs deploy_qa" -ForegroundColor Cyan
$srcPath = "$repoPath\NEXUS FITNES\dashboard\NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
$dstPath = "$repoPath\NEXUS FITNES\deploy_qa\public\index.html"

Copy-Item $srcPath $dstPath -Force

$srcMd5 = (Get-FileHash $srcPath -Algorithm MD5).Hash
$dstMd5 = (Get-FileHash $dstPath -Algorithm MD5).Hash

Write-Host "MD5 master:    $srcMd5"
Write-Host "MD5 deploy_qa: $dstMd5"

if ($srcMd5 -ne $dstMd5) {
    Write-Host "ABORT - md5 mismatch" -ForegroundColor Red
    exit 1
}
Write-Host "OK md5 coincide" -ForegroundColor Green
Write-Host ""

Write-Host "PASO 2/4: Estado git" -ForegroundColor Cyan
git status --short
Write-Host ""

Write-Host "PASO 3/4: Deploy Vercel" -ForegroundColor Cyan
Push-Location "$repoPath\NEXUS FITNES\deploy_qa"
try { & npx vercel deploy --prod } finally { Pop-Location }
Write-Host ""

Write-Host "PASO 4/4: Commit + Push Sprint 1 cierre" -ForegroundColor Cyan
git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "NEXUS FITNES/docs/SPRINT1_DIA0_PREFLIGHT.md"
git add "NEXUS FITNES/docs/SPRINT1_DIA1_CIERRE.md"
git add "NEXUS FITNES/docs/SPRINT1_DIA2_CIERRE.md"
git add "NEXUS FITNES/docs/SPRINT1_DIA3_VALIDACION_F12.md"
git add "NEXUS FITNES/docs/SPRINT1_CIERRE_FORMAL.md"
git add "SCRIPTS_DEPLOY/deploy_y_versionar_sprint1_dia5_cierre.ps1"
git add "SCRIPTS_DEPLOY/commit_message_sprint1_dia5_cierre.txt"

git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile

git push origin main

Write-Host ""
Write-Host "=== SPRINT 1 STACK A · CERRADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Verificacion final (1 min):" -ForegroundColor Yellow
Write-Host "  1. Abrir https://nexus-fitness-ruby.vercel.app (sin ?dexie)" -ForegroundColor Yellow
Write-Host "  2. F12 -> Console -> NX_USE_DEXIE     (debe responder: true)" -ForegroundColor Yellow
Write-Host "  3. Ariel hereda Dexie automatico - su flujo no cambia" -ForegroundColor Yellow
Write-Host ""
Write-Host "Kill-switch de emergencia:" -ForegroundColor Yellow
Write-Host "  https://nexus-fitness-ruby.vercel.app/?dexie=0" -ForegroundColor Yellow
Write-Host ""
Write-Host "Backlog post-Sprint 1: Sprint 1.5 (free-exercise-db) - Trucco - Open Props" -ForegroundColor Cyan
