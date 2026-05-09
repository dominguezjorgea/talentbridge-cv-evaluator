# TalentBridge CV Evaluator — Plan de Acción
**Fecha:** 2026-05-09 | **Fuentes:** docs/01, 02, 03

---

## Resumen Ejecutivo

El prototipo funciona como prueba de concepto pero tiene tres familias de riesgo que bloquean su uso en producción: (1) **robustez cero** ante errores de API — un fallo en el candidato 7 de 10 pierde todos los resultados parciales; (2) **deuda de arquitectura crítica** — App.tsx de 625 líneas mezcla estado, lógica de negocio y UI en un único componente no testeable; (3) **riesgo de seguridad real** — la `GEMINI_API_KEY` queda embebida en el bundle del cliente, exponiéndola a cualquier usuario que abra DevTools si la app se publica como URL pública. Hay además un bug confirmado en el `StepIndicator` que invierte el estado visual de pasos completados. El roadmap prioriza estabilidad → mantenibilidad → funcionalidades avanzadas en tres fases de 1, 2 y 3 semanas respectivamente.

---

## Top 5 Acciones Inmediatas (por impacto)

### 1. Añadir `withRetry` + validadores post-parse en `geminiService.ts` ⚡ Esfuerzo: S

**Por qué primero:** Las 3 llamadas a Gemini fallan silenciosamente ante errores 429/503 y ante JSON malformado. Sin esto, todo lo demás se construye sobre arena.

**Archivos a modificar:**
- `src/services/geminiService.ts` — envolver las 3 llamadas con `withRetry()`
- `src/services/validators.ts` (nuevo) — `assertCriteriaArray`, `assertCandidateRanking`

**Resultado:** La app sobrevive errores transitorios de API y comunica errores de parseo con mensajes descriptivos en lugar de excepciones opacas.

---

### 2. Reemplazar `alert()` con `ErrorBanner` inline ⚡ Esfuerzo: S

**Por qué segundo:** Es el prerequisito para el ítem 4 (reintentos parciales). El `alert()` nativo corta el flujo; un banner inline permite mostrar el error y ofrecer "Reintentar" sin perder el contexto.

**Archivos a modificar:**
- `src/components/ui/ErrorBanner.tsx` (nuevo)
- `src/App.tsx` — eliminar 2 bloques `catch { alert(...) }`, añadir estado `error: string | null` por step

---

### 3. Progreso en tiempo real durante evaluación de CVs ⚡ Esfuerzo: M

**Por qué tercero:** La experiencia de usuario más dañina del prototipo — loading bloqueante sin feedback durante potencialmente 2-3 minutos. Además, si un CV falla, el loop actual no continúa con los siguientes.

**Cambios clave:**
- `src/App.tsx` (o `useCandidates`) — reemplazar `for...of` secuencial por loop con `try/catch` por iteración + actualización de `progress.done` en cada paso
- `src/components/ui/ProgressBar.tsx` (nuevo) — `{done}/{total} candidatos`
- `src/types.ts` — añadir `EvaluationProgress { total, done, failed }`

---

### 4. Exportar resultados a CSV ⚡ Esfuerzo: S

**Por qué cuarto:** El impacto es inmediato para reclutadores (enviar resultados al hiring manager) y el esfuerzo es mínimo — es una función pura sin dependencias de API.

**Archivos a modificar:**
- `src/utils/exportCsv.ts` (nuevo) — función `exportRankingsToCSV(rankings)`
- `src/App.tsx` — botón "Exportar CSV" en el paso RESULTS

---

### 5. Corregir bug de `StepIndicator` + lógica de `updateCriterionWeight` ⚡ Esfuerzo: S

**Por qué quinto:** Son bugs confirmados de bajo esfuerzo que dañan la percepción de calidad.

**Fix 1 — `StepIndicator` (línea ~250 de App.tsx):**
```ts
// Antes (lógica invertida):
const isPast = steps.indexOf(step) > steps.indexOf(activeStep);
// Corrección:
const isCompleted = steps.indexOf(activeStep) > steps.indexOf(step);
```

**Fix 2 — `updateCriterionWeight` (línea 176 de App.tsx):**
```ts
// Antes (muta el objeto interno):
newCriteria[index].weight = weight;
// Corrección:
newCriteria[index] = { ...newCriteria[index], weight };
```

---

## Dependencias entre mejoras

```
[1] withRetry + validadores
      └──► [2] ErrorBanner (necesita errores descriptivos para mensajes útiles)
              └──► [3] Progreso + reintentos parciales (necesita ErrorBanner para mostrar fallos)
                        └──► [4] Exportar CSV (necesita rankings estables = [3] completo)

[5] Bug fixes ──► independiente, hacerlo en paralelo con [1]

[Fase 2 — Refactoring] ──► depende de [1][2][3] completados
  useCriteria / useCandidates / useEvaluation
  JDStep / CriteriaStep / CVsStep / ResultsStep

[Fase 3] ──► depende de Fase 2
  Historial localStorage, carga de archivos, criteria_scores
```

---

## Estimación de esfuerzo por fase

| Fase | Contenido | Duración estimada |
|------|-----------|-------------------|
| **Fase 1** | Acciones 1-5 (estabilidad + UX básica) | ~1 semana |
| **Fase 2** | Refactoring hooks + componentes + prompts mejorados + ajuste manual de scores | ~2 semanas |
| **Fase 3** | Historial localStorage, carga PDF/TXT, criteria_scores, tests unitarios | ~2-3 semanas |
| **Total** | | **5-6 semanas** |

> **Nota de seguridad:** Si la app va a desplegarse como URL pública antes de que finalice la Fase 1, la única mitigación inmediata aceptable es establecer quotas de API key en Google Cloud Console y restringir la key al dominio de despliegue. La solución definitiva (backend proxy) requiere esfuerzo L y pertenece a Fase 2 o 3.

---

## Documentos de referencia

| Documento | Contenido |
|-----------|-----------|
| [01-analisis-tecnico.md](./01-analisis-tecnico.md) | Flujo de datos, deuda técnica (8 ítems), riesgo de seguridad, limitaciones de los 3 prompts Gemini |
| [02-arquitectura-y-ux.md](./02-arquitectura-y-ux.md) | Diagrama Mermaid, contratos de tipos, análisis UX por paso, 12 puntos de fricción, 7 propuestas de mejora UX |
| [03-propuestas-de-mejora.md](./03-propuestas-de-mejora.md) | Snippets accionables para withRetry, validadores, 3 prompts mejorados, refactoring completo con hooks, backlog de 5 funcionalidades, roadmap de 3 fases |
