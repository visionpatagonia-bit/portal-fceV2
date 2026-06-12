# NEXUS Study Cockpit — Adendum de auditoría operacional (lente infra/datos/gobernanza)

**Fecha:** 2026-06-11 · **Auditor:** Claude (arquitecto/CTO) · **Complementa:** AUDITORIA_COGNITIVA_2026-06-11.md + 00-CONSOLIDADO-AUDITORIA-EXTERNA.md

**Alcance:** la auditoría previa (7 lentes pedagógicas) es sólida y NO se re-audita. Este adendum cubre el lente que faltó: operaciones, persistencia, estadística de despliegue y gobernanza de datos. Hallazgos por severidad.

## F1 · CRÍTICO — El learner model BKT es amnésico en la infra actual
Render free duerme el dyno + FS efímero → cada sleep/restart borra P(L) de todos. El BKT *parece* tener memoria y no la tiene. **Fix (S):** persistir P(L) en almacenamiento durable externo (Firestore / Supabase / disco persistente Render). El servicio ya está aislado; cambia el backend de persistencia, no el modelo. **Gate:** ningún ruteo en vivo antes de este fix.

## F2 · CRÍTICO (pre-venta) — Gobernanza de datos = Ola 0, no complemento de #15
Para cobrar a ~1.300 alumnos: consentimiento, anonimización, privacidad, ToS y AUTH REAL son prerrequisito legal/reputacional. **Fix (M):** auth real, hash de UID, consentimiento, política de privacidad + ToS, export/borrado a pedido.

## F3 · ALTO — Cold-start psicométrico: flags necesitan N mínimo
p-value/biserial con n<30 son ruido con apariencia de señal; Rasch (#12) necesita ~100+/ítem. **Fix (S):** agregar `n` por ítem y suprimir flags con n<umbral (30 descriptivo, 100 para decisiones automáticas de #5/#12/#13).

## F4 · ALTO — P(L) default no debe mostrarse como número
slip/guess/transit son defaults de literatura, no calibrados. 4-aciertos→99.7% es optimista e infla confianza (el sesgo que #2/#10 combaten). Como ORDEN (`weakest`) es robusto; como número es promesa falsa. **Fix (S):** P(L) solo ordinal hasta calibrar; UI dice "tu bloque más débil es X", nunca el %.

## F5 · MEDIO — Estado pedagógico en localStorage no sobrevive el lanzamiento
SRS (#7) y juicios (#4) son client-side → celular/PC divergen; sin verdad server, #15 y la calibración de #4 no tienen datos confiables. **Fix (M):** migrar a la persistencia durable de F1, localStorage como cache.

## F6 · BAJO — Inconsistencia documental
El consolidado dice 3/15; mini-informes 01/03 dicen #1/#3 hechos. Real = 5/15. **Fix (XS):** actualizar el consolidado.

## F7 · CONTENIDO — `generated_unreviewed` es la mayor responsabilidad al cobrar
Enseñar contenido incorrecto a quien paga > cualquier bug. **Fix (M, proceso):** revisión académica humana materia por materia contra material real, antes de beta paga.

## Secuencia recomendada
- **Ahora (pre-recu):** F6 (5 min) + F1 (único fix técnico que vale antes del martes).
- **Gates permanentes (esta semana):** F3 (umbral n) + F4 (P(L) ordinal).
- **Ola 0 (pre-beta paga):** F2 + F5 + F7 (materia piloto).
- **Olas 1-3 cognitivas:** según el consolidado.

**Nota de uso inmediato (recu martes):** `GET /api/learner-model?weakest` es la brújula de estudio personal — `(1−P(L))·examWeight` = "qué estudiar esta noche". Con F1 aplicado, no se borra entre sesiones.
