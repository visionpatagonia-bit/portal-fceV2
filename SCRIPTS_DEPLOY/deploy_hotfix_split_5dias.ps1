# =====================================================================
# deploy_hotfix_split_5dias.ps1
# HOTFIX v2028.24 · bug split semanal 5 dias · 2026-05-10 noche
#
# Bug Michael Lopez: 5 dias IDENTICOS por isInicial sobrescribiendo split.
# Fix L5662: agregar `&& totalDays <= 4` a isInicial.
#
# Verificacion pre-deploy:
#   - smoke_hotfix_split_5dias.js · 10/10 OK
#   - smoke_headless regression · 46 OK · 1 WARN preexistente · 0 FAIL
#   - Sprint 1.6 D1+D2+D3 smokes intactos
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_hotfix_split_5dias.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_hotfix_split_5dias.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== HOTFIX v2028.24 deploy · split semanal 5 dias ===" -ForegroundColor Cyan
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
git add "NEXUS FITNES/scripts/smoke_hotfix_split_5dias.js"
git add "SCRIPTS_DEPLOY/commit_message_hotfix_split_5dias.txt"
git add "SCRIPTS_DEPLOY/deploy_hotfix_split_5dias.ps1"

git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main

Write-Host ""
Write-Host "=== HOTFIX v2028.24 deploy COMPLETO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Ariel: pedile que regenere la rutina de Michael Lopez" -ForegroundColor Yellow
Write-Host "Verificar: los 5 dias deben ser distintos (Pecho/Espalda/Piernas/Hombros-Brazos/Cardio-Core)" -ForegroundColor Yellow
Write-Host ""
