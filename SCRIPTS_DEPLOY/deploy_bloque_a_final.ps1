# =====================================================================
# deploy_bloque_a_final.ps1
# BLOQUE A FINAL · todos los fixes consolidados · v2028.32
# Sprint CRÍTICO post-reunión Ariel 2026-05-11
#
# REEMPLAZA a dia1.ps1 + dia2.ps1 + dia3.ps1 (no ejecutar esos si
# vas a correr este).
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_bloque_a_final.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== BLOQUE A FINAL · v2028.32 · todos los fixes ===" -ForegroundColor Cyan
Write-Host ""

$srcPath = "$repoPath\NEXUS FITNES\dashboard\NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
$dstPath = "$repoPath\NEXUS FITNES\deploy_qa\public\index.html"

Copy-Item $srcPath $dstPath -Force

$srcMd5 = (Get-FileHash $srcPath -Algorithm MD5).Hash
$dstMd5 = (Get-FileHash $dstPath -Algorithm MD5).Hash
Write-Host "MD5: $srcMd5 (match: $($srcMd5 -eq $dstMd5))" -ForegroundColor Yellow
if ($srcMd5 -ne $dstMd5) { Write-Host "ABORT" -ForegroundColor Red; exit 1 }

Write-Host ""
git status --short

Push-Location "$repoPath\NEXUS FITNES\deploy_qa"
try { & npx vercel deploy --prod } finally { Pop-Location }

git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "NEXUS FITNES/deploy_qa/public/index.html"
git add "NEXUS FITNES/scripts/smoke_pool_filter_complementarios.js"
git add "NEXUS FITNES/scripts/smoke_matching_semantico.js"
git add "NEXUS FITNES/scripts/remove_false_positive_matches.js"
git add "NEXUS FITNES/scripts/desambiguar_yuhonas_v2.js"
git add "NEXUS FITNES/scripts/desambiguar_yuhonas_duplicados.js"
git add "NEXUS FITNES/scripts/apply_style_and_equipment_fixes.js"
git add "SCRIPTS_DEPLOY/commit_message_bloque_a_final.txt"
git add "SCRIPTS_DEPLOY/deploy_bloque_a_final.ps1"
git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main

Write-Host ""
Write-Host "=== BLOQUE A FINAL deploy COMPLETO · v2028.32 ===" -ForegroundColor Green
Write-Host ""
Write-Host "PARA ARIEL (via WhatsApp o cuando lo veas):" -ForegroundColor Yellow
Write-Host "1. Refrescar en incognito · badge debe decir 'Motor v2028.32 · 2026-05-11'" -ForegroundColor White
Write-Host "2. Generar rutina con perfil real (probar Luz · Michael · NICO)" -ForegroundColor White
Write-Host "3. Verificar en PDF:" -ForegroundColor White
Write-Host "   - 0 ejercicios sufijo (EN)" -ForegroundColor White
Write-Host "   - 0 foam roller/cat-cow/estiramientos en flujo principal" -ForegroundColor White
Write-Host "   - 0 Arranque/Envion/Cargada/Snatch (si goal NO es potencia/crossfit)" -ForegroundColor White
Write-Host "   - 0 ergometro (si no marco Remo ergometro como equipo)" -ForegroundColor White
Write-Host "   - Apartado complementarios opcionales al FINAL del PDF" -ForegroundColor White
Write-Host "4. Si emerge algo · que apriete boton 'Reportar problema' (esquina inf izq)" -ForegroundColor White
Write-Host ""
