# =====================================================================
# deploy_y_versionar_sprint1_6_d1_hotfix.ps1
# Sprint 1.6 D1 HOTFIX · click EXT no agrega + dark L1-L5 + badge glow
# 2026-05-10 tarde · post user feedback
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint1_6_d1_hotfix.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== Sprint 1.6 D1 HOTFIX deploy ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASO 1/4: md5 parity-check" -ForegroundColor Cyan
$srcPath = "$repoPath\NEXUS FITNES\dashboard\NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
$dstPath = "$repoPath\NEXUS FITNES\deploy_qa\public\index.html"
Copy-Item $srcPath $dstPath -Force
$srcMd5 = (Get-FileHash $srcPath -Algorithm MD5).Hash
$dstMd5 = (Get-FileHash $dstPath -Algorithm MD5).Hash
Write-Host "MD5: $srcMd5"
if ($srcMd5 -ne $dstMd5) { Write-Host "ABORT" -ForegroundColor Red; exit 1 }
Write-Host "OK md5 coincide" -ForegroundColor Green
Write-Host ""

Write-Host "PASO 2/4: git status" -ForegroundColor Cyan
git status --short
Write-Host ""

Write-Host "PASO 3/4: Vercel deploy" -ForegroundColor Cyan
Push-Location "$repoPath\NEXUS FITNES\deploy_qa"
try { & npx vercel deploy --prod } finally { Pop-Location }
Write-Host ""

Write-Host "PASO 4/4: Commit + Push" -ForegroundColor Cyan
git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "NEXUS FITNES/scripts/smoke_hotfix_d1.js"
git add "NEXUS FITNES/scripts/smoke_extended_ui.js"
git add "SCRIPTS_DEPLOY/commit_message_sprint1_6_d1_hotfix.txt"
git add "SCRIPTS_DEPLOY/deploy_y_versionar_sprint1_6_d1_hotfix.ps1"
git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main

Write-Host ""
Write-Host "=== HOTFIX DEPLOYADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Verificacion (3 min):" -ForegroundColor Yellow
Write-Host "  1. Modal +Agregar + toggle EXT ON:" -ForegroundColor Yellow
Write-Host "     - Click en fila EXT con thumbnail -> AGREGA ejercicio (FIX!)" -ForegroundColor Yellow
Write-Host "     - Filas curadas: click sigue OK (regression)" -ForegroundColor Yellow
Write-Host "  2. Toggle modo oscuro (luna):" -ForegroundColor Yellow
Write-Host "     - Badges L1/L2/L3/L4/L5 visibles con colores apropiados" -ForegroundColor Yellow
Write-Host "     - Badge EXT con glow azul sobre fondo oscuro" -ForegroundColor Yellow
Write-Host "  3. Console F12 sin errores nuevos" -ForegroundColor Yellow
Write-Host ""
