# =====================================================================
# deploy_y_versionar_v3_2_final.ps1
# v3.2 final · cierre piloto Ariel post-feedback completo - 2026-05-08
#
# Incluye TODO lo de v3.2 (Q1-Q5 + N1-N2) + N5 (Boton maquinaria) + N6
# (listado expandido contras: cardio + columna + oseas/postoperatorio).
#
# Hace dos cosas:
#   1. Re-deploy Vercel de nexus-fitness-ruby.vercel.app
#   2. Commit + push del fix al main
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_y_versionar_v3_2_final.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_v3_2_final.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== PASO 1/3: Estado actual del repo ===" -ForegroundColor Cyan
git status --short
Write-Host ""

Write-Host "=== PASO 2/3: Deploy Vercel nexus-fitness-ruby (npx) ===" -ForegroundColor Cyan
Write-Host "Copiando HTML al deploy_qa..."
Copy-Item "$repoPath\NEXUS FITNES\dashboard\NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html" "$repoPath\NEXUS FITNES\deploy_qa\public\index.html" -Force
Write-Host "Ejecutando npx vercel deploy --prod..."
Push-Location "$repoPath\NEXUS FITNES\deploy_qa"
try { & npx vercel deploy --prod } finally { Pop-Location }
Write-Host ""

Write-Host "=== PASO 3/3: Commit + Push v3.2 final ===" -ForegroundColor Cyan
git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "NEXUS FITNES/deploy_qa/public/index.html"
git add "SCRIPTS_DEPLOY/deploy_y_versionar_v3_2_final.ps1"
git add "SCRIPTS_DEPLOY/commit_message_v3_2_final.txt"

git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile

git push origin main

Write-Host ""
Write-Host "=== v3.2 FINAL COMPLETO ===" -ForegroundColor Green
Write-Host "OK Deploy + commit + push" -ForegroundColor Green
Write-Host "Lead avisar a Ariel cuando este listo · usar plantilla de cierre" -ForegroundColor Yellow
