# =====================================================================
# commit_sprint1_7_d1.ps1
# Sprint 1.7 D1 · Mapping yuhonas → schema NEXUS · 2026-05-10 noche
#
# COMMIT-ONLY · NO redeploy (data generada · no afecta producción todavía).
# D1 prepara el bundle traducido · D2/D3/D4 mañana lo integran al HTML.
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\commit_sprint1_7_d1.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint1_7_d1.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== Sprint 1.7 D1 commit · mapping yuhonas a schema NEXUS ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASO 1/2: Estado git" -ForegroundColor Cyan
git status --short
Write-Host ""

Write-Host "PASO 2/2: Stage + Commit + Push" -ForegroundColor Cyan
git add "NEXUS FITNES/scripts/build_ex_from_yuhonas.js"
git add "NEXUS FITNES/data_generated/EX_yuhonas_mapped.json"
git add "NEXUS FITNES/data_generated/EX_yuhonas_mapped_stats.json"
git add "NEXUS FITNES/docs/SPRINT1_7_PLAN_TRADUCCION.md"
git add "SCRIPTS_DEPLOY/commit_message_sprint1_7_d1.txt"
git add "SCRIPTS_DEPLOY/commit_sprint1_7_d1.ps1"

git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main

Write-Host ""
Write-Host "=== Sprint 1.7 D1 commit COMPLETO ===" -ForegroundColor Green
Write-Host ""
Write-Host "NO requiere redeploy · data generada · no afecta produccion" -ForegroundColor Yellow
Write-Host "Manana: D2 traduccion LLM (Ollama Mistral) + D3 contras + D4 reemplazo EX" -ForegroundColor Cyan
Write-Host ""
