# Sprint 1.6 D1 HOTFIX v4 · 3 fixes raíz · 2026-05-10 tarde
$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint1_6_d1_hotfix_v4.txt"
Set-Location $repoPath
Write-Host ""
Write-Host "=== Sprint 1.6 D1 HOTFIX v4 deploy ===" -ForegroundColor Cyan
$srcPath = "$repoPath\NEXUS FITNES\dashboard\NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
$dstPath = "$repoPath\NEXUS FITNES\deploy_qa\public\index.html"
Copy-Item $srcPath $dstPath -Force
$srcMd5 = (Get-FileHash $srcPath -Algorithm MD5).Hash
$dstMd5 = (Get-FileHash $dstPath -Algorithm MD5).Hash
Write-Host "MD5: $srcMd5"
if ($srcMd5 -ne $dstMd5) { Write-Host "ABORT" -ForegroundColor Red; exit 1 }
Write-Host "OK md5 coincide" -ForegroundColor Green
git status --short
Push-Location "$repoPath\NEXUS FITNES\deploy_qa"
try { & npx vercel deploy --prod } finally { Pop-Location }
git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "NEXUS FITNES/scripts/smoke_hotfix_d1_v4.js"
git add "SCRIPTS_DEPLOY/commit_message_sprint1_6_d1_hotfix_v4.txt"
git add "SCRIPTS_DEPLOY/deploy_y_versionar_sprint1_6_d1_hotfix_v4.ps1"
git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main
Write-Host ""
Write-Host "=== HOTFIX v4 DEPLOYADO ===" -ForegroundColor Green
Write-Host "Verificacion (3 min):" -ForegroundColor Yellow
Write-Host "  1. Modal +Agregar + toggle EXT ON · click en fila EXT" -ForegroundColor Yellow
Write-Host "     -> Toast + ejercicio APARECE en la lista del dia (FIX!)" -ForegroundColor Yellow
Write-Host "  2. Modo oscuro · click chip equipamiento" -ForegroundColor Yellow
Write-Host "     -> Se ilumina naranja Anubis (FIX!)" -ForegroundColor Yellow
Write-Host "  3. Form nuevo de generacion" -ForegroundColor Yellow
Write-Host "     -> Equipamiento muestra TODAS las chips pre-seleccionadas (FIX!)" -ForegroundColor Yellow
