# =====================================================================
# deploy_hotfix_antisim_fill.ps1
# HOTFIX v2028.25 · bug Michael Lopez ronda 2 · 2026-05-10 noche
#
# Bug: dia Pecho con 2 mains (esperaba 6) por anti-similar guard que
# bloqueaba candidatos con misma firma en split fino.
# Fix L5869: convertir single-pick en while-loop hasta exPerGroup.
#
# Verificacion pre-deploy:
#   - smoke_hotfix_antisim_fill.js · 7/7 OK
#   - smoke_hotfix_split_5dias.js · 10/10 OK
#   - smoke_headless regression · 46 OK · 1 WARN preexistente · 0 FAIL
#   - Sprint 1.6 smokes intactos
#   - Diagnostico empirico Michael: dia Pecho de 2 -> 6 mains
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_hotfix_antisim_fill.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_hotfix_antisim_fill.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== HOTFIX v2028.25 deploy · antisim fill split fino ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASO 1/4: md5 parity-check master vs deploy_qa" -ForegroundColor Cyan
$srcPath = "$repoPath\NEXUS FITNES\dashboard\NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
$dstPath = "$repoPath\NEXUS FITNES\deploy_qa\public\index.html"

Copy-Item $srcPath $dstPath -Force

$srcMd5 = (Get-FileHash $srcPath -Algorithm MD5).Hash
$dstMd5 = (Get-FileHash $dstPath -Algorithm MD5).Hash

Write-Host "MD5 master HTML:    $srcMd5"
Write-Host "MD5 deploy_qa HTML: $dstMd5"

if ($srcMd5 -ne $dstMd5) {
    Write-Host "ABORT - md5 mismatch" -ForegroundColor Red
    exit 1
}
Write-Host "OK md5 HTML coincide" -ForegroundColor Green
Write-Host ""

Write-Host "PASO 2/4: Estado git" -ForegroundColor Cyan
git status --short
Write-Host ""

Write-Host "PASO 3/4: Deploy Vercel" -ForegroundColor Cyan
Push-Location "$repoPath\NEXUS FITNES\deploy_qa"
try { & npx vercel deploy --prod } finally { Pop-Location }
Write-Host ""

Write-Host "PASO 4/4: Stage + Commit + Push" -ForegroundColor Cyan
git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "NEXUS FITNES/deploy_qa/public/index.html"
git add "NEXUS FITNES/scripts/smoke_hotfix_antisim_fill.js"
git add "SCRIPTS_DEPLOY/commit_message_hotfix_antisim_fill.txt"
git add "SCRIPTS_DEPLOY/deploy_hotfix_antisim_fill.ps1"

git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main

Write-Host ""
Write-Host "=== HOTFIX v2028.25 deploy COMPLETO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Ariel: pedile que regenere la rutina de Michael Lopez (Ctrl+Shift+R primero)" -ForegroundColor Yellow
Write-Host "Verificar: dia Pecho deberia tener 6+ ejercicios distintos (no 2 con triceps)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para ver equipos que agrego Ariel a Michael, abrir F12 consola navegador y correr:" -ForegroundColor Cyan
Write-Host '  const m = STATE.clients.find(c => c.name === "Michael Lopez"); console.log(m.equipment, m.modifiers, m.level)' -ForegroundColor White
Write-Host ""
