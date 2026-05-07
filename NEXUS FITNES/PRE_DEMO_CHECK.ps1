# =====================================================================
# PRE_DEMO_CHECK.ps1 · Verificación pre-demo Anubis (9-may)
# =====================================================================
# Corre 5 checks críticos antes de la demo. Falla rápido si algo está mal.
#
# Uso (desde NEXUS FITNES/):
#   .\PRE_DEMO_CHECK.ps1
#
# Exit code: 0 = todo OK · 1 = al menos un check falló
# =====================================================================

$ErrorActionPreference = "Stop"
$ROOT     = $PSScriptRoot
$SOURCE   = Join-Path $ROOT "dashboard\NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
$TARGET   = Join-Path $ROOT "deploy_qa\public\index.html"
$URL      = "https://nexus-fitness-ruby.vercel.app/"

$failed = 0
function Show-Check($num, $name, $ok, $detail = "") {
    if ($ok) {
        Write-Host ("[{0}/5] OK · {1}" -f $num, $name) -ForegroundColor Green
        if ($detail) { Write-Host "       $detail" -ForegroundColor DarkGray }
    } else {
        Write-Host ("[{0}/5] FAIL · {1}" -f $num, $name) -ForegroundColor Red
        if ($detail) { Write-Host "       $detail" -ForegroundColor Yellow }
        $script:failed++
    }
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor DarkYellow
Write-Host " PRE-DEMO CHECK · NEXUS Fitness · piloto Anubis (9-may-2026)" -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor DarkYellow
Write-Host ""

# ─── CHECK 1 · HTML fuente existe + tiene tamaño razonable ───
$srcOk = $false
if (Test-Path $SOURCE) {
    $srcKB = [math]::Round((Get-Item $SOURCE).Length / 1KB, 1)
    $srcHash = (Get-FileHash $SOURCE -Algorithm SHA256).Hash.Substring(0,16)
    if ($srcKB -gt 400) {
        $srcOk = $true
        Show-Check 1 "HTML fuente OK" $true "$srcKB KB · sha=$srcHash"
    } else {
        Show-Check 1 "HTML fuente muy pequeño" $false "$srcKB KB · puede estar corrupto"
    }
} else {
    Show-Check 1 "HTML fuente no existe" $false $SOURCE
}

# ─── CHECK 2 · Deploy local idéntico al fuente ───
if ($srcOk -and (Test-Path $TARGET)) {
    $tgtHash = (Get-FileHash $TARGET -Algorithm SHA256).Hash.Substring(0,16)
    if ($srcHash -eq $tgtHash) {
        Show-Check 2 "deploy_qa\public\index.html sincronizado" $true "sha local = sha deploy"
    } else {
        Show-Check 2 "deploy_qa desincronizado" $false "sha fuente=$srcHash · sha deploy=$tgtHash · correr DEPLOY_NEXUS_FITNESS.ps1"
    }
} else {
    Show-Check 2 "deploy_qa\public\index.html no existe" $false "correr DEPLOY_NEXUS_FITNESS.ps1 antes de demo"
}

# ─── CHECK 3 · Vercel CLI disponible + sesión activa ───
try {
    $vercelV = (& vercel --version 2>$null)
    $whoami = (& vercel whoami 2>$null)
    if ($vercelV -and $whoami -and -not ($whoami -match "Error")) {
        Show-Check 3 "Vercel CLI activa" $true "v$vercelV · sesión: $whoami"
    } else {
        Show-Check 3 "Vercel CLI sin sesión" $false "correr 'vercel login'"
    }
} catch {
    Show-Check 3 "Vercel CLI no disponible" $false "npm install -g vercel"
}

# ─── CHECK 4 · URL pública responde + sirve HTML del tamaño esperado ───
try {
    $resp = Invoke-WebRequest -Uri $URL -UseBasicParsing -TimeoutSec 10
    $rsKB = [math]::Round($resp.RawContentLength / 1KB, 1)
    if ($resp.StatusCode -eq 200 -and $rsKB -gt 100) {
        # Buscar marca de versión
        $hasV2028 = $resp.Content -match "v2028\.\d+"
        $hasMobReady = $resp.Content -match "MOBILE_READY|mobile-ready|v3"
        $vMark = if ($hasV2028) { "v2028 OK" } else { "v2028 NO ENCONTRADO" }
        $mMark = if ($hasMobReady) { "v3 mobile ready OK" } else { "marca v3 NO" }
        $detailMsg = "200 OK $rsKB KB · $vMark · $mMark"
        if ($hasV2028) {
            Show-Check 4 "URL publica responde con HTML actualizado" $true $detailMsg
        } else {
            Show-Check 4 "URL publica responde pero HTML obsoleto" $false $detailMsg
        }
    } else {
        Show-Check 4 "URL publica respuesta sospechosa" $false "status=$($resp.StatusCode) $rsKB KB"
    }
} catch {
    Show-Check 4 "URL publica no responde" $false $_.Exception.Message
}

# ─── CHECK 5 · Datos pre-demo Susana/Lucía/Carlos disponibles ───
$DEMO_JSON = Join-Path $ROOT "clientes\anubis\imports\demo_pre_9may.json"
if (Test-Path $DEMO_JSON) {
    $demoKB = [math]::Round((Get-Item $DEMO_JSON).Length / 1KB, 1)
    try {
        $demoData = Get-Content $DEMO_JSON -Raw | ConvertFrom-Json
        $clientCount = ($demoData.nx_clients | Get-Member -MemberType NoteProperty).Count
        if ($clientCount -ge 3) {
            Show-Check 5 "Datos pre-demo OK" $true "$demoKB KB · $clientCount clientes (Susana, Lucia, Carlos)"
        } else {
            Show-Check 5 "Datos pre-demo incompletos" $false "$demoKB KB · solo $clientCount clientes (esperados 3+)"
        }
    } catch {
        Show-Check 5 "Datos pre-demo JSON invalido" $false $_.Exception.Message
    }
} else {
    Show-Check 5 "Datos pre-demo no existen" $false $DEMO_JSON
}

# ─── RESUMEN ───
Write-Host ""
Write-Host "===============================================================" -ForegroundColor DarkYellow
if ($failed -eq 0) {
    Write-Host " TODO OK · listo para demo Ariel 9-may" -ForegroundColor Green
} else {
    Write-Host " $failed checks fallaron · resolver antes de demo" -ForegroundColor Red
}
Write-Host "===============================================================" -ForegroundColor DarkYellow
Write-Host ""

exit $failed
