# NEXUS Portal FCE - backend consolidado

Fecha de consolidacion: 2026-06-01.

## Objetivo

Este paquete reune el backend rescatable del Portal FCE, el simulador adaptativo de Administracion, contratos academicos, pipeline RAG legado, CKG, reportes, memorias y documentos de vision encontrados dentro del workspace.

La fuente principal para continuar el backend del portal es:

```text
01_backend_portal_fce/nexus-ai-proxy/
```

La fuente principal para continuar el simulador offline es:

```text
02_backend_simulador_administracion/NEXUS_PORTAL_FCE_HANDOFF_2026-06-01/
```

## Mapa de carpetas

| Carpeta | Contenido | Uso recomendado |
| --- | --- | --- |
| `01_backend_portal_fce/` | Proxy Express enriquecido: auth, rate limit, telemetria, tutor contable, RAG, citas, guardrails, doctrina, feedback, ingesta PDF/texto y contrato academico por materia | Backend operativo principal |
| `02_backend_simulador_administracion/` | Compilador del simulador offline: grafo, banco calibrado, motor adaptativo, extractor, curador multimodal, empaquetador, audio y HTML final | Backend del simulador |
| `03_contrato_academico/` | Schema, plantilla, validador, adaptador de portal y perfil de Administracion | Criterio comun para extender Nexus a otras materias |
| `04_pipeline_rag_legacy/` | Pipeline original de ingesta PDF, OCR, generacion de KB, validador, matcher y KB historica | Rescate de capacidades previas |
| `05_ckg_auditoria/` | Canonical Knowledge Graph, fuentes, query engine, validadores, harness y blind tests | Auditoria academica y regresiones |
| `06_scripts_rescatados/` | Scripts Trucco: builds, parches KB, OCR, smoke tests, barridos adversariales y consultas | Herramientas operativas |
| `07_snapshot_deploy_contabilidad/` | Snapshot desplegable de Contabilidad | Referencia de produccion |
| `08_historico/` | Proxy raiz anterior a Trucco, sin `node_modules` ni logs | Comparacion historica |
| `09_integracion_frontend_portal/` | Archivos del frontend que consumen KB, IA, quiz y motor adaptativo | Contratos de integracion |
| `10_reportes_y_vision/` | Memorias, auditorias, arquitectura hibrida, documentos Trucco y vision adyacente | Lectura y trazabilidad |
| `11_telemetria_sensible/` | Telemetria JSONL Trucco | Evidencia operativa: revisar antes de redistribuir |
| `12_mapas_historicos/` | Mapas y planes de evolucion previos | Contexto |
| `13_handoffs_originales_preservados/` | ZIPs originales recibidos | Recuperacion integral |
| `14_modulos_pwa_reutilizables/` | Offline sync queue, wake lock, undo toast, rest timer, smokes y documentos del handoff PWA | Reutilizacion selectiva |
| `15_operacion_historica/` | Scripts de deploy, estados, reglas Firestore y utilidades operativas | Referencia y rollback |
| `16_backups_materiales_portal/` | Backups historicos de `materiales.json` | Recuperacion de contenido |
| `17_variantes_trucco_historicas/` | Variante visible Trucco y proxy previo a la unificacion | Comparacion historica |
| `18_presentaciones_vision_producto/` | Presentaciones Nexus y preview Sovereign | Vision de producto |
| `19_snapshot_pre_trucco/` | Build anterior a la variante Trucco | Rollback frontend |
| `20_snapshot_dist_portal_raiz/` | Build vigente encontrado en `dist/` | Comparacion operativa |
| `21_administracion_standalone_y_corpus/` | HTML standalone, OCR, corpus extraido y herramientas de extraccion | Trazabilidad Administracion |
| `22_documentacion_y_utilidades_raiz_rescatadas/` | Demos, auditorias UI, informe CTO y utilidades historicas | Contexto y diagnostico |

## Decisiones de consolidacion

1. El backend principal es el proxy del handoff del 28-05 enriquecido el 01-06 con `GET /api/academic-contract/:subjectId`.
2. El proxy raiz y `Truco+portal` se consideran antecedentes, no fuente principal.
3. Se incluyen CKG y pipeline legado porque contienen validadores, fuentes y blind tests que no estaban dentro del handoff inicial.
4. Se excluyen `node_modules`, caches Python, repositorios de investigacion descargados y proyectos laterales de Fitness.
5. La carpeta `VISION_PATAGONIA_REFERENCIA_ADYACENTE` se conserva como documentacion estrategica encontrada durante el mapeo. No forma parte del backend Portal FCE.
6. Algunas rutas bibliograficas del simulador exceden el limite de rutas largas de Windows al expandirse dentro de este consolidado. El ZIP original completo del 01-06 queda preservado en `13_handoffs_originales_preservados/`. El corpus OCR y la carpeta original `Materiales/ADMINISTRACION` tambien quedan preservados como ZIP dentro de `21_administracion_standalone_y_corpus/`.
7. La segunda auditoria del paquete esta documentada en `AUDITORIA_RESCATE_SEGUNDA_PASADA_2026-06-01.md`.

## Contrato academico comun

El simulador y el portal comparten el perfil por materia:

```text
03_contrato_academico/Materiales/ADMINISTRACION/exam-profile.json
```

El backend expone:

```http
GET /api/academic-contract/administracion
```

Variables configurables para despliegues separados:

```text
NEXUS_ACADEMIC_PROFILES_ROOT
NEXUS_ACADEMIC_CONTRACT_ADAPTER
```

## Etiquetado tecnico vigente

- XOR con clave visible en runtime se documenta como `ofuscacion binaria (anti-lectura casual)`.
- El standalone opera offline mediante override de `fetch` en runtime.
- Si el bundle excede 65 MB, auditar primero audio Base64 y bitrate; luego PNG/JPG redundantes.

## Archivos generados al cerrar el paquete

```text
INVENTARIO_ARCHIVOS.txt
MANIFEST_SHA256.json
```
