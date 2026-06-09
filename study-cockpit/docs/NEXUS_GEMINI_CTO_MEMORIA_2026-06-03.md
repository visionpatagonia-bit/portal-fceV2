# NEXUS - memoria CTO Gemini, bajo coste y seguridad

Fecha: 2026-06-03.

## Decision

NEXUS no debe exponer claves de Gemini en el frontend. El camino defendible ante ingenieria backend, ciberseguridad y auditoria institucional es:

```text
Alumno
-> NEXUS frontend
-> Backend/proxy NEXUS
-> Gemini API
```

La clave vive solo en backend, como variable de entorno o secret manager. El navegador nunca recibe `GEMINI_API_KEY`.

## Por que no alcanza con "cuenta Google"

Iniciar sesion con Google sirve para identidad, pero no transfiere automaticamente la cuota personal de Gemini web al portal. Para consumir Gemini API se usa un proyecto con API habilitada, credenciales y limites. Por eso el login de Google no reemplaza una arquitectura de consumo API.

## Riesgos a evitar

No publicar:

```text
HTML standalone con GEMINI_API_KEY embebida
```

No guardar claves en:

- `localStorage`
- `sessionStorage`
- JavaScript del bundle
- llamadas directas desde navegador a la API de Gemini

No usar rotacion automatica de claves de usuarios para eludir cuotas. Si se usa BYOK, debe ser opt-in, transparente y para beta controlada.

## Arquitectura recomendada

```text
NEXUS app
-> /api/evaluate-written-answer
-> autenticacion alumno
-> rate limit por alumno
-> anonimizacion del prompt
-> rubrica local por materia
-> Gemini como evaluador auxiliar
-> respuesta JSON estructurada
-> NEXUS decide feedback y puntaje final
```

Gemini no debe ser el juez unico. Su funcion es interpretar lenguaje natural, detectar omisiones y proponer feedback. El contrato academico decide el puntaje final.

## Bajo coste

El motor local resuelve sin API:

- calculos
- asientos
- equilibrio Debe/Haber
- verdadero/falso
- seleccion multiple
- rubricas simples
- progreso y repeticion

Gemini se usa solo para:

- respuestas escritas complejas
- explicaciones con redaccion libre
- deteccion de contradicciones
- repreguntas socraticas
- feedback personalizado breve

Esto mantiene costo bajo y reduce dependencia.

## BYOK

BYOK significa "bring your own key": cada tester usa su propia clave de Google AI Studio.

Uso aceptable:

- beta cerrada
- usuario mayor de edad
- consentimiento explicito
- clave enviada al proxy y no embebida en el HTML
- sin almacenar la clave salvo que exista consentimiento y mecanismo seguro

No usar BYOK como argumento principal ante la universidad. La postura institucional debe ser proxy NEXUS centralizado.

## Multiples cuentas Google, de forma honesta

La mirada correcta no es "evadir costos", sino construir disponibilidad en etapa beta con consentimiento explicito y trazabilidad.

Modelo aceptable:

```text
NEXUS frontend
-> Backend/proxy NEXUS
-> Provider Router
-> Proyecto/API key institucional principal
-> Proyecto/API key BYOK de tester voluntario, solo si acepto
-> Fallback local deterministico si no hay cupo
```

Reglas:

- Cada cuenta/proyecto debe pertenecer a una persona o entidad que acepto los terminos correspondientes.
- La clave nunca se expone en frontend.
- La clave BYOK se envia solo al backend/proxy y se almacena solo si existe consentimiento y mecanismo seguro.
- El usuario debe poder revocar su clave.
- El sistema debe mostrar estado: `principal disponible`, `BYOK disponible`, `sin LLM, modo local`.
- No rotar claves para ocultar consumo, eludir limites o simular una capacidad que no existe.
- El uso de multiples cuentas no debe presentarse como arquitectura institucional final.

Objetivo:

```text
Mantener resultado disponible en piloto,
sin romper terminos,
sin exponer secretos,
sin esconder costos reales.
```

Estrategia recomendada:

1. Primero, proyecto NEXUS centralizado con billing/control de gasto.
2. Segundo, cache de respuestas y rubricas para no repetir llamadas.
3. Tercero, BYOK voluntario para testers internos cuando el proyecto central alcance limite.
4. Cuarto, fallback local/deterministico para que el alumno nunca quede bloqueado.

El router debe decidir por politica, no por azar:

```json
{
  "llm_policy": "central_first",
  "allow_byok": true,
  "fallback_local": true,
  "log_provider_used": true,
  "never_expose_key_to_client": true
}
```

Punto de auditoria: Google aplica limites de Gemini API por proyecto, no por API key. Por eso crear muchas keys dentro del mismo proyecto no aumenta disponibilidad. Si se usan proyectos/cuentas diferentes, debe hacerse con consentimiento, trazabilidad y sin ocultar el uso real.

## Privacidad y terminos

Para el nivel gratuito de Gemini API, tratar prompts y respuestas como potencialmente revisables o utilizables para mejora de producto segun terminos vigentes del proveedor. Por lo tanto:

- no enviar DNI
- no enviar legajo
- no enviar nombre y apellido
- no enviar datos sensibles
- no enviar bibliografia completa si solo hace falta una rubrica breve
- versionar rubrica, modelo y fecha de evaluacion

Referencias oficiales a revisar antes de demo institucional:

- https://ai.google.dev/gemini-api/docs/api-key
- https://ai.google.dev/gemini-api/docs/oauth
- https://ai.google.dev/gemini-api/docs/rate-limits
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/terms
- https://cloud.google.com/docs/authentication/api-keys

## Checklist para demo

- [ ] Ninguna clave en frontend.
- [ ] Endpoint backend con rate limit.
- [ ] Logs sin PII.
- [ ] Prompts anonimizados.
- [ ] Respuestas de Gemini en JSON estructurado.
- [ ] Kill switch de costo.
- [ ] Versionado de rubricas.
- [ ] Fallback local si no hay API.
- [ ] Etiquetado de evidencia: `observed`, `corpus-grounded`, `inferred`.

## Decision de producto

La ventaja de NEXUS no es "tener chatbot". La ventaja es convertir material real de catedra en entrenamiento escrito, calculo, simulacro y feedback adaptativo. Gemini es un interlocutor auxiliar, reemplazable y de bajo coste cuando se usa con precision.
