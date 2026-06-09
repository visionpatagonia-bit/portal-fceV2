# CTO handoff - SOVERINGBACKEND

## Diagnostico

Los HTML standalone demostraron metodo, pero no producto final. Sirven para validar:

- aprendizaje antes de evaluacion;
- entrenamiento por microhabilidades;
- correccion por bloques;
- postmortem por debilidad;
- auditoria local de eventos.

No alcanzan para "siguiente generacion" porque no tienen backend, identidad de sesion, datos persistentes compartidos, LLM operacional ni interfaz verdaderamente viva.

## Camino propuesto

1. Usar `SOVERINGBACKEND` como runtime puente.
2. Mantener Contabilidad y Administracion como materias de validacion.
3. Migrar contratos academicos a `data/subjects`.
4. Convertir cada prototipo en una experiencia PWA conectada al backend.
5. Activar LLM por backend cuando el costo y la estrategia BYOK esten claros.
6. Integrar luego al Portal FCE, no antes.

## Piezas rescatadas

- Proxy Gemini/RAG con auditoria: `rescue/backend-legacy/nexus-ai-proxy`.
- Cola offline: `rescue/pwa/offline-sync-queue`.
- Metodo de examen reusable: `rescue/exam-method/nexus_exam_method`.
- Protocolo agnostico de materias: `rescue/simulador-administracion/NEXUS_SUBJECT_AGNOSTIC_PROTOCOL.md`.
- Prototipos: `prototypes/`.
- Memorias CTO: `docs/`.

## Criterio de producto

La experiencia futura debe dejar de ser "pagina con secciones" y pasar a ser "cabina de entrenamiento":

- mision actual;
- debilidad dominante;
- editor de respuesta;
- calculadora/asiento cuando aplique;
- feedback lateral;
- historial de intentos;
- coach LLM supervisado;
- modo offline con sync;
- datos exportables.

## Limites actuales

- Corrector escrito local no reemplaza un LLM.
- Eventos se guardan en JSONL local.
- No hay autenticacion real.
- No hay base de datos externa.
- No hay multiusuario.

Estos limites son aceptables para el primer puente porque la prioridad es probar el motor fuera del HTML monolitico.

