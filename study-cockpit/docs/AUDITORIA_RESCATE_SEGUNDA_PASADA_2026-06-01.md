# Auditoria de rescate - segunda pasada

Fecha: 2026-06-01.

## Metodo

Se compararon por nombre, ubicacion y hash SHA-256 los carriles relevantes del workspace contra el primer consolidado:

```text
Truco+portal/
NEXUS_HANDOFF_PROGRAMADOR_2026-05-28/
NEXUS_PORTAL_FCE_HANDOFF_2026-06-01/
nexus-ai-proxy/
nexus-contabilidad-deploy/
pipeline/
kb/
nexus-ckg/
REUNION_TRUCCO/
AUDITORIA_EXTERNA/
SCRIPTS_DEPLOY/
docs/
telemetria/
VIgilancia/
```

Se excluyeron del diferencial:

```text
node_modules/
_research_repos/
__pycache__/
*.pyc
*.tmp
.~lock*
```

## Hallazgos incorporados

La primera consolidacion cubria el backend principal, simulador, contrato academico, pipeline RAG, CKG, snapshot deploy, scripts Trucco, reportes y telemetria principal.

La segunda pasada encontro piezas rescatables adicionales:

1. Modulos PWA reutilizables del handoff del 28-05.
2. Scripts historicos de deploy y commit.
3. Reglas Firestore, servidor estatico y utilidades operativas de raiz.
4. Estados generales y reporte HTML de auditoria.
5. Backups historicos de `materiales.json`.
6. Variante visible Trucco y proxy previo a la unificacion.
7. Presentaciones de vision Nexus y preview Sovereign.
8. Log runtime del proxy raiz, almacenado como telemetria sensible.
9. Snapshot frontend `dist.bak_pre_trucco` para rollback.
10. Documentos `Arsenal_Bionico` y `Rol_Investigador`.
11. Propuesta academica Propedeutica y presentaciones de vision Nexus.
12. Snapshot vigente `dist/` del portal raiz.
13. Standalones de Administracion, corpus OCR extraido y herramientas de extraccion.
14. Demos, diagnosticos e informe CTO ubicados en raiz sin prefijo de backend.

## Elementos cubiertos sin duplicar

Los materiales bibliograficos del simulador con rutas demasiado largas para copiar dentro de una carpeta aun mas anidada estan preservados dentro de:

```text
13_handoffs_originales_preservados/NEXUS_PORTAL_FCE_HANDOFF_2026-06-01_ORIGINAL_COMPLETO.zip
```

Ese ZIP original fue inspeccionado y contiene, entre otros:

```text
src/bakend.rar
nexpotcast.m4a
dist/Nexus_Simulador_Total.html
unidad 2/Bibliografia de la catedra/Robbins Unidad 1.pdf
```

El corpus OCR previo a la construccion del standalone tambien se conserva completo en:

```text
21_administracion_standalone_y_corpus/_adm_2do_parcial_src_ORIGINAL_COMPLETO.zip
21_administracion_standalone_y_corpus/Materiales_ADMINISTRACION_ORIGINAL_COMPLETO.zip
```

## Exclusiones deliberadas

No se incorporaron:

1. Repositorios externos descargados en `_research_repos/`, `PROYECTO_PARALELO/` u `open-design-main/`.
2. Dependencias reinstalables `node_modules/`.
3. Caches y temporales.
4. Documentos estrictamente de Nexus Fitness encontrados en `docs/nexus-fitness-harness/`.
5. Scripts Fitness de raiz sin relacion directa con Portal FCE.
6. Paquetes CTO y roadmaps exclusivamente Fitness.

## Dictamen

El consolidado cubre el backend operativo, sus antecedentes utiles, el backend del simulador, el criterio academico compartido, auditorias, fuentes de regresion, reportes, vision de producto y capacidad de rollback.

Las exclusiones restantes son deliberadas y estan justificadas por alcance, redundancia o reinstalabilidad.

## Diferencial final

Luego de incorporar los rescates, el diferencial por hash sobre los carriles auditados solo reporta:

```text
25 archivos bibliograficos del simulador cubiertos por el ZIP original preservado.
6 documentos estrictamente Nexus Fitness excluidos por alcance.
0 omisiones funcionales no clasificadas.
```
