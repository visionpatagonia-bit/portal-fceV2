# =====================================================================
# deploy_y_versionar_post_feedback_luz.ps1
# v3 post-feedback Luz - F1 contras + F2 anti-similar - 2026-05-06
#
# Hace dos cosas:
#   1. Re-deploy Vercel de nexus-fitness-ruby.vercel.app con HTML actualizado
#   2. Commit + push del fix al main
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_y_versionar_post_feedback_luz.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_feedback_luz.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== PASO 1/3: Estado actual del repo ===" -ForegroundColor Cyan
git status --short
Write-Host ""

Write-Host "=== PASO 2/3: Deploy Vercel nexus-fitness-ruby ===" -ForegroundColor Cyan
Write-Host "Ejecutando DEPLOY_NEXUS_FITNESS.ps1..."
Set-Location "$repoPath\NEXUS FITNES"
& .\DEPLOY_NEXUS_FITNESS.ps1
Set-Location $repoPath
Write-Host ""

Write-Host "=== PASO 3/3: Commit + Push (v3 post-feedback Luz) ===" -ForegroundColor Cyan

git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "NEXUS FITNES/deploy_qa/public/index.html"
git add "SCRIPTS_DEPLOY/deploy_y_versionar_post_feedback_luz.ps1"
git add "SCRIPTS_DEPLOY/commit_message_feedback_luz.txt"

git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile

git push origin main

Write-Host ""
Write-Host "=== v3 POST-FEEDBACK LUZ COMPLETO ===" -ForegroundColor Green
Write-Host "OK Deploy Vercel + commit + push" -ForegroundColor Green
Write-Host ""
Write-Host "Avisar a Ariel:" -ForegroundColor Yellow
Write-Host "  Lance v3 con los cambios. Ahora cubre escoliosis y dolor de coxis." -ForegroundColor Yellow
Write-Host "  Y resolvi lo de los 3 press militar / 2 dominadas / 3 peso muerto." -ForegroundColor Yellow
Write-Host "  Agregue chips nuevos al form (Columna y cuello): Escoliosis, Coxalgia." -ForegroundColor Yellow
Write-Host "  Probalo con Luz, decime si la rutina ahora sale mas corta pero segura." -ForegroundColor Yellow
