# =====================================================================
# deploy_hotfix_thumbs_diagnostic.ps1
# HOTFIX v2028.31 · fotos en rutina + diagnostic fix · 2026-05-11
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_hotfix_thumbs_diagnostic.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== HOTFIX v2028.31 · fotos rutina + diagnostic ===" -ForegroundColor Cyan

$srcPath = "$repoPath\NEXUS FITNES\dashboard\NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
$dstPath = "$repoPath\NEXUS FITNES\deploy_qa\public\index.html"
Copy-Item $srcPath $dstPath -Force

$srcMd5 = (Get-FileHash $srcPath -Algorithm MD5).Hash
$dstMd5 = (Get-FileHash $dstPath -Algorithm MD5).Hash
Write-Host "MD5: $srcMd5 (match: $($srcMd5 -eq $dstMd5))"
if ($srcMd5 -ne $dstMd5) { Write-Host "ABORT - md5 mismatch" -ForegroundColor Red; exit 1 }

Write-Host ""
git status --short

Push-Location "$repoPath\NEXUS FITNES\deploy_qa"
try { & npx vercel deploy --prod } finally { Pop-Location }

git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "NEXUS FITNES/deploy_qa/public/index.html"
git add "SCRIPTS_DEPLOY/commit_message_hotfix_thumbs_diagnostic.txt"
git add "SCRIPTS_DEPLOY/deploy_hotfix_thumbs_diagnostic.ps1"
git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main

Write-Host ""
Write-Host "=== v2028.31 deploy COMPLETO ===" -ForegroundColor Green
Write-Host "Ariel: refresh incognito · badge v2028.31 · regenerar rutina · fotos visibles" -ForegroundColor Yellow
