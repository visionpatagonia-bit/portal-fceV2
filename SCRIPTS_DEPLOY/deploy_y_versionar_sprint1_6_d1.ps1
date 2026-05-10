# =====================================================================
# deploy_y_versionar_sprint1_6_d1.ps1
# Sprint 1.6 D1 · Render thumbnails EXT · 2026-05-10 tarde
#
# Cambios: nxCatalogToEX + imagen_thumb + _renderAddRow con <img>
#          condicional + onerror fallback graceful.
# md5 parity-check pre-deploy embebido.
# Total Sprint 1.6 D1 acumulado: 138/139 asserts (9 smokes · 1 WARN preexistente).
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_y_versionar_sprint1_6_d1.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint1_6_d1.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== Sprint 1.6 D1 deploy · Render thumbnails EXT ===" -ForegroundColor Cyan
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
git add "NEXUS FITNES/scripts/smoke_thumbnails_ext.js"
git add "NEXUS FITNES/docs/SPRINT1_6_D1.md"
git add "SCRIPTS_DEPLOY/commit_message_sprint1_6_d1.txt"
git add "SCRIPTS_DEPLOY/deploy_y_versionar_sprint1_6_d1.ps1"

git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile

git push origin main

Write-Host ""
Write-Host "=== SPRINT 1.6 D1 DEPLOYADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Verificacion (3 min):" -ForegroundColor Yellow
Write-Host "  1. Modal +Agregar ejercicio + toggle EXT ON:" -ForegroundColor Yellow
Write-Host "     - Filas curadas: icono grupo (sin cambios)" -ForegroundColor Yellow
Write-Host "     - Filas EXT: thumbnail 40x40 real de yuhonas" -ForegroundColor Yellow
Write-Host "  2. Second reload:" -ForegroundColor Yellow
Write-Host "     - DevTools > Network > filas EXT Size = '(ServiceWorker)'" -ForegroundColor Yellow
Write-Host "  3. DevTools > Application > Cache Storage > nx-yuhonas-images-v1 (entries > 0)" -ForegroundColor Yellow
Write-Host "  4. F12: await window.NX_SW.stats() (entries > 0)" -ForegroundColor Yellow
Write-Host ""
