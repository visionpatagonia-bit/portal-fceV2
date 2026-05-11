# =====================================================================
# deploy_force_invalidation.ps1
# Force CDN invalidation + version badge visible · 2026-05-10 noche
#
# Ariel reporto seguir viendo rutina vieja tras Ctrl+Shift+R.
# Agregamos badge visible "Motor v2028.26" + redeploy fuerza CDN invalidation.
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_force_invalidation.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_force_invalidation.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== Force invalidation + version badge ===" -ForegroundColor Cyan
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
git add "SCRIPTS_DEPLOY/commit_message_force_invalidation.txt"
git add "SCRIPTS_DEPLOY/deploy_force_invalidation.ps1"

git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main

Write-Host ""
Write-Host "=== Force invalidation deploy COMPLETO ===" -ForegroundColor Green
Write-Host ""
Write-Host "PARA ARIEL:" -ForegroundColor Yellow
Write-Host "1. Abrir https://nexus-fitness-ruby.vercel.app en NAVEGADOR INCOGNITO" -ForegroundColor White
Write-Host "   (Chrome: Ctrl+Shift+N · Firefox: Ctrl+Shift+P)" -ForegroundColor White
Write-Host "2. Verificar badge naranja 'Motor v2028.26 · 2026-05-10' en esquina inferior derecha" -ForegroundColor White
Write-Host "3. Generar rutina Michael Lopez con perfil identico al anterior" -ForegroundColor White
Write-Host "4. Si dia Pecho tiene 6+ ejercicios variados + dia Cardio tiene aerobico --> FIX OK" -ForegroundColor White
Write-Host ""
Write-Host "Si badge no aparece: cache vieja en su browser" -ForegroundColor Yellow
Write-Host "  F12 -> Application -> Storage -> Clear site data" -ForegroundColor White
Write-Host ""
