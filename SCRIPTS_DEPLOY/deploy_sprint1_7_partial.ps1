# =====================================================================
# deploy_sprint1_7_partial.ps1
# Sprint 1.7 avance + HOTFIX v2028.29 · 2026-05-11 madrugada
#
# Contiene:
#   - D1 mapping yuhonas (873 entries en data_generated/)
#   - D3 refinement (Nano ID + contras + regression_chain)
#   - smoke_faker_matrix.js (50 perfiles sinteticos · doctrina Leccion 3)
#   - HOTFIX v2028.29 split dia 6 distinto (active recovery REAL)
#
# Uso:
#   cd "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
#   .\SCRIPTS_DEPLOY\deploy_sprint1_7_partial.ps1
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint1_7_partial.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== Sprint 1.7 parcial + HOTFIX v2028.29 deploy ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASO 1/4: md5 parity-check master vs deploy_qa" -ForegroundColor Cyan
$srcPath = "$repoPath\NEXUS FITNES\dashboard\NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
$dstPath = "$repoPath\NEXUS FITNES\deploy_qa\public\index.html"

Copy-Item $srcPath $dstPath -Force

$srcMd5 = (Get-FileHash $srcPath -Algorithm MD5).Hash
$dstMd5 = (Get-FileHash $dstPath -Algorithm MD5).Hash

Write-Host "MD5 master HTML:    $srcMd5"
Write-Host "MD5 deploy_qa HTML: $dstMd5"

if ($srcMd5 -ne $dstMd5) {
    Write-Host "ABORT - md5 mismatch" -ForegroundColor Red
    exit 1
}
Write-Host "OK md5 HTML coincide" -ForegroundColor Green
Write-Host ""

Write-Host "PASO 2/4: Estado git" -ForegroundColor Cyan
git status --short
Write-Host ""

Write-Host "PASO 3/4: Deploy Vercel" -ForegroundColor Cyan
Push-Location "$repoPath\NEXUS FITNES\deploy_qa"
try { & npx vercel deploy --prod } finally { Pop-Location }
Write-Host ""

Write-Host "PASO 4/4: Stage + Commit + Push" -ForegroundColor Cyan
git add "NEXUS FITNES/dashboard/NEXUS_Fitness_2028_DEMO_ARIEL_v3_MOBILE_READY.html"
git add "NEXUS FITNES/deploy_qa/public/index.html"
git add "NEXUS FITNES/scripts/build_ex_from_yuhonas.js"
git add "NEXUS FITNES/scripts/refine_ex_mapped_d3.js"
git add "NEXUS FITNES/scripts/smoke_faker_matrix.js"
git add "NEXUS FITNES/scripts/smoke_hotfix_d6_distinct.js"
git add "NEXUS FITNES/data_generated/EX_yuhonas_mapped.json"
git add "NEXUS FITNES/data_generated/EX_yuhonas_mapped_stats.json"
git add "NEXUS FITNES/data_generated/EX_yuhonas_d3_refined.json"
git add "NEXUS FITNES/data_generated/EX_yuhonas_d3_refined_stats.json"
git add "NEXUS FITNES/docs/SPRINT1_7_PLAN_TRADUCCION.md"
git add "SCRIPTS_DEPLOY/commit_message_sprint1_7_partial.txt"
git add "SCRIPTS_DEPLOY/deploy_sprint1_7_partial.ps1"

git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile
git push origin main

Write-Host ""
Write-Host "=== Deploy v2028.29 + Sprint 1.7 parcial COMPLETO ===" -ForegroundColor Green
Write-Host ""
Write-Host "Manana D4 final:" -ForegroundColor Yellow
Write-Host "  - Inyectar 873 yuhonas al HTML (EX 100 -> 973)" -ForegroundColor White
Write-Host "  - Re-correr smoke_faker_matrix" -ForegroundColor White
Write-Host "  - Deploy + verificacion incognito Ariel" -ForegroundColor White
Write-Host ""
