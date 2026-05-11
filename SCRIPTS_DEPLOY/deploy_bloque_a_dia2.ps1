# =====================================================================
# deploy_bloque_a_dia2.ps1
# Bloque A · Día 2 · remoción 7 false matches + smoke semántico · v2028.32
# Sprint CRÍTICO post-reunión Ariel 2026-05-11
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_bloque_a_dia2.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== BLOQUE A Dia 2 · remocion 7 false matches + smoke semantico ===" -ForegroundColor Cyan
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
git add "NEXUS FITNES/scripts/remove_false_positive_matches.js"
git add "NEXUS FITNES/scripts/smoke_matching_semantico.js"
git add "SCRIPTS_DEPLOY/commit_message_bloque_a_dia2.txt"
git add "SCRIPTS_DEPLOY/deploy_bloque_a_dia2.ps1"
git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main

Write-Host ""
Write-Host "=== v2028.32 + Dia 2 deploy COMPLETO ===" -ForegroundColor Green
Write-Host ""
Write-Host "VALIDACION RECOMENDADA (incognito + TeamViewer Ariel):" -ForegroundColor Yellow
Write-Host "1. Abrir https://nexus-fitness-ruby.vercel.app · badge v2028.32" -ForegroundColor White
Write-Host "2. Generar rutina NICO (24M · 6 dias · Tonificacion)" -ForegroundColor White
Write-Host "3. Verificar en PDF:" -ForegroundColor White
Write-Host "   - 0 ejercicios sufijo (EN)" -ForegroundColor White
Write-Host "   - 0 foam roller / cat-cow / mariposa / spinal stretch / etc en flujo principal" -ForegroundColor White
Write-Host "   - 0 imagenes invertidas (hip_thrust con foto de curl · etc · ya removidas)" -ForegroundColor White
Write-Host "   - Curl predicador NO aparece en dia Hombros (solo en Brazos)" -ForegroundColor White
Write-Host "   - Elevacion de piernas NO aparece en dia Pecho (solo en Core)" -ForegroundColor White
Write-Host "   - Apartado complementarios opcionales al FINAL del PDF" -ForegroundColor White
Write-Host "4. TeamViewer con Ariel · validacion final dia 3-4" -ForegroundColor Cyan
Write-Host ""
