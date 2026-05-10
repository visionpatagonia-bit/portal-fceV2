# Sprint 1.6 D2 · Modal lightbox educativo (vision Juan) · 2026-05-10 tarde
$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint1_6_d2.txt"
Set-Location $repoPath
Write-Host "=== Sprint 1.6 D2 · Lightbox educativo ===" -ForegroundColor Cyan
$srcPath = "$repoPath\NEXUS FITNES\dashboard\NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
$dstPath = "$repoPath\NEXUS FITNES\deploy_qa\public\index.html"
Copy-Item $srcPath $dstPath -Force
$srcMd5 = (Get-FileHash $srcPath -Algorithm MD5).Hash
Write-Host "MD5: $srcMd5"
if ($srcMd5 -ne (Get-FileHash $dstPath -Algorithm MD5).Hash) { Write-Host "ABORT" -ForegroundColor Red; exit 1 }
Write-Host "OK md5" -ForegroundColor Green
git status --short
Push-Location "$repoPath\NEXUS FITNES\deploy_qa"
try { & npx vercel deploy --prod } finally { Pop-Location }
git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "NEXUS FITNES/scripts/smoke_lightbox.js"
git add "SCRIPTS_DEPLOY/commit_message_sprint1_6_d2.txt"
git add "SCRIPTS_DEPLOY/deploy_y_versionar_sprint1_6_d2.ps1"
git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main
Write-Host "=== SPRINT 1.6 D2 DEPLOYADO ===" -ForegroundColor Green
Write-Host "Verificacion (5 min):" -ForegroundColor Yellow
Write-Host "  1. Modal +Agregar + EXT ON:" -ForegroundColor Yellow
Write-Host "     - Click thumb -> agrega (regression)" -ForegroundColor Yellow
Write-Host "     - Click ⓘ -> abre lightbox con imagen 1+2 + instructions" -ForegroundColor Yellow
Write-Host "     - CTA 'Agregar a este dia' funciona desde el modal" -ForegroundColor Yellow
Write-Host "  2. Rutina renderizada:" -ForegroundColor Yellow
Write-Host "     - Hover thumb -> cursor:zoom-in" -ForegroundColor Yellow
Write-Host "     - Click thumb -> abre lightbox (solo lectura · sin CTA)" -ForegroundColor Yellow
Write-Host "  3. ESC cierra · click fuera del card cierra" -ForegroundColor Yellow
Write-Host "  4. Curado sin imagen: placeholder coach" -ForegroundColor Yellow
