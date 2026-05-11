# =====================================================================
# deploy_reporte_diagnostico.ps1
# v2028.27 · Botón Reportar problema · 2026-05-10 noche
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_reporte_diagnostico.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_reporte_diagnostico.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== v2028.27 deploy · Boton Reportar problema ===" -ForegroundColor Cyan
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
git add "NEXUS FITNES/scripts/smoke_hotfix_reporte_diagnostico.js"
git add "SCRIPTS_DEPLOY/commit_message_reporte_diagnostico.txt"
git add "SCRIPTS_DEPLOY/deploy_reporte_diagnostico.ps1"

git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main

Write-Host ""
Write-Host "=== v2028.27 deploy COMPLETO ===" -ForegroundColor Green
Write-Host ""
Write-Host "PARA ARIEL (en navegador incognito):" -ForegroundColor Yellow
Write-Host "1. Abrir https://nexus-fitness-ruby.vercel.app en INCOGNITO" -ForegroundColor White
Write-Host "2. Generar rutina Michael Lopez como hizo antes" -ForegroundColor White
Write-Host "3. Click en boton naranja 'Reportar problema' (esquina INFERIOR IZQUIERDA)" -ForegroundColor White
Write-Host "4. Va a salir mensaje 'Diagnostico copiado'" -ForegroundColor White
Write-Host "5. Pegar (Ctrl+V) en chat" -ForegroundColor White
Write-Host ""
Write-Host "Con eso vemos exactamente que nivel, modifiers, equipos cargo Ariel" -ForegroundColor Cyan
Write-Host "y que ejercicios eligio el motor por dia." -ForegroundColor Cyan
Write-Host ""
