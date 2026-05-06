# DEPLOY_NEXUS_FITNESS.ps1 — deploy 1-click a Vercel
# Uso (desde NEXUS FITNES/):
#   .\DEPLOY_NEXUS_FITNESS.ps1
#
# Reemplaza el flujo bash (1_prepare_build.sh + 2_deploy.sh) que requiere WSL.
# Hace 3 cosas:
#   1) Copia el HTML fuente al public/ del deploy
#   2) Verifica que vercel CLI esté instalada y con sesión
#   3) Ejecuta vercel deploy --prod desde deploy_qa/

$ErrorActionPreference = "Stop"

# ── Resolver paths ───────────────────────────────────────────────────────
$ROOT       = $PSScriptRoot
$SOURCE     = Join-Path $ROOT "dashboard\NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
$DEPLOY_DIR = Join-Path $ROOT "deploy_qa"
$TARGET     = Join-Path $DEPLOY_DIR "public\index.html"

Write-Host ""
Write-Host "==============================================" -ForegroundColor DarkYellow
Write-Host " NEXUS Fitness · Deploy a Vercel produccion " -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor DarkYellow
Write-Host ""

# ── Verificación 1 · existe el HTML fuente ──────────────────────────────
if (-not (Test-Path $SOURCE)) {
    Write-Host "FAIL · No existe el HTML fuente:" -ForegroundColor Red
    Write-Host "  $SOURCE" -ForegroundColor Red
    exit 1
}
$srcSize = [math]::Round((Get-Item $SOURCE).Length / 1KB, 1)
Write-Host "[1/4] HTML fuente OK ($srcSize KB)" -ForegroundColor Green

# ── Verificación 2 · vercel CLI ─────────────────────────────────────────
try {
    $vercelVersion = & vercel --version 2>$null
    Write-Host "[2/4] Vercel CLI $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "FAIL · Vercel CLI no instalada. Correr:" -ForegroundColor Red
    Write-Host "  npm install -g vercel" -ForegroundColor Yellow
    exit 2
}

# ── Verificación 3 · sesión Vercel activa ──────────────────────────────
$whoami = & vercel whoami 2>$null
if (-not $whoami -or $whoami -match "Error") {
    Write-Host "FAIL · No hay sesion Vercel. Correr:" -ForegroundColor Red
    Write-Host "  vercel login" -ForegroundColor Yellow
    exit 3
}
Write-Host "      sesion: $whoami" -ForegroundColor DarkGray

# ── Copy HTML al public/ ────────────────────────────────────────────────
Copy-Item $SOURCE $TARGET -Force
$tgtSize = [math]::Round((Get-Item $TARGET).Length / 1KB, 1)
$tgtHash = (Get-FileHash $TARGET -Algorithm SHA256).Hash.Substring(0,16)
Write-Host "[3/4] Copiado a deploy_qa\public\index.html ($tgtSize KB · sha=$tgtHash)" -ForegroundColor Green

# ── Deploy ──────────────────────────────────────────────────────────────
Write-Host "[4/4] Lanzando vercel deploy --prod desde deploy_qa\" -ForegroundColor Cyan
Write-Host "      (puede tardar 30-60s)" -ForegroundColor DarkGray
Write-Host ""

Push-Location $DEPLOY_DIR
try {
    & vercel deploy --prod
    $deployExit = $LASTEXITCODE
} finally {
    Pop-Location
}

Write-Host ""
if ($deployExit -eq 0) {
    Write-Host "==============================================" -ForegroundColor DarkGreen
    Write-Host " Deploy COMPLETADO" -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor DarkGreen
    Write-Host "Si la URL principal del proyecto Vercel se mantiene fija," -ForegroundColor DarkGray
    Write-Host "avisa a Ariel/QA con: 'Hay version nueva, refrescar con Ctrl+Shift+R'" -ForegroundColor DarkGray
} else {
    Write-Host "Deploy FALLO con exit code $deployExit" -ForegroundColor Red
    exit $deployExit
}
