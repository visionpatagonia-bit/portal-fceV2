# =====================================================================
# deploy_y_versionar_post_feedback_luz_v2.ps1
# v3 post-feedback Luz fase 2 - F-UX + F3+F4 + F5
#
# Hace dos cosas:
#   1. Re-deploy Vercel de nexus-fitness-ruby.vercel.app
#   2. Commit + push del fix al main
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_y_versionar_post_feedback_luz_v2.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_feedback_luz_v2.txt"

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
try {
    & npx vercel deploy --prod
} finally {
    Pop-Location
}
Write-Host ""

Write-Host "=== PASO 3/3: Commit + Push ===" -ForegroundColor Cyan
git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "SCRIPTS_DEPLOY/deploy_y_versionar_post_feedback_luz_v2.ps1"
git add "SCRIPTS_DEPLOY/commit_message_feedback_luz_v2.txt"

git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile

git push origin main

Write-Host ""
Write-Host "=== v3 POST-FEEDBACK LUZ FASE 2 COMPLETO ===" -ForegroundColor Green
Write-Host "OK Deploy Vercel + commit + push" -ForegroundColor Green
