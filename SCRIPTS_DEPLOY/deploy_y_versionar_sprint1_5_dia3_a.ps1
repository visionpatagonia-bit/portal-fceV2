# =====================================================================
# deploy_y_versionar_sprint1_5_dia3_a.ps1
# Sprint 1.5 Dia 3.A · UI buscador catalogo extendido · 2026-05-09 noche
#
# Cambios: NX_CATALOG wrapper + nxCatalogToEX + UI toggle en openAddModal +
#          addToDay soporta ambos catalogos.
# md5 parity-check pre-deploy embebido.
# Total Sprint 1.5 acumulado: 84/85 asserts (1 WARN preexistente).
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_y_versionar_sprint1_5_dia3_a.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint1_5_dia3_a.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== Sprint 1.5 Dia 3.A deploy ===" -ForegroundColor Cyan
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
git add "NEXUS FITNES/scripts/smoke_nx_catalog.js"
git add "NEXUS FITNES/scripts/smoke_extended_ui.js"
git add "NEXUS FITNES/docs/SPRINT1_5_DIA3_A.md"
git add "SCRIPTS_DEPLOY/commit_message_sprint1_5_dia3_a.txt"
git add "SCRIPTS_DEPLOY/deploy_y_versionar_sprint1_5_dia3_a.ps1"

git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile

git push origin main

Write-Host ""
Write-Host "=== SPRINT 1.5 DIA 3.A DEPLOYADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Verificacion (3 min):" -ForegroundColor Yellow
Write-Host "  1. Generar rutina cualquiera y abrir + Agregar ejercicio en cualquier dia" -ForegroundColor Yellow
Write-Host "     -> debe aparecer toggle 'Incluir catalogo extendido (873 EJ · BETA)' default OFF" -ForegroundColor Yellow
Write-Host "  2. Click toggle ON: status muestra 'Cargando 873 ejercicios...' luego '873 ejercicios disponibles · 41% con nombre en espanol'" -ForegroundColor Yellow
Write-Host "  3. Search 'press': mezcla curado + extendido (filas con badge EXT azul)" -ForegroundColor Yellow
Write-Host "  4. Click una fila EXT: agrega ejercicio al dia · toast 'Agregado del catalogo extendido: ...'" -ForegroundColor Yellow
Write-Host "  5. F12 console: window.NX_CATALOG.getStats() retorna {total:873, ...}" -ForegroundColor Yellow
Write-Host "  6. Recargar pagina con toggle ON activado: lee desde Dexie sin fetch (mas rapido)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pendiente Dia 3.B/C (proxima sesion):" -ForegroundColor Cyan
Write-Host "  - 3.B: lazy LLM traduccion instructions on-click + cache Dexie" -ForegroundColor Cyan
Write-Host "  - 3.C: SW cache imagenes raw.githubusercontent.com (50MB budget)" -ForegroundColor Cyan
Write-Host ""
