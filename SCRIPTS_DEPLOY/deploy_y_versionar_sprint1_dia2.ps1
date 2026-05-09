# =====================================================================
# deploy_y_versionar_sprint1_dia2.ps1
# Sprint 1 Stack A · Día 2 · 2026-05-09
#
# Cambios incluidos en este deploy:
#   - NX_DEXIE wrapper con schema CRDT-ready (single table 'kv')
#   - Flag URL ?dexie=1 detect (NX_USE_DEXIE boolean)
#   - Proxy dual-write ramificado condicional
#   - 3 smokes nuevos persistentes en repo (CRUD · migration · grilla cartesiana)
#
# Protección a Ariel:
#   Sin flag (URL sin parámetros) · NEXUS funciona como hoy · cero riesgo.
#   Con flag (?dexie=1) · Dexie como backup primario · validación 48h yo solo.
#
# md5 parity-check pre-deploy embebido (lección incidente deploy_qa truncado).
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_y_versionar_sprint1_dia2.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint1_dia2.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== PASO 1/4: md5 parity-check (master vs deploy_qa) ===" -ForegroundColor Cyan
$srcPath = "$repoPath\NEXUS FITNES\dashboard\NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
$dstPath = "$repoPath\NEXUS FITNES\deploy_qa\public\index.html"

# Sincronizar primero (el sandbox ya lo hizo · pero forzamos por las dudas)
Copy-Item $srcPath $dstPath -Force

$srcMd5 = (Get-FileHash $srcPath -Algorithm MD5).Hash
$dstMd5 = (Get-FileHash $dstPath -Algorithm MD5).Hash

Write-Host "MD5 master:    $srcMd5"
Write-Host "MD5 deploy_qa: $dstMd5"

if ($srcMd5 -ne $dstMd5) {
    Write-Host ""
    Write-Host "ABORT · md5 mismatch · revisar deploy_qa antes de seguir" -ForegroundColor Red
    exit 1
}
Write-Host "OK md5 coincide" -ForegroundColor Green
Write-Host ""

Write-Host "=== PASO 2/4: Estado git ===" -ForegroundColor Cyan
git status --short
Write-Host ""

Write-Host "=== PASO 3/4: Deploy Vercel nexus-fitness-ruby ===" -ForegroundColor Cyan
Write-Host "Ejecutando npx vercel deploy --prod..."
Push-Location "$repoPath\NEXUS FITNES\deploy_qa"
try { & npx vercel deploy --prod } finally { Pop-Location }
Write-Host ""

Write-Host "=== PASO 4/4: Commit + Push Sprint 1 Dia 2 ===" -ForegroundColor Cyan
git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "NEXUS FITNES/scripts/smoke_dexie_crud.js"
git add "NEXUS FITNES/scripts/smoke_dexie_migration.js"
git add "NEXUS FITNES/scripts/smoke_grilla_cartesiana.js"
git add "NEXUS FITNES/docs/SPRINT1_DIA0_PREFLIGHT.md"
git add "NEXUS FITNES/docs/SPRINT1_DIA1_CIERRE.md"
git add "SCRIPTS_DEPLOY/deploy_y_versionar_sprint1_dia2.ps1"
git add "SCRIPTS_DEPLOY/commit_message_sprint1_dia2.txt"

git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile

git push origin main

Write-Host ""
Write-Host "=== Sprint 1 Dia 2 deployed ===" -ForegroundColor Green
Write-Host ""
Write-Host "Verificacion sugerida (5 min · navegador anonimo):" -ForegroundColor Yellow
Write-Host "  1. Abrir https://nexus-fitness-ruby.vercel.app/?dexie=1" -ForegroundColor Yellow
Write-Host "  2. F12 -> Console -> typeof NX_USE_DEXIE     (debe responder: 'boolean')" -ForegroundColor Yellow
Write-Host "  3. F12 -> Console -> NX_USE_DEXIE            (debe responder: true)" -ForegroundColor Yellow
Write-Host "  4. Cargar un cliente y modificar algo · ver mensaje [NX_DEXIE] en console" -ForegroundColor Yellow
Write-Host ""
Write-Host "Verificacion sin flag (Ariel intacta):" -ForegroundColor Yellow
Write-Host "  1. Abrir https://nexus-fitness-ruby.vercel.app (sin ?dexie)" -ForegroundColor Yellow
Write-Host "  2. F12 -> Console -> NX_USE_DEXIE            (debe responder: false)" -ForegroundColor Yellow
Write-Host "  3. Todo funciona como hoy · LS primario · nxBackupStore backup" -ForegroundColor Yellow
Write-Host ""
Write-Host "Validacion 48h yo solo con flag · Ariel sigue sin tocar URL." -ForegroundColor Green
