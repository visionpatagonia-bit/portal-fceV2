# Mini informe CTO · Sprint 1.5 CERRADO

**Fecha:** 2026-05-10 madrugada · **Lead:** Juan · **Sesión:** sábado-domingo continua

---

## Lo entregado

| Bloque | Resultado |
|---|---|
| **Catálogo extendido yuhonas (873 ej · 1.1 MB)** | Mapeado a NEXUS schema CRDT-ready · 41.1% con nombre_es · imágenes con CDN GitHub raw · servido desde Vercel |
| **Fix H4 PDF Vista Alumno** | `resolveContext()` Path 3 detecta cliente por URL `?student=ID` · cubre race condition pre-existente |
| **Fix H5 ZWNJ** | `safeText` U+200B (ZWSP) → U+200C (ZWNJ purpose-designed) · invisible en TODOS los PDF readers |
| **UI buscador catálogo extendido** | Toggle default OFF en modal +Agregar · cuando ON: search + filtros · resultados sub-50ms · badge azul "EXT" |
| **NX_CATALOG wrapper** | Lazy load + persist Dexie + dedupe loads + version-controlled cache |
| **Service Worker cache imágenes** | sw.js scoped a yuhonas · SWR · 50MB LRU · API NX_SW.ping/stats/purge |
| **CSP fix** | img-src + connect-src + worker-src · prepara terreno render imágenes Sprint 1.6+ |

---

## Validación

- **5 smokes nuevos persistentes** en `NEXUS FITNES/scripts/`: smoke_h4_h5 · smoke_nx_catalog · smoke_extended_ui · smoke_sw_cache · (yuhonas_to_nexus.js)
- **95/96 asserts acumulados Sprint 1.5** (1 WARN preexistente · 0 FAIL)
- **Regression Sprint 1 baseline:** smoke_headless 46/47 idéntico a través de los 4 deploys
- **Validación user en producción:** screenshots confirmaron toggle · search · click EXT · NX_SW activated · 0 errores CSP

---

## Decisión clave: D3.B postpone Sprint 1.6

**Análisis honesto del ROI:**
- Ariel usa ~100 ejercicios de los 873 · diccionario ES manual ya cubre 41%
- Instrucciones técnicas cortas (5 frases promedio) · LLM podría agregar ruido más que reducir
- Costo infra (Ollama + ngrok) desproporcionado · proxy no instalado en NEXUS Fitness · solo en Trucco
- Fallback en cascada con proxy offline 80% del tiempo = UX confusa
- Alternativa zero-dependency disponible Sprint 1.6: diccionario manual 50 frases EN→ES (~30 min)

**Condición de revisita:** si Ariel reporta confusión real con instrucciones EN tras 2-4 semanas de uso, abrir Sprint 1.6 con la solución que mejor encaje.

Agendado formalmente como Task #77 · NO es deuda oculta.

---

## 5 trade-offs documentados explícitamente

1. **Coexiste con catálogo curado** (vs reemplazo) · cero risk
2. **Conversión runtime** (vs pre-procesada) · 15ms · bundle puro en disco
3. **Path 3 H4 defensivo** (vs refactor mayor) · CTO aprobó cubrir síntoma
4. **D3.B postpone** (vs implement) · análisis ROI explícito
5. **SW activo sin UI imágenes** (vs activar al rendering) · framework listo

---

## 4 kill-switches activos

- Sprint 1 NX_DEXIE: `?dexie=0`
- D2 toggle catálogo: default OFF
- D3.A NX_CATALOG: `getError()` muestra mensaje si fetch falla
- D3.C SW: `await window.NX_SW.purge()` desde F12 limpia · borrar /sw.js desactiva

---

## Cadencia

4 ciclos {implement → smoke → deploy → validar} en una sesión continua sábado-domingo:
1. **D1+D2** deploy (commit + push) · validado por user
2. **D3.A** deploy · validado screenshots (toggle · search · console)
3. **D3.C** deploy · validado screenshots (DevTools SW activated · console)
4. **D4** cierre formal (este doc + resumen ejecutivo + memoria final)

Disciplina O1 sostenida: cada bloque dejó memoria + doc + commit + .ps1 deploy con md5 parity-check + smokes corriendo regression baseline.

---

## Pendiente real (declarado · no oculto)

- D3.B traducción Sprint 1.6 (Task #77)
- Render thumbnail imágenes EXT Sprint 1.6 (justifica SW cache)
- Validación uso real Ariel 1-2 semanas
- Tracking preciso bytes en SW enforceBudget (mejorable)

---

## Veredicto

Sprint 1.5 cerrado limpio. Catálogo extendido + 2 fixes urgentes + infraestructura SW · 0 regresión · 4 kill-switches · 5 trade-offs explícitos · D3.B postponed con justificación documentada.

**Listo para Sprint 2 Trucco lunes 19-may.**
