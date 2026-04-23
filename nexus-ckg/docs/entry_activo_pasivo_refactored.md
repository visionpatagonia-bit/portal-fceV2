# Activo y Pasivo — Entry refactoreado al nuevo estándar CKG

> **Contexto:** este entry reemplaza al anterior `activo_vs_pasivo` del KB que recibió observación técnica de Gustavo Trucco el 2026-04-23. La crítica fue que la redacción coloquial fusionaba bienes y derechos sin diferenciarlos y omitía el criterio de control.
> **Estándar CKG v0.1.0:** toda definición canónica es literal del documento fuente citado; ningún marco normativo se presenta sin indicar vigencia temporal.

---

## ACTIVO

### Definición canónica — Marco Conceptual IASB 2018

> "Un activo es un recurso económico presente controlado por la entidad como resultado de sucesos pasados. Un recurso económico es un derecho que tiene el potencial de producir beneficios económicos."

**Fuente:** Marco Conceptual para la Información Financiera (IFRS Foundation, revisión 2018), §4.3 y §4.4.
**Vigencia:** desde 2020-01-01, sin derogación a la fecha.
**Verification status:** `draft_based_on_training_knowledge` — pendiente cotejo contra PDF oficial antes del próximo contacto con Trucco.

### Descomposición de criterios

Para que algo califique como activo bajo IASB 2018 **deben concurrir** los cuatro criterios:

1. **Recurso económico** — es un **derecho**, no el bien físico per se. Lo que se reconoce es el derecho a obtener los beneficios económicos.
2. **Controlado por la entidad** — la entidad tiene capacidad para dirigir el uso del recurso y obtener los beneficios económicos, y puede restringir el acceso de terceros.
3. **Como resultado de sucesos pasados** — el hecho originante ya ocurrió. No califican meras intenciones futuras.
4. **Potencial de producir beneficios económicos** — existe al menos una circunstancia en la cual el recurso puede generar beneficios (el potencial no exige certeza, solo posibilidad real).

### Distinción crítica: bienes físicos vs derechos

**Esta es la observación que motivó el refactor.** La formulación coloquial "activo = lo que la entidad tiene" es técnicamente incompleta: confunde el objeto físico con el derecho sobre sus beneficios.

- Un mismo bien físico puede ser activo para la parte que controla sus beneficios económicos y no serlo para otra parte que conserva la titularidad formal pero cedió los derechos.
- Un derecho puede ser activo sin que exista bien físico alguno (ej: un crédito por cobrar, una licencia, un derecho contractual).
- Un recurso físico que la entidad posee pero cuyos beneficios no controla — no es activo en sentido contable.

### Contraejemplos (qué NO es activo)

- **Plusvalía (goodwill) generada internamente** — excluida por NIC 38 §63. Solo se reconoce el goodwill adquirido en combinación de negocios (NIIF 3). Razón: no es un recurso identificable ni su costo es medible fiablemente en el momento de surgir.
- **Recursos físicos accesibles pero no controlados** — ejemplo clásico: un río lindante sin derechos de uso exclusivo. Falta el criterio de control.
- **Expectativa de ingresos futuros sin hecho generador pasado** — falla el criterio de "sucesos pasados".

---

## PASIVO

### Definición canónica — Marco Conceptual IASB 2018

> "Un pasivo es una obligación presente de la entidad de transferir un recurso económico como resultado de sucesos pasados."

**Fuente:** Marco Conceptual IASB 2018, §4.26 y siguientes.
**Verification status:** `draft_based_on_training_knowledge`.

### Descomposición de criterios

Concurren tres elementos:

1. **Obligación presente** — la entidad está obligada actualmente, no eventualmente. Puede ser legal o implícita (derivada de prácticas pasadas que han creado expectativa legítima en terceros).
2. **Transferencia de un recurso económico** — el cumplimiento exigirá entregar efectivo, otros activos, o prestar servicios.
3. **Como resultado de sucesos pasados** — el hecho que generó la obligación ya ocurrió.

### Contraejemplos (qué NO es pasivo)

- **Pasivo contingente** — NIC 37 §10 lo excluye del reconocimiento. Solo se revela en notas. Razón: la obligación no existe con certeza o no es medible fiablemente.
- **Intención de compra futura sin compromiso firme** — no hay obligación presente ni suceso pasado generador.
- **Compromiso operativo sin contraparte vinculada** — ejemplo: decidir internamente gastar en marketing el próximo año.

---

## Situación en Argentina — NUA (RT 54 con T.O. RT 59, modificaciones RT 62)

Para ejercicios iniciados a partir del **1° julio 2024** rige la Norma Unificada Argentina de Contabilidad. Aprobada por RT 54 (julio 2022), ampliada por RT 56, reordenada en texto por RT 59, y modificada por RT 62 (nov 2025) para incorporar el Capítulo 12 sobre cooperativas.

> _Texto canónico NUA **pendiente** — se agregará aquí la definición formal de activo y pasivo bajo NUA una vez accesado el PDF oficial (RT 54 / T.O. RT 59) en formato procesable._

**Fuentes a ingerir:**
- RT 54 FACPCE — texto oficial: https://www.facpce.org.ar/wp-content/uploads/2022/07/RT54.pdf
- Fowler Newton, *La NUA según la RT 59* (2025) — http://www.fowlernewton.com.ar/libros/nua2025.pdf
- Fowler Newton, *La NUA según la RT 62* (2026) — material nuevo mencionado por Trucco

## Situación histórica — RT 16 (ejercicios iniciados antes del 1° julio 2024)

La RT 16 estableció el Marco Conceptual de Normas Contables Profesionales argentino antes de la unificación. Sigue aplicable para ejercicios anteriores y como referencia histórica para entender la evolución hasta NUA.

> _Texto canónico RT 16 **pendiente** — relevante para completar el análisis comparativo de los tres marcos._

---

## Auditoría interna del entry (checklist de cumplimiento del estándar CKG)

- [x] Definición canónica presente **con texto literal** (no paráfrasis) — IASB ✓ / NUA pendiente / RT 16 pendiente
- [x] **Fuente citada con sección exacta** (§4.3, §4.4, §4.26)
- [x] **Descomposición explícita de criterios** (4 para activo, 3 para pasivo)
- [x] **Distinción bienes físicos vs derechos** — crítica Trucco resuelta
- [x] **Contraejemplos con fuente que los excluye** (NIC 38 §63, NIC 37 §10)
- [x] **Framework scope codificado** — IASB / NUA / RT 16 diferenciados, no fusionados
- [x] **Temporal validity** — fechas de vigencia explícitas
- [x] **Verification status** visible para cada marco (verified / pending / draft)
- [ ] Cotejo contra PDF oficial — **pendiente, acción prioritaria**
- [ ] Revisión externa de curador (Trucco, si acepta rol) — pendiente

---

## Delta respecto al entry anterior (pre-refactor)

| Dimensión | Entry anterior | Entry nuevo |
|---|---|---|
| Diferenciación bienes / derechos | fusionados | explícita, con ejemplos |
| Criterio de control | ausente | presente y definido |
| Potencial de beneficios futuros | ausente | presente |
| Fuente citada | no | sí, con § |
| Marco normativo argentino actual (NUA) | no considerado | codificado con temporal validity |
| Verification status | no existía | explícito por definición |
| Contraejemplos con fuente | no | sí |

---

**Versión del entry:** 0.1.0 (Sprint CKG Día 1, 2026-04-23)
**Versión previa del entry en KB:** `activo_vs_pasivo` (observado por Trucco 2026-04-23, deprecado)
