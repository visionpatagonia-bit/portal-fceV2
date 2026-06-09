$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

$env:HOST = "0.0.0.0"
$env:PORT = "8788"

Write-Host ""
Write-Host "NEXUS Study Cockpit - modo celular/tablet" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deja esta ventana abierta. En tu celular/tablet, usa la misma WiFi y proba una de estas URLs:" -ForegroundColor Yellow

$addresses = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -ne "WellKnown"
  } |
  Select-Object -ExpandProperty IPAddress -Unique

foreach ($address in $addresses) {
  Write-Host "  http://$address`:8788/" -ForegroundColor Green
}

Write-Host ""
Write-Host "Si Windows Firewall pregunta, permitir acceso en red privada." -ForegroundColor Yellow
Write-Host ""

node server.js
