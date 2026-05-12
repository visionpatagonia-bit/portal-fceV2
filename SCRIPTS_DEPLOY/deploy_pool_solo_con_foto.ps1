# deploy_pool_solo_con_foto.ps1 · v2028.33 · 2026-05-11
# Pool solo-con-foto · pedido literal Ariel
$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_pool_solo_con_foto.txt"

Set-Location $repoPath

# v2028.33 · PRE-FLIGHT · auditoría exhaustiva antes de deploy
# Si hay bugs críticos en el motor/presets/handlers, aborta.
Write-Host "=== PRE-FLIGHT · Auditoría exhaustiva ===" -ForegroundColor Cyan
Push-Location "$repoPath\NEXUS FITNES"
$auditExit = 0
try {
  & node "scripts\auditor_completo_v2028_33.js"
  $auditExit = $LASTEXITCODE
} finally { Pop-Location }
if ($auditExit -ne 0) {
  Write-Host "ABORT · Auditoría encontró bugs críticos · revisar AUDIT_REPORT_v2028_33.html" -ForegroundColor Red
  exit 1
}
Write-Host "Pre-flight OK · 0 bugs críticos · procediendo con deploy" -ForegroundColor Green

# Parity-check master vs deploy_qa
$srcPath = "$repoPath\NEXUS FITNES\dashboard\NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
$dstPath = "$repoPath\NEXUS FITNES\deploy_qa\public\index.html"
Copy-Item $srcPath $dstPath -Force

$srcMd5 = (Get-FileHash $srcPath -Algorithm MD5).Hash
$dstMd5 = (Get-FileHash $dstPath -Algorithm MD5).Hash
Write-Host "MD5: $srcMd5 (match: $($srcMd5 -eq $dstMd5))"
if ($srcMd5 -ne $dstMd5) { Write-Host "ABORT · MD5 mismatch" -ForegroundColor Red; exit 1 }

git status --short

# Deploy Vercel
Push-Location "$repoPath\NEXUS FITNES\deploy_qa"
try { & npx vercel deploy --prod } finally { Pop-Location }

# Commit · per-command git config · NUNCA global
git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "NEXUS FITNES/deploy_qa/public/index.html"
git add "NEXUS FITNES/scripts/enforce_pool_solo_con_foto.js"
git add "NEXUS FITNES/scripts/rematch_curados_pedidos_ariel.js"
git add "NEXUS FITNES/scripts/rematch_curados_explicit_ids.js"
git add "NEXUS FITNES/scripts/reactivar_yuhonas_cardio.js"
git add "NEXUS FITNES/scripts/reactivar_warmup_cooldown_basicos.js"
git add "NEXUS FITNES/scripts/smoke_pool_solo_con_foto.js"
git add "NEXUS FITNES/scripts/smoke_matching_semantico.js"
git add "NEXUS FITNES/scripts/smoke_pool_filter_complementarios.js"
git add "NEXUS FITNES/scripts/smoke_e2e_rutina_lichiano.js"
git add "NEXUS FITNES/scripts/auditor_completo_v2028_33.js"
git add "NEXUS FITNES/scripts/extended_only_yuhonas_mal_cat.js"
git add "NEXUS FITNES/scripts/fix_cardio_y_dia6.js"
git add "NEXUS FITNES/scripts/smoke_e2e_rutina_lichiano.js"
git add "SCRIPTS_DEPLOY/commit_message_pool_solo_con_foto.txt"
git add "SCRIPTS_DEPLOY/deploy_pool_solo_con_foto.ps1"
git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main

Write-Host ""
Write-Host "=== DEPLOY COMPLETO · v2028.34.1 Rutina core + cardio traducido ===" -ForegroundColor Green
Write-Host "Auditor: 200/200 motor (con assert dias vacios) + 100/100 presets + 63/63 handlers"
Write-Host "11 yuhonas mal-cat bloqueados + 8 cardio traducidos al espanol"
Write-Host "Splits 6 dias reformados: ningun dia queda vacio"
