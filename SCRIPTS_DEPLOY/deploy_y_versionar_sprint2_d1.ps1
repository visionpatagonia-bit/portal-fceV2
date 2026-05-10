# =====================================================================
# deploy_y_versionar_sprint2_d1.ps1
# Sprint 2 D1 · PWA install · 2026-05-10 madrugada
#
# Cambios: manifest.webmanifest NEW + 4 iconos NEW + window.NX_PWA API +
#          boton 'Instalar' topbar alumna + persistence/redirect logic.
# md5 parity-check pre-deploy embebido.
# Total Sprint 2 D1 acumulado: 109/110 asserts (6 smokes · 1 WARN preexistente).
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_y_versionar_sprint2_d1.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint2_d1.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== Sprint 2 D1 deploy · PWA install ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASO 1/5: md5 parity-check + manifest + iconos presentes" -ForegroundColor Cyan
$srcPath = "$repoPath\NEXUS FITNES\dashboard\NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
$dstPath = "$repoPath\NEXUS FITNES\deploy_qa\public\index.html"
$manifestPath = "$repoPath\NEXUS FITNES\deploy_qa\public\manifest.webmanifest"

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

if (-not (Test-Path $manifestPath)) {
    Write-Host "ABORT - manifest.webmanifest no existe" -ForegroundColor Red
    exit 1
}
Write-Host "OK manifest.webmanifest presente" -ForegroundColor Green

$icons = @("anubis_icon.svg", "anubis_icon_192.png", "anubis_icon_512.png", "anubis_icon_maskable_512.png")
foreach ($icon in $icons) {
    $iconPath = "$repoPath\NEXUS FITNES\deploy_qa\public\$icon"
    if (-not (Test-Path $iconPath)) {
        Write-Host "ABORT - $icon no existe" -ForegroundColor Red
        exit 1
    }
}
Write-Host "OK 4 iconos presentes (svg + 192 + 512 + maskable)" -ForegroundColor Green
Write-Host ""

Write-Host "PASO 2/5: Estado git" -ForegroundColor Cyan
git status --short
Write-Host ""

Write-Host "PASO 3/5: Deploy Vercel (incluye manifest + iconos)" -ForegroundColor Cyan
Push-Location "$repoPath\NEXUS FITNES\deploy_qa"
try { & npx vercel deploy --prod } finally { Pop-Location }
Write-Host ""

Write-Host "PASO 4/5: Stage archivos" -ForegroundColor Cyan
git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "NEXUS FITNES/deploy_qa/public/manifest.webmanifest"
git add "NEXUS FITNES/deploy_qa/public/anubis_icon.svg"
git add "NEXUS FITNES/deploy_qa/public/anubis_icon_192.png"
git add "NEXUS FITNES/deploy_qa/public/anubis_icon_512.png"
git add "NEXUS FITNES/deploy_qa/public/anubis_icon_maskable_512.png"
git add "NEXUS FITNES/scripts/smoke_pwa_install.js"
git add "NEXUS FITNES/docs/SPRINT2_D1.md"
git add "SCRIPTS_DEPLOY/commit_message_sprint2_d1.txt"
git add "SCRIPTS_DEPLOY/deploy_y_versionar_sprint2_d1.ps1"

Write-Host ""
Write-Host "PASO 5/5: Commit + Push" -ForegroundColor Cyan
git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile

git push origin main

Write-Host ""
Write-Host "=== SPRINT 2 D1 DEPLOYADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Verificacion (5 min · ideal: 1 desktop + 1 mobile):" -ForegroundColor Yellow
Write-Host "  1. F12 console: '[NX_PWA] browser web · SW controlando · install puede aparecer pronto'" -ForegroundColor Yellow
Write-Host "  2. F12: window.NX_PWA.canInstall() despues de 1-2 min engagement" -ForegroundColor Yellow
Write-Host "  3. DevTools > Application > Manifest: carga sin errores · iconos visibles" -ForegroundColor Yellow
Write-Host "  4. Lighthouse > PWA audit: Installable check pass" -ForegroundColor Yellow
Write-Host "  5. Vista Alumna en celular real (?student=ID):" -ForegroundColor Yellow
Write-Host "     - Boton 'Instalar' visible en topbar" -ForegroundColor Yellow
Write-Host "     - Click -> prompt nativo browser" -ForegroundColor Yellow
Write-Host "     - Accept -> app aparece en home con icono A naranja" -ForegroundColor Yellow
Write-Host "     - Click home icon -> app abre standalone" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pendiente Sprint 2:" -ForegroundColor Cyan
Write-Host "  - D2 (~2h): Hero alumna pulido + branding fuerte" -ForegroundColor Cyan
Write-Host "  - D3 (~1.5h): Check-in dia + anotador Dexie" -ForegroundColor Cyan
Write-Host "  - D4 (~1h): smoke + deploy + Ariel manda link a Luz" -ForegroundColor Cyan
Write-Host ""
