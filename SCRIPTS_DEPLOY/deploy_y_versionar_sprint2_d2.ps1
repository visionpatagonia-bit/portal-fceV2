# =====================================================================
# deploy_y_versionar_sprint2_d2.ps1
# Sprint 2 D2 · Hero alumna pulido + fix install + MIME fix · 2026-05-10
#
# Cambios:
#  - nxRenderStudentEnhancements (CTA + Footer + Microcopy)
#  - Fix bug install button D1 (setTimeout defer)
#  - vercel.json MIME fix (svg + manifest)
# md5 parity-check pre-deploy embebido.
# Total Sprint 2 D2 acumulado: 118/119 asserts (7 smokes · 1 WARN preexistente).
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_y_versionar_sprint2_d2.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint2_d2.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== Sprint 2 D2 deploy · Hero alumna pulido + fixes ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASO 1/5: md5 parity-check master vs deploy_qa" -ForegroundColor Cyan
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

Write-Host "PASO 2/5: Estado git" -ForegroundColor Cyan
git status --short
Write-Host ""

Write-Host "PASO 3/5: Deploy Vercel (incluye vercel.json MIME fix)" -ForegroundColor Cyan
Push-Location "$repoPath\NEXUS FITNES\deploy_qa"
try { & npx vercel deploy --prod } finally { Pop-Location }
Write-Host ""

Write-Host "PASO 4/5: Stage archivos" -ForegroundColor Cyan
git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "NEXUS FITNES/deploy_qa/vercel.json"
git add "NEXUS FITNES/scripts/smoke_student_enhancements.js"
git add "NEXUS FITNES/docs/SPRINT2_D2.md"
git add "SCRIPTS_DEPLOY/commit_message_sprint2_d2.txt"
git add "SCRIPTS_DEPLOY/deploy_y_versionar_sprint2_d2.ps1"

Write-Host ""
Write-Host "PASO 5/5: Commit + Push" -ForegroundColor Cyan
git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile

git push origin main

Write-Host ""
Write-Host "=== SPRINT 2 D2 DEPLOYADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Verificacion (3 min):" -ForegroundColor Yellow
Write-Host "  1. Vista Alumna ?student=ID en ventana NORMAL (no incognito):" -ForegroundColor Yellow
Write-Host "     - Topbar: saludo calido contextual segun hora" -ForegroundColor Yellow
Write-Host "     - CTA naranja 'Ver mi rutina del dia' bajo el hero" -ForegroundColor Yellow
Write-Host "     - Click CTA -> scroll suave a rutina" -ForegroundColor Yellow
Write-Host "     - Footer 'ANUBIS ATHLETIC CENTER' al final" -ForegroundColor Yellow
Write-Host "     - Boton 'Instalar' visible si NX_PWA.canInstall (FIX D1)" -ForegroundColor Yellow
Write-Host "  2. Console SIN error 'anubis_icon.svg failed to load' (MIME fix)" -ForegroundColor Yellow
Write-Host "  3. DevTools > Application > Manifest: SVG icon load OK" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pendiente Sprint 2:" -ForegroundColor Cyan
Write-Host "  - D3 (~1.5h): Check-in dia + anotador Dexie" -ForegroundColor Cyan
Write-Host "  - D4 (~1h): smoke + deploy + Ariel manda link a Luz" -ForegroundColor Cyan
Write-Host ""
