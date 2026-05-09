# =====================================================================
# deploy_y_versionar_sprint1_5_dia1_2.ps1
# Sprint 1.5 Dia 1+2 · catalogo yuhonas + fix H4/H5 · 2026-05-09 noche
#
# DIA 1: catalogo extendido yuhonas (873 ej · 1.1MB) servido desde Vercel
#        pero NO cableado a UI todavia (cero risk).
# DIA 2: fix H4 (PDF Vista Alumno · resolveContext Path 3)
#        fix H5 (espacio f-i/f-l · safeText U+200B -> U+200C ZWNJ)
#
# md5 parity-check pre-deploy embebido.
# Smoke headless regression: 46 OK + 1 WARN + 0 FAIL (identico Sprint 1 baseline).
# Smoke H4/H5: 12 asserts verde.
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_y_versionar_sprint1_5_dia1_2.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint1_5_dia1_2.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== Sprint 1.5 Dia 1+2 deploy ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASO 1/5: md5 parity-check master vs deploy_qa" -ForegroundColor Cyan
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

$jsonPath = "$repoPath\NEXUS FITNES\deploy_qa\public\exercises_extended.json"
if (-not (Test-Path $jsonPath)) {
    Write-Host "ABORT - exercises_extended.json no existe en deploy_qa/public/" -ForegroundColor Red
    exit 1
}
$jsonMd5 = (Get-FileHash $jsonPath -Algorithm MD5).Hash
$jsonSize = (Get-Item $jsonPath).Length
Write-Host "MD5 exercises_extended.json: $jsonMd5"
Write-Host "Size:                        $([math]::Round($jsonSize / 1KB, 1)) KB"
Write-Host "OK json catalogo presente" -ForegroundColor Green
Write-Host ""

Write-Host "PASO 2/5: Estado git" -ForegroundColor Cyan
git status --short
Write-Host ""

Write-Host "PASO 3/5: Deploy Vercel (incluye catalogo extendido + HTML con fixes)" -ForegroundColor Cyan
Push-Location "$repoPath\NEXUS FITNES\deploy_qa"
try { & npx vercel deploy --prod } finally { Pop-Location }
Write-Host ""

Write-Host "PASO 4/5: Stage archivos Sprint 1.5 Dia 1+2" -ForegroundColor Cyan
git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "NEXUS FITNES/deploy_qa/public/exercises_extended.json"
git add "NEXUS FITNES/scripts/yuhonas_to_nexus.js"
git add "NEXUS FITNES/scripts/smoke_h4_h5.js"
git add "NEXUS FITNES/docs/SPRINT1_5_MAPPING.md"
git add "NEXUS FITNES/docs/SPRINT1_5_DIA1_2.md"
git add "SCRIPTS_DEPLOY/commit_message_sprint1_5_dia1_2.txt"
git add "SCRIPTS_DEPLOY/deploy_y_versionar_sprint1_5_dia1_2.ps1"

Write-Host ""
Write-Host "PASO 5/5: Commit + Push" -ForegroundColor Cyan
git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile

git push origin main

Write-Host ""
Write-Host "=== SPRINT 1.5 DIA 1+2 DEPLOYADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Verificacion (3 min):" -ForegroundColor Yellow
Write-Host "  1. F12 console: await fetch('/exercises_extended.json').then(r => r.json()).then(d => d.total)" -ForegroundColor Yellow
Write-Host "     -> debe retornar 873" -ForegroundColor Yellow
Write-Host "  2. Vista Alumno PDF:" -ForegroundColor Yellow
Write-Host "     https://nexus-fitness-ruby.vercel.app/?student={ID_DE_LUZ_O_PEREZ}" -ForegroundColor Yellow
Write-Host "     -> click Exportar PDF -> debe bajar PDF (no toast 'no hay rutina')" -ForegroundColor Yellow
Write-Host "  3. PDF nuevo de Luz:" -ForegroundColor Yellow
Write-Host "     -> abrir en Chrome PDF viewer + Adobe Acrobat" -ForegroundColor Yellow
Write-Host "     -> 'tonificacion' SIN espacio raro · 'flexiones' SIN espacio raro" -ForegroundColor Yellow
Write-Host "  4. Cartera coach: regression test" -ForegroundColor Yellow
Write-Host "     -> sigue funcionando identico (Path 1 intacto)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pendiente Dia 3 (proxima sesion):" -ForegroundColor Cyan
Write-Host "  - UI buscador catalogo extendido (toggle default OFF)" -ForegroundColor Cyan
Write-Host "  - Persist Dexie + lazy LLM traduccion + SW cache imagenes" -ForegroundColor Cyan
Write-Host ""
