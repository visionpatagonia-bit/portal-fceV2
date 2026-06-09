# Adaptive Content KB

## Objetivo

Guardar contenido adaptativo generado para reutilizarlo sin volver a llamar al LLM cuando la necesidad pedagogica es equivalente.

## Ubicacion local

```txt
data/kb/adaptive-content/index.json
data/kb/adaptive-content/entries/*.json
```

Esta KB no guarda API keys ni respuestas completas del estudiante.

## Huella de reutilizacion

La clave se calcula con:

```txt
subjectId + blockId + mode + targetMisses normalizados
```

Esto permite reutilizar contenido cuando el estudiante vuelve a tener el mismo tipo de hueco.

## Flujo

1. Frontend pide `/api/study/adaptive-content`.
2. Backend revisa KB por huella exacta.
3. Si existe, devuelve `provider: "kb"` y `status: "kb_reused"`.
4. Si no existe, llama Gemini.
5. Backend normaliza la respuesta.
6. Backend guarda la entrada en KB.
7. Frontend muestra si fue `Guardado en KB` o `Reutilizado desde KB`.

## Seguridad

La entrada marca:

```json
{
  "excludesStudentAnswer": true,
  "excludesApiKey": true,
  "finalScoreAuthority": "deterministic_core"
}
```

## Calidad

Contenido generado por Gemini queda como:

```txt
generated_unreviewed
```

Reutilizable no significa canonico. Para volverlo canonico se requiere:

```txt
subject_matter_review
exam_contract_alignment
```

## Endpoints

```txt
POST /api/study/adaptive-content
GET  /api/kb/adaptive-content
GET  /api/kb/adaptive-content/:entryId
```

## Forzar nueva variante

Enviar:

```json
{
  "forceNew": true
}
```

Esto saltea la reutilizacion y guarda una nueva version sobre la misma huella.
