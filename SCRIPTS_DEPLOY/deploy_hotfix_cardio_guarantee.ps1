# =====================================================================
# deploy_hotfix_cardio_guarantee.ps1
# HOTFIX v2028.26 · cardio garantizado en isCardioDay · 2026-05-10 noche
#
# Bug: dia Cardio+Core sin cardio aerobico (solo core + movilidad).
# Fix L5902: quitar condicion `&& mainAdded < mainCount` del cardio fallback.
#
# Verificacion pre-deploy:
#   - smoke_hotfix_cardio_guarantee.js · 5/5 OK
#   - smoke_hotfix_split_5dias.js · 10/10 OK
#   - smoke_hotfix_antisim_fill.js · 7/7 OK
#   - smoke_headless regression · 46 OK · 1 WARN preexistente · 0 FAIL
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_hotfix_cardio_guarantee.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_hotfix_cardio_guarantee.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== HOTFIX v2028.26 deploy · cardio guarantee ===" -ForegroundColor Cyan
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
git add "NEXUS FITNES/scripts/smoke_hotfix_cardio_guarantee.js"
git add "SCRIPTS_DEPLOY/commit_message_hotfix_cardio_guarantee.txt"
git add "SCRIPTS_DEPLOY/deploy_hotfix_cardio_guarantee.ps1"

git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main

Write-Host ""
Write-Host "=== HOTFIX v2028.26 deploy COMPLETO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Ariel: Ctrl+Shift+R + regenerar rutina Michael" -ForegroundColor Yellow
Write-Host "Verificar: dia 5 (Cardio+Core) tiene al menos 1 cardio aerobico (bici/cinta/elip/jumping/escaladores)" -ForegroundColor Yellow
Write-Host ""
