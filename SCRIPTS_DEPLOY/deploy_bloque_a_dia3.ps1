# =====================================================================
# deploy_bloque_a_dia3.ps1
# Bloque A · Día 3 · desambiguación yuhonas + audit Bug 6 PDF · v2028.32
# Sprint CRÍTICO post-reunión Ariel 2026-05-11
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_bloque_a_dia3.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== BLOQUE A Dia 3 · desambiguacion yuhonas duplicados ===" -ForegroundColor Cyan
Write-Host ""

$srcPath = "$repoPath\NEXUS FITNES\dashboard\NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
$dstPath = "$repoPath\NEXUS FITNES\deploy_qa\public\index.html"

Copy-Item $srcPath $dstPath -Force

$srcMd5 = (Get-FileHash $srcPath -Algorithm MD5).Hash
$dstMd5 = (Get-FileHash $dstPath -Algorithm MD5).Hash
Write-Host "MD5: $srcMd5 (match: $($srcMd5 -eq $dstMd5))" -ForegroundColor Yellow
if ($srcMd5 -ne $dstMd5) { Write-Host "ABORT" -ForegroundColor Red; exit 1 }

Write-Host ""
git status --short

Push-Location "$repoPath\NEXUS FITNES\deploy_qa"
try { & npx vercel deploy --prod } finally { Pop-Location }

git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "NEXUS FITNES/deploy_qa/public/index.html"
git add "NEXUS FITNES/scripts/desambiguar_yuhonas_v2.js"
git add "NEXUS FITNES/scripts/desambiguar_yuhonas_duplicados.js"
git add "SCRIPTS_DEPLOY/commit_message_bloque_a_dia3.txt"
git add "SCRIPTS_DEPLOY/deploy_bloque_a_dia3.ps1"
git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main

Write-Host ""
Write-Host "=== Dia 3 deploy COMPLETO ===" -ForegroundColor Green
Write-Host ""
Write-Host "VALIDACION CON ARIEL (TeamViewer + incognito):" -ForegroundColor Yellow
Write-Host "1. Abrir https://nexus-fitness-ruby.vercel.app · badge v2028.32" -ForegroundColor White
Write-Host "2. Generar rutina NICO simil (24M · 6 dias · Tonificacion · L3)" -ForegroundColor White
Write-Host "3. Verificar en PDF:" -ForegroundColor White
Write-Host "   - Press de banca en dia Pecho · variantes con sufijo descriptivo en Brazos" -ForegroundColor White
Write-Host "   - 0 ejercicios duplicados con nombre identico" -ForegroundColor White
Write-Host "   - Apartado complementarios al final del PDF" -ForegroundColor White
Write-Host ""
Write-Host "Si Ariel valida · Bloque A se cierra · arrancamos Bloque B (audit conjunta KB)" -ForegroundColor Cyan
Write-Host ""
