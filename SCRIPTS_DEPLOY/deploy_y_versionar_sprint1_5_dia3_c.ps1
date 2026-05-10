# =====================================================================
# deploy_y_versionar_sprint1_5_dia3_c.ps1
# Sprint 1.5 Dia 3.C · SW cache yuhonas + CSP fix · 2026-05-09 noche
#
# Cambios: sw.js NEW (stale-while-revalidate scoped a yuhonas) +
#          window.NX_SW registration + vercel.json CSP fix.
# md5 parity-check pre-deploy embebido.
# Total Sprint 1.5 acumulado: 95/96 asserts (1 WARN preexistente).
# D3.B postpone Sprint 1.6 (decision tecnica · agendado backlog).
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_y_versionar_sprint1_5_dia3_c.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint1_5_dia3_c.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== Sprint 1.5 Dia 3.C deploy ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASO 1/5: md5 parity-check master vs deploy_qa" -ForegroundColor Cyan
$srcPath = "$repoPath\NEXUS FITNES\dashboard\NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
$dstPath = "$repoPath\NEXUS FITNES\deploy_qa\public\index.html"
$swPath = "$repoPath\NEXUS FITNES\deploy_qa\public\sw.js"
$vercelPath = "$repoPath\NEXUS FITNES\deploy_qa\vercel.json"

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

if (-not (Test-Path $swPath)) {
    Write-Host "ABORT - sw.js no existe en deploy_qa/public/" -ForegroundColor Red
    exit 1
}
$swMd5 = (Get-FileHash $swPath -Algorithm MD5).Hash
Write-Host "MD5 sw.js: $swMd5"
Write-Host "OK sw.js presente" -ForegroundColor Green

if (-not (Test-Path $vercelPath)) {
    Write-Host "ABORT - vercel.json no existe" -ForegroundColor Red
    exit 1
}
Write-Host "OK vercel.json presente" -ForegroundColor Green
Write-Host ""

Write-Host "PASO 2/5: Estado git" -ForegroundColor Cyan
git status --short
Write-Host ""

Write-Host "PASO 3/5: Deploy Vercel (incluye sw.js + vercel.json CSP actualizado)" -ForegroundColor Cyan
Push-Location "$repoPath\NEXUS FITNES\deploy_qa"
try { & npx vercel deploy --prod } finally { Pop-Location }
Write-Host ""

Write-Host "PASO 4/5: Stage archivos" -ForegroundColor Cyan
git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "NEXUS FITNES/deploy_qa/public/sw.js"
git add "NEXUS FITNES/deploy_qa/vercel.json"
git add "NEXUS FITNES/scripts/smoke_sw_cache.js"
git add "NEXUS FITNES/docs/SPRINT1_5_DIA3_C.md"
git add "SCRIPTS_DEPLOY/commit_message_sprint1_5_dia3_c.txt"
git add "SCRIPTS_DEPLOY/deploy_y_versionar_sprint1_5_dia3_c.ps1"

Write-Host ""
Write-Host "PASO 5/5: Commit + Push" -ForegroundColor Cyan
git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile

git push origin main

Write-Host ""
Write-Host "=== SPRINT 1.5 DIA 3.C DEPLOYADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Verificacion (3 min):" -ForegroundColor Yellow
Write-Host "  1. F12 console al cargar: '[NX_SW] registrado · scope=...'" -ForegroundColor Yellow
Write-Host "  2. F12 console: await window.NX_SW.ping()" -ForegroundColor Yellow
Write-Host "     -> {cacheName: 'nx-yuhonas-images-v1', version: 1}" -ForegroundColor Yellow
Write-Host "  3. DevTools > Application > Service Workers" -ForegroundColor Yellow
Write-Host "     -> sw.js activado · scope '/'" -ForegroundColor Yellow
Write-Host "  4. CSP sin errores 'Refused to load image from raw.githubusercontent.com'" -ForegroundColor Yellow
Write-Host "  5. Sprint 1.5 anterior funcionando: NX_CATALOG fetch OK · NX_DEXIE activo" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pendiente Sprint 1.5 D4 (cierre formal):" -ForegroundColor Cyan
Write-Host "  - Doc resumen ejecutivo Sprint 1.5 completo" -ForegroundColor Cyan
Write-Host "  - Update DEMO_CONTEXT.md" -ForegroundColor Cyan
Write-Host "  - Tag git v19.41.0 o similar" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backlog Sprint 1.6:" -ForegroundColor Cyan
Write-Host "  - D3.B traduccion LLM (postponed)" -ForegroundColor Cyan
Write-Host "  - Render thumbnail imagenes en filas EXT" -ForegroundColor Cyan
Write-Host ""
