# =====================================================================
# commit_sprint2_cierre_solo_docs.ps1
# Sprint 2 PWA Alumna · cierre formal · SOLO commit docs (sin redeploy)
# 4 deploys ya estan en produccion validados (D1 + D2 + D3 + D4 cierre).
# Este script solo agrega los docs de cierre formal al repo.
# =====================================================================

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\juancruz\Downloads\PORTAL FCE\PWA\PWA DINAMICA JSON\portal_fce_v19.19.0\portal_v19.3.0"
$commitMsgFile = "$repoPath\SCRIPTS_DEPLOY\commit_message_sprint2_cierre.txt"

Set-Location $repoPath

Write-Host ""
Write-Host "=== Sprint 2 CIERRE FORMAL · solo commit docs ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "PASO 1/3: Estado git" -ForegroundColor Cyan
git status --short
Write-Host ""

Write-Host "PASO 2/3: Stage docs cierre" -ForegroundColor Cyan
git add "NEXUS FITNES/docs/SPRINT2_CIERRE_FORMAL.md"
git add "NEXUS FITNES/docs/MINI_INFORME_CTO_SPRINT2_CIERRE.md"
git add "SCRIPTS_DEPLOY/commit_message_sprint2_cierre.txt"
git add "SCRIPTS_DEPLOY/commit_sprint2_cierre_solo_docs.ps1"
Write-Host ""

Write-Host "PASO 3/3: Commit + Push" -ForegroundColor Cyan
git -c user.email="visionpatagonia@gmail.com" -c user.name="visionpatagonia-bit" commit -F $commitMsgFile

git push origin main

Write-Host ""
Write-Host "=== SPRINT 2 PWA ALUMNA CERRADO FORMAL ===" -ForegroundColor Green
Write-Host ""
Write-Host "Estado produccion: nexus-fitness-ruby.vercel.app (4 deploys validados)" -ForegroundColor Yellow
Write-Host "Total asserts Sprint 2: 129/130 (8 smokes acumulados)" -ForegroundColor Yellow
Write-Host "Sesion continua cerro 2 sprints: 1.5 + 2 = 8 deploys cero regresion" -ForegroundColor Yellow
Write-Host ""
Write-Host "Roadmap inmediato:" -ForegroundColor Cyan
Write-Host "  - Sprint 1.6 (backlog): D3.B traduccion + render thumbnails" -ForegroundColor Cyan
Write-Host "  - Sprint Trucco (trigger-activated · sin urgencia)" -ForegroundColor Cyan
Write-Host "  - Sprint #161 Firebase (sync coach-alumna · FCM)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pendiente live test:" -ForegroundColor Cyan
Write-Host "  - Ariel manda link a Luz · feedback uso real" -ForegroundColor Cyan
Write-Host ""
