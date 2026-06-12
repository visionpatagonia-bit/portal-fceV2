# portal-fceV2

Monorepo NEXUS. Qué vive dónde (para que el próximo agente entienda en 30 segundos):

- **Portal viejo (vivo)** — `index.html`, `portal.js`, `materiales.json`, `kb/`, `fonts/`, `nexus-*.js`, `nexus-ai-proxy/`. Deployado en Vercel (portal-fce-v2). Evidencia para Propedéutica. No tocar sin razón.
- **Cockpit (producto actual)** — branch **`feat/study-cockpit`**, carpeta `study-cockpit/`. Deploya en Render (nexus-study-cockpit). Todo el desarrollo nuevo va ahí, con `deploy.sh` VERDE commit-específico.
- **Gemas (Vías D/E del roadmap)** — `nexus-ckg/` (Contable Knowledge Graph, doctrina cita-o-rechazo) y `pipeline/` (ingesta PDF→KB, H1-H7). Prototipos del driver de prácticos y la Torre de Control. Se resucitan, no se reescriben.
- **Legacy** — `legacy-assets/prototipo-trucco/` (deploy viejo de Contabilidad, recuperable; ver su `ORIGEN.md`).
- **Docs** — `docs/` (NEXUS-OS-ARQUITECTURA, CONSTITUCION-DISENO-HUD, MANIFIESTO-LIMPIEZA, ADRs, audit-impl).

**Archivo histórico** (informes, auditorías, presentaciones): fuera del working tree desde 2026-06-12 (higiene M2); preservado en el historial git y en `NEXUS_ARCHIVO_HISTORICO_2026-06-12.zip` (lo guarda el fundador).

**NEXUS FITNES/**: pendiente de separar a su repo propio `nexus-fitness` (M1 del manifiesto, diferido por falta de `gh` auth).
