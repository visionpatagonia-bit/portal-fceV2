# sources_cache — PDFs canónicos descargados 2026-04-23

Todos los PDFs abajo tienen **capa de texto procesable** (verificados con pdftotext). Sirven como fuente autoritativa secundaria para el canonical_registry hasta que los PDFs primarios (IFRS Foundation directo) sean accesibles.

| Archivo | Origen | Qué contiene literal | Sección clave |
|---|---|---|---|
| `rt_16_facpce.pdf` | consejo.org.ar | Definición activo/pasivo RT 16 completa | §4.1.1 Activos · §4.1.2 Pasivos |
| `rt_54_nua.pdf` | UCSE (Universidad Católica Santiago del Estero) | Definición activo/pasivo RT 54 NUA + citas literales IASB 2018 §4.3/§4.4/§4.26 y Fundamentos FC4.9/FC4.11/FC4.26/FC4.28 | definiciones + análisis comparativo con RT 16 |
| `fowler_newton_nua_rt59.pdf` | fowlernewton.com.ar | Obra doctrinaria de Fowler Newton sobre NUA (Abril 2025) | comentario doctrinario de alta autoridad |
| `nic_38_mef_peru.pdf` | mef.gob.pe (Perú) — traducción oficial | NIC 38 Activos Intangibles completa | §54, §57 desarrollo · §63, §64 goodwill interno |
| `paper_cef_udima_activos.pdf` | revistas.cef.udima.es | Paper académico "Los activos en el nuevo PGC" | análisis contextual |

**Para el canonical_registry**, hoy 2026-04-23 esto permite pasar:
- RT 16 activo/pasivo: `pending_source_retrieval` → `verified_against_pdf` (PDF oficial FACPCE consejo.org.ar)
- RT 54 NUA activo/pasivo: `pending_source_retrieval` → `verified_against_pdf` (documento UCSE reproduciendo texto oficial FACPCE)
- IASB 2018 §4.3/§4.4/§4.26: `draft_based_on_training_knowledge` → `verified_against_authoritative_secondary` (citado entre comillas en RT 54 FACPCE)
- NIC 38 §63 y §57: concepto nuevo — goodwill interno + desarrollo capitalización
