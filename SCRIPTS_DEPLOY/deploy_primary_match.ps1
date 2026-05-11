# =====================================================================
# deploy_primary_match.ps1
# v2028.28 · primary_muscle alineado con group · 2026-05-10 noche
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_primary_match.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_primary_match.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== v2028.28 deploy · primary_muscle alineado con group ===" -ForegroundColor Cyan
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
git add "NEXUS FITNES/deploy_qa/public/index.html"
git add "NEXUS FITNES/scripts/smoke_hotfix_primary_match.js"
git add "SCRIPTS_DEPLOY/commit_message_primary_match.txt"
git add "SCRIPTS_DEPLOY/deploy_primary_match.ps1"

git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main

Write-Host ""
Write-Host "=== v2028.28 deploy COMPLETO ===" -ForegroundColor Green
Write-Host ""
Write-Host "PARA ARIEL:" -ForegroundColor Yellow
Write-Host "1. Abrir https://nexus-fitness-ruby.vercel.app en INCOGNITO" -ForegroundColor White
Write-Host "2. Generar rutina Michael Lopez con el mismo perfil que antes" -ForegroundColor White
Write-Host "3. En dia Pecho: ahora todos los ejercicios deberian decir 'pectoral' en su descripcion" -ForegroundColor White
Write-Host "4. Si ve flexiones diamante (Triceps) o fondos paralelas con descripcion 'hombros' -> avisame" -ForegroundColor White
Write-Host ""
