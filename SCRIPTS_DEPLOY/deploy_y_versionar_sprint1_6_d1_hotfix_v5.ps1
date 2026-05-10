# Sprint 1.6 D1 HOTFIX v5 · thumb en rutina + AUDIT SISTEMATICO dark · 2026-05-10
$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint1_6_d1_hotfix_v5.txt"
Set-Location $repoPath
Write-Host "=== Sprint 1.6 D1 HOTFIX v5 ===" -ForegroundColor Cyan
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
git add "NEXUS FITNES/scripts/smoke_hotfix_d1_v5.js"
git add "SCRIPTS_DEPLOY/commit_message_sprint1_6_d1_hotfix_v5.txt"
git add "SCRIPTS_DEPLOY/deploy_y_versionar_sprint1_6_d1_hotfix_v5.ps1"
git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main
Write-Host "=== HOTFIX v5 DEPLOYADO ===" -ForegroundColor Green
Write-Host "Verificacion (5 min):" -ForegroundColor Yellow
Write-Host "  1. Click EXT con thumb -> ej en rutina CON foto (no icono grupo)" -ForegroundColor Yellow
Write-Host "  2. Dark mode banner amarillo · legible (no negro sobre claro)" -ForegroundColor Yellow
Write-Host "  3. Dark mode tags 'manual' / 'sustituido' contraste OK" -ForegroundColor Yellow
