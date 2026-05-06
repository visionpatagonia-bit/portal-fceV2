# =====================================================================
# deploy_y_versionar_post_trucco.ps1
# Cierre del ciclo barrido adversarial Trucco · 2026-05-06
#
# Hace dos cosas:
#   1. Re-deploy Vercel de nexus-contabilidad.vercel.app con KB 63 entries
#   2. Commit + push del ciclo (KB + scripts + queries + outputs)
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_y_versionar_post_trucco.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_trucco.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== PASO 1/3: Estado actual del repo ===" -ForegroundColor Cyan
git status --short
Write-Host ""

Write-Host "=== PASO 2/3: Deploy Vercel nexus-contabilidad ===" -ForegroundColor Cyan
Write-Host "Cambiando a directorio nexus-contabilidad-deploy..."
Set-Location "$repoPath\nexus-contabilidad-deploy"
Write-Host "Ejecutando vercel deploy --prod (KB 63 entries post-barrido completo)..."
vercel deploy --prod
Set-Location $repoPath
Write-Host ""

Write-Host "=== PASO 3/3: Commit + Push (cierre ciclo Trucco) ===" -ForegroundColor Cyan

# Stage selectivo · NO usar git add -A (evita .env, secrets, etc.)
git add kb/knowledge_base.json
git add nexus-contabilidad-deploy/public/kb/knowledge_base.json
git add dist/kb/knowledge_base.json
git add scripts/patch_kb_post_auditor_nivel4.py
git add scripts/patch_kb_post_auditor_nivel5.py
git add scripts/queries_nivel_4.txt
git add scripts/queries_nivel_5.txt
git add scripts/queries_muestreo_final.txt
git add scripts/output_barrido/
git add SCRIPTS_DEPLOY/

# Commit con mensaje desde archivo (-F evita parser issues de PowerShell)
git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile

git push origin main

Write-Host ""
Write-Host "=== CIERRE CICLO TRUCCO COMPLETO ===" -ForegroundColor Green
Write-Host "OK Deploy Vercel nexus-contabilidad.vercel.app actualizado"
Write-Host "OK Commit + push a GitHub completado"
Write-Host ""
Write-Host "Sistema certificado por contador adversarial. Listo para Trucco." -ForegroundColor Green
