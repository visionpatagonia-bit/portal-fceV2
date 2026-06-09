# Propuesta — Integración del sistema NEXUS al Portal FCE (todas las materias)

**Fecha:** 2026-06-08
**Repo portal analizado:** `visionpatagonia-bit/portal-fceV2` (público).

## Objetivo
Que el **Portal FCE** absorba **todas las funcionalidades del sistema nuevo** (cockpit) con **todas las materias** en el formato de estudio, conservando la **UX superior del portal**.

## Qué es el portal hoy
PWA vanilla JS/CSS **sin bundler** (`scripts/build.js` copia 1:1 a `dist/`), deploy en **Vercel**, persistencia en **Firestore**, **Firebase Auth Google**, UX "sovereign" (topbar+sidebar+componentes+a11y), IA = chat **Ollama local**, lógica de examen **monolítica en el browser** (`nexus-exam.js` = 20 MCQ). 116 materiales + bancos MCQ embebidos. **No tiene `api/` serverless.**

## Decisión de integración
**Aditiva, no destructiva.** El portal aporta la UX/Auth/Firestore/PWA/contenido; el cockpit aporta el **motor** (scoring determinista, contratos, secuencia adaptativa, calibración, Gemini backend-only, KB) + los **datos de estudio** (contratos + study-maps).

## El cuello de botella para "todas las materias"
Hoy el scoring es **por materia en código** → no escala. **Fase 1 = generalizar a un motor data-driven por TIPO de bloque**: la rúbrica vive en el contrato (JSON). Agregar materia = autoría de JSON, no programación.

### Familias de evaluación (el motor corrige por `kind`)
- **Objetiva** (opción múltiple / asociación / V-F): clave del contrato + gates anti-sesgo del Protocolo Agnóstico.
- **Rúbrica** (definición / desarrollo / caso): términos esperados por `conceptFamily`.
- **Cálculo** (asiento / liquidación): valores esperados + tolerancia + balance.

## Activos ya existentes que se reusan
- `nexus-academic-contract.schema.json` (contrato compartido).
- **NEXUS Subject-Agnostic Protocol** (fábrica de exámenes auditables + 8 gates).
- `rescue/exam-method/` (adapter + validador de contratos).
- Bancos MCQ + 116 materiales del portal (materia prima).

## Arquitectura objetivo
```
Portal (Vercel · UI sovereign · Firebase Auth · Firestore)
  └─ Sistema NEXUS de estudio (todas las materias)
        └─ /api/cockpit/*  (Vercel Functions)
              ├─ MOTOR data-driven (corrige por kind, lee contrato)
              ├─ contratos + study-maps por materia (JSON read-only)
              ├─ Gemini backend-only (env var) — borrador + feedback, nunca nota final
              └─ Firestore por uid: attempts, events, grades, calibración, KB
```
Gratis (Vercel Hobby + Firestore Spark + Gemini 2.5-flash) y durable.

## Pipeline para industrializar una materia (sin programar)
Ingesta → ejes cognitivos (conceptFamilies) → generar contrato + study-map (borrador Gemini, fundado) → pasar gates + validar schema → auditar → canonizar. Hasta auditar: `generated_unreviewed`.

## Plan por fases
1. **Generalizar el motor** a data-driven; re-expresar Contabilidad+Administración como puro dato (no-regresión: 8.64 / 10). 🟢
2. **Serverless + datos**: servicios puros → `/api/cockpit/*`. 🟢
3. **Persistencia Firestore** por uid + reglas. 🟡
4. **UI sovereign**: sección "Estudio/Simulador" cliente fino. 🟡
5. **Industrializar materias**: Sociales, Propedéutica y demás parciales vía pipeline. 🟠 (contenido)

## Honestidad sobre el esfuerzo
El **código** (motor + serverless + Firestore + UI) es acotado y de una vez. El **contenido** (contratos + study-maps de calidad por materia) es el grueso y continuo; Gemini acelera el borrador pero la **auditoría académica es obligatoria** antes de canonizar.

## Estado
Fase 1 en ejecución sobre la copia del cockpit (motor data-driven + no-regresión) antes de tocar el portal.
