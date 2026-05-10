# =====================================================================
# deploy_y_versionar_sprint2_d3.ps1
# Sprint 2 D3 · Check-in dia + sensaciones · 2026-05-10
#
# Cambios: SENSATIONS_KEY + nxStudentCheckIn modal + CTA dual.
# md5 parity-check pre-deploy embebido.
# Total Sprint 2 D3 acumulado: 129/130 asserts (8 smokes · 1 WARN preexistente).
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_y_versionar_sprint2_d3.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint2_d3.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== Sprint 2 D3 deploy · Check-in del dia + sensaciones ===" -ForegroundColor Cyan
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
git add "NEXUS FITNES/scripts/smoke_student_checkin.js"
git add "NEXUS FITNES/docs/SPRINT2_D3.md"
git add "SCRIPTS_DEPLOY/commit_message_sprint2_d3.txt"
git add "SCRIPTS_DEPLOY/deploy_y_versionar_sprint2_d3.ps1"

git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile

git push origin main

Write-Host ""
Write-Host "=== SPRINT 2 D3 DEPLOYADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Verificacion (3 min):" -ForegroundColor Yellow
Write-Host "  1. Vista Alumna ?student=ID:" -ForegroundColor Yellow
Write-Host "     - CTA dual: 'Ver mi rutina' + 'Hice mi rutina hoy' (verde)" -ForegroundColor Yellow
Write-Host "     - Click 'Hice' -> modal con 5 emojis + textarea" -ForegroundColor Yellow
Write-Host "     - Tap emoji -> border naranja highlight" -ForegroundColor Yellow
Write-Host "     - 'Marcar hecho' -> toast '!Sumaste tu sesion!'" -ForegroundColor Yellow
Write-Host "     - Grid semana muestra ✓ + CTA cambia a 'Hecho hoy' disabled" -ForegroundColor Yellow
Write-Host "  2. Reload -> ✓ persiste (LS sobrevive)" -ForegroundColor Yellow
Write-Host "  3. Console: localStorage.getItem('nx_sensations')" -ForegroundColor Yellow
Write-Host ""
Write-Host "Sprint 2 D4 (cierre formal):" -ForegroundColor Cyan
Write-Host "  - Validacion final + Ariel manda link a Luz" -ForegroundColor Cyan
Write-Host ""
