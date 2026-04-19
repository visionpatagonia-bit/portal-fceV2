# Recipe de push — v19.30.7 (Fase 2.5 + Informe auditor)

## Qué incluye este commit

- `pipeline/validator.py` — Fase 2.5: reglas S1–S5 semánticas bloqueantes + self-tests + flag `--self-test`.
- `INFORME_AUDITOR.md` — fuente editable del informe técnico.
- `INFORME_AUDITOR.docx` — entregable formal (11 páginas) para la auditoría académica.
- `INFORME_AUDITOR.pdf` — preview (generado por LibreOffice, opcional).

**NO incluye** cambios en `kb/knowledge_base.json`, `index.html`, `portal.js` ni ningún artefacto de runtime. La Fase 2.5 es 100 % generation-time.

## Comandos PowerShell (desde Windows, raíz del repo)

```powershell
# 0. Confirmar que no quedaron archivos de sandbox residuales
Get-ChildItem -Force .git/index.lock -ErrorAction SilentlyContinue
# Si aparece el lock: Remove-Item .git\index.lock -Force

# 1. Ver lo que va a entrar al commit
git status
git diff --stat pipeline/validator.py

# 2. Preflight (los cuatro deben pasar)
python pipeline/validator.py --self-test
node scripts/build.js
python scripts/verify_deploy.py --local
node ..\..\sessions\dreamy-happy-shannon\demo_simulacro.js 2>$null
# (el último solo si tenés el simulacro copiado localmente; si no, es OK saltarlo,
#  verify_deploy + self-test ya son la red mínima)

# 3. Staging específico (no usar -A para evitar arrastrar drafts en kb_draft/)
git add pipeline/validator.py INFORME_AUDITOR.md INFORME_AUDITOR.docx INFORME_AUDITOR.pdf
git -c user.email="visionpatagonia@gmail.com" -c user.name="Juan" commit -m @"
v19.30.7 · Fase 2.5 semantic validator + informe auditor

- validator.py: reglas S1-S5 bloqueantes (cross_domain_leak, overgen_id,
  pattern_diversity, author_presence, typo_hallucination). Flag
  NEXUS_VALIDATOR_STRICT=0 para desactivar. Self-tests integrados via
  --self-test (15 unit + 2 integration).
- validator: whitelist por validator_whitelist:true o audit_whitelist_reason
  para falsos positivos (ej. ingresos plural de ingreso).
- INFORME_AUDITOR.md/.docx/.pdf: informe técnico v19.30.7 con estado actual,
  roadmap remanente (Fase 3 OCR + Fase 4 integracion UI Sovereign segura)
  y cambios tecnicos adicionales detectados.

Parity: V∩A = 100% · V-only = 0 sobre KB actual.
Runtime intocado: KB hash identico pre/post.
"@

# 4. Push
git push origin main

# 5. Verificación remota (Vercel autodeploya en ~30s)
Start-Sleep -Seconds 45
python scripts/verify_deploy.py
```

## Si algo falla

- **`self-test` rojo** → no pushear. Revisar salida, reportar regresión antes de avanzar.
- **`verify_deploy.py --local` rojo en algún file** → solo build.js falló. Re-correr `node scripts/build.js` y reintentar.
- **`git push` rejected** → hacer `git pull --rebase origin main` primero (debería estar limpio porque el commit anterior ya se pusheó hoy).
- **Vercel deploy con error** → chequear en dashboard; el único toque a runtime fue nulo, así que si Vercel falla, es infra externa.

## Rollback

Si post-push aparece cualquier regresión:

```powershell
git revert HEAD
git push origin main
```

El validator Fase 2.5 es revertible sin impacto: ninguna entry del KB actual se generó con el validator nuevo.
