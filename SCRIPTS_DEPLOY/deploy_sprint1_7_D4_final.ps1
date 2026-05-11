# =====================================================================
# deploy_sprint1_7_D4_final.ps1
# Sprint 1.7 D4 final · main list expandido 100 -> 973 ej · v2028.30
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_sprint1_7_D4_final.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint1_7_D4_final.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== Sprint 1.7 D4 · main list 100 -> 973 ej · v2028.30 ===" -ForegroundColor Cyan
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

$srcSize = (Get-Item $srcPath).Length
Write-Host "HTML size: $($srcSize) bytes ($([Math]::Round($srcSize/1024/1024, 2)) MB)" -ForegroundColor Cyan
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
git add "NEXUS FITNES/scripts/adapt_yuhonas_for_html_inject.js"
git add "NEXUS FITNES/scripts/inject_yuhonas_to_html.js"
git add "NEXUS FITNES/data_generated/EX_yuhonas_ready_for_inject.json"
git add "NEXUS FITNES/data_generated/EX_yuhonas_ready_stats.json"
git add "SCRIPTS_DEPLOY/commit_message_sprint1_7_D4_final.txt"
git add "SCRIPTS_DEPLOY/deploy_sprint1_7_D4_final.ps1"

git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main

Write-Host ""
Write-Host "=== Sprint 1.7 D4 DEPLOY COMPLETO · v2028.30 ===" -ForegroundColor Green
Write-Host ""
Write-Host "VERIFICACION ARIEL (en navegador incognito Ctrl+Shift+N):" -ForegroundColor Yellow
Write-Host "1. Abrir https://nexus-fitness-ruby.vercel.app" -ForegroundColor White
Write-Host "2. Badge 'Motor v2028.30 · 2026-05-11' en esquina inferior derecha" -ForegroundColor White
Write-Host "3. Crear cliente test · generar rutina" -ForegroundColor White
Write-Host "4. Modal +Agregar deberia mostrar muchos mas ejercicios (973 vs 100)" -ForegroundColor White
Write-Host "5. Click en cualquier yuhonas · ver lightbox con imagen + instrucciones EN" -ForegroundColor White
Write-Host ""
