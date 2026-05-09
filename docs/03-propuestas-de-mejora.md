# TalentBridge CV Evaluator — Propuestas de Mejora

> Documento accionable para el equipo de desarrollo. Basado en análisis de `geminiService.ts`, `types.ts` y `App.tsx`.

---

## 1. Mejoras al Servicio Gemini

### 1.1 Capa de reintentos con exponential backoff

Actualmente ninguna de las 3 llamadas tiene reintentos. Ante un error 429 o 503 la app lanza `alert()` y el usuario pierde todo el contexto.

**Solución: utilidad `withRetry` compartida**

```typescript
// src/services/geminiService.ts — añadir al inicio del archivo

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 800
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isRetryable =
        err instanceof Error &&
        (err.message.includes('429') || err.message.includes('503'));
      if (!isRetryable || attempt === maxAttempts) throw err;
      await new Promise(r => setTimeout(r, baseDelayMs * 2 ** (attempt - 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

// Uso en cada función:
const response = await withRetry(() =>
  ai.models.generateContent({ model: '...', contents: prompt, config })
);
```

### 1.2 Validación de respuestas malformadas

El `JSON.parse(response.text)` falla silenciosamente si el modelo devuelve texto vacío o JSON parcial. Se necesita validación post-parse.

```typescript
// src/services/validators.ts (nuevo archivo pequeño)

export function assertCriteriaArray(data: unknown): asserts data is Criterion[] {
  if (!Array.isArray(data) || data.length === 0)
    throw new Error('extractCriteria: respuesta vacía o no es array');
  for (const item of data) {
    if (typeof item.name !== 'string' || typeof item.weight !== 'number')
      throw new Error(`Criterio malformado: ${JSON.stringify(item)}`);
    if (item.weight < 0 || item.weight > 100)
      throw new Error(`Peso inválido en criterio "${item.name}": ${item.weight}`);
  }
}

export function assertCandidateRanking(data: unknown): asserts data is CandidateRanking {
  const d = data as Record<string, unknown>;
  if (typeof d.name !== 'string') throw new Error('name faltante en CandidateRanking');
  if (typeof d.score !== 'number' || d.score < 0 || d.score > 10)
    throw new Error(`Score inválido para candidato "${d.name}": ${d.score}`);
  if (!['AVANZAR', 'CONSIDERAR', 'RECHAZAR'].includes(d.recommendation as string))
    throw new Error(`Recomendación inválida: ${d.recommendation}`);
}
```

Integración en `extractCriteria`:
```typescript
const parsed = JSON.parse(response.text);
assertCriteriaArray(parsed);
// normalizar pesos para que sumen 100
const total = parsed.reduce((s, c) => s + c.weight, 0);
return parsed.map(c => ({ ...c, weight: Math.round((c.weight / total) * 100) }));
```

### 1.3 Mejoras de prompt — `extractCriteria`

**Problema actual:** el prompt no especifica el idioma de salida, no pide mínimo/máximo de criterios, y no indica la escala de pesos.

**Prompt mejorado (reemplazo directo):**

```typescript
const prompt = `
Eres un Headhunter Técnico Senior B2B de TalentBridge con 15 años de experiencia en selección tech.

TAREA: Analiza la Job Description y extrae entre 5 y 8 criterios de evaluación.
- Mínimo 40% del peso total debe corresponder a criterios técnicos (hard skills).
- Mínimo 20% a criterios blandos (soft skills).
- Los pesos deben sumar EXACTAMENTE 100.
- Responde siempre en ESPAÑOL.
- Los "observable_signs" deben ser frases concretas buscables en texto de CV (ej: "menciona X años en Y").
- Los "degradation_signs" deben describir ausencias o contradicciones detectables.

JOB DESCRIPTION:
---
${jd}
---

Devuelve SOLO el JSON válido. Sin texto extra.
`;
```

### 1.4 Mejoras de prompt — `evaluateCandidate`

**Problema actual:** el prompt no ancla el score al peso ponderado de cada criterio, lo que produce scores subjetivos.

**Prompt mejorado:**

```typescript
const criteriaTable = criteria
  .map(c => `- ${c.name} (peso: ${c.weight}%): ${c.observable_signs}`)
  .join('\n');

const prompt = `
Eres un evaluador de TalentBridge. Tu tarea es puntuar este CV de forma objetiva y reproducible.

CRITERIOS DE EVALUACIÓN (total = 100%):
${criteriaTable}

REGLAS DE SCORING:
- Cada criterio recibe un score_parcial de 0-10.
- El score final = suma(score_parcial_i * peso_i / 100), redondeado a 1 decimal.
- Cita SIEMPRE fragmentos literales del CV como evidencia (entre comillas).
- Red flags son concretos: gaps > 2 años, inconsistencias de fechas, habilidades reclamadas sin evidencia.
- Recomendación automática: AVANZAR (≥8.0), CONSIDERAR (6.0-7.9), RECHAZAR (<6.0).
- Si el CV no contiene nombre, usa el primer cargo mencionado como identificador.
- Responde en ESPAÑOL. Sin texto fuera del JSON.

JOB DESCRIPTION:
---
${jd}
---

CV DEL CANDIDATO:
---
${cv}
---
`;
```

**Schema enriquecido** — añadir `criteria_scores` por criterio para trazabilidad:

```typescript
// En responseSchema de evaluateCandidate
criteria_scores: {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      criterion_name: { type: Type.STRING },
      score: { type: Type.NUMBER },      // 0-10
      justification: { type: Type.STRING },
    },
    required: ['criterion_name', 'score', 'justification'],
  }
},
```

Y en `types.ts`, agregar a `CandidateRanking`:
```typescript
criteria_scores?: Array<{
  criterion_name: string;
  score: number;
  justification: string;
}>;
```

### 1.5 Mejoras de prompt — `generateExecutiveSummary`

**Problema actual:** el prompt no usa los criterios enviados ni da contexto del puesto. El resumen pierde riqueza.

**Prompt mejorado:**

```typescript
const topCriteria = criteria
  .sort((a, b) => b.weight - a.weight)
  .slice(0, 3)
  .map(c => c.name)
  .join(', ');

const prompt = `
Eres el Director de Selección de TalentBridge. Revisa los resultados del triage y genera un resumen ejecutivo para el cliente.

CRITERIOS MÁS IMPORTANTES (por peso): ${topCriteria}

RANKINGS COMPLETOS:
${JSON.stringify(rankings.map(r => ({
  nombre: r.name,
  score: r.score,
  recomendacion: r.recommendation,
  red_flags_count: r.red_flags?.length ?? 0,
  gaps_count: r.gaps?.length ?? 0,
})), null, 2)}

INSTRUCCIONES:
- "top_3": nombres exactos de los 3 mejores candidatos, ordenados por score descendente.
- "consider": candidatos con recomendación CONSIDERAR (puede ser lista vacía).
- "key_differentiator": 1-2 oraciones sobre qué separó al top del resto, usando los criterios de mayor peso.
- "hiring_risk": describe el mayor riesgo de contratar en este lote (ej: pool pequeño, pocos candidatos AVANZAR).
- Responde en ESPAÑOL. Sin texto fuera del JSON.
`;
```

**Schema enriquecido** — añadir `hiring_risk`:

```typescript
// En responseSchema de generateExecutiveSummary
hiring_risk: { type: Type.STRING },
```

Y en `types.ts`:
```typescript
export interface ExecutiveSummary {
  top_3: string[];
  consider: string[];
  key_differentiator: string;
  hiring_risk: string;   // NUEVO
  total_evaluated: number;
}
```

---

## 2. Refactoring Propuesto

### 2.1 Estructura de carpetas objetivo

```
src/
  hooks/
    useEvaluation.ts      ← orquesta el flujo completo
    useCriteria.ts        ← gestiona criterios + peso
    useCandidates.ts      ← gestiona lote de CVs + progreso
  components/
    steps/
      JDStep.tsx
      CriteriaStep.tsx
      CVsStep.tsx
      ResultsStep.tsx
    ui/
      ErrorBanner.tsx     ← reemplaza alert()
      ProgressBar.tsx     ← nuevo
      CandidateCard.tsx   ← ya existe inline, extraer
      StepIndicator.tsx   ← ya existe inline, extraer
  services/
    geminiService.ts
    validators.ts         ← nuevo
  types.ts
  App.tsx                 ← solo layout + routing entre steps
```

### 2.2 Custom Hooks

#### `useCriteria`

**Responsabilidades:**
- Estado: `jd`, `criteria`, `loading`, `error`
- Función `submitJD(jd: string)`: llama `extractCriteria`, aplica `assertCriteriaArray`, normaliza pesos
- Función `updateWeight(index, weight)`: actualiza peso + recalcula para que sumen 100
- Función `addCriterion(criterion)` / `removeCriterion(index)`: edición manual
- Expone `totalWeight` calculado (para mostrar aviso si no suma 100)

```typescript
// src/hooks/useCriteria.ts
export function useCriteria() {
  const [jd, setJd] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalWeight = useMemo(
    () => criteria.reduce((s, c) => s + c.weight, 0),
    [criteria]
  );

  const submitJD = async (rawJd: string) => {
    setError(null);
    setLoading(true);
    try {
      const result = await extractCriteria(rawJd);
      setCriteria(result);
      setJd(rawJd);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const updateWeight = (index: number, weight: number) => {
    setCriteria(prev => prev.map((c, i) => i === index ? { ...c, weight } : c));
  };

  return { jd, criteria, loading, error, totalWeight, submitJD, updateWeight };
}
```

#### `useCandidates`

**Responsabilidades:**
- Estado: `cvBatch` (texto raw), `cvList` (array parseado), `rankings`, `progress` (`{ done, total }`)
- Función `setCvBatch(text)`: actualiza texto y recalcula `cvList` con el split por `---`
- Función `runEvaluation(criteria, jd)`: itera CVs, llama `evaluateCandidate` con reintento, actualiza `progress` en tiempo real, llama `generateExecutiveSummary` al final
- Expone `failedCvs: string[]` — CVs que fallaron tras reintentos (partial success)

```typescript
// src/hooks/useCandidates.ts (fragmento clave)
const runEvaluation = async (criteria: Criterion[], jd: string) => {
  setProgress({ done: 0, total: cvList.length });
  setError(null);
  const results: CandidateRanking[] = [];
  const failed: string[] = [];

  for (const cv of cvList) {
    try {
      const result = await evaluateCandidate(cv, criteria, jd);
      assertCandidateRanking(result);
      results.push(result);
    } catch {
      failed.push(cv.slice(0, 80) + '...');  // primeros 80 chars como referencia
    } finally {
      setProgress(p => ({ ...p, done: p.done + 1 }));
    }
  }

  setFailedCvs(failed);
  const sorted = results.sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 }));
  setRankings(sorted);

  if (results.length > 0) {
    const summary = await generateExecutiveSummary(results, criteria);
    setExecutiveSummary({ ...summary, total_evaluated: cvList.length });
  }
};
```

#### `useEvaluation` (orquestador)

**Responsabilidades:**
- Compone `useCriteria` + `useCandidates`
- Gestiona `step: AppStep` y las transiciones entre pasos
- Función `reset()`: limpia todo el estado y vuelve a `'JD'`
- Calcula `nearTies` (lógica actualmente inline en `App.tsx`)
- Es el único hook que `App.tsx` importa directamente

```typescript
// src/hooks/useEvaluation.ts
export function useEvaluation() {
  const [step, setStep] = useState<AppStep>('JD');
  const criteria = useCriteria();
  const candidates = useCandidates();

  const nearTies = useMemo(() => {
    // lógica extraída de App.tsx
  }, [candidates.rankings]);

  const confirmCriteria = () => setStep('CVS');
  const reset = () => {
    criteria.reset();
    candidates.reset();
    setStep('JD');
  };

  return { step, setStep, criteria, candidates, nearTies, confirmCriteria, reset };
}
```

### 2.3 Componentes de paso

| Componente | Props clave | Responsabilidades |
|---|---|---|
| `JDStep` | `onSubmit(jd)`, `loading`, `error` | Textarea JD, botón submit, mostrar `ErrorBanner` si hay error |
| `CriteriaStep` | `criteria`, `totalWeight`, `onUpdateWeight`, `onAddCriterion`, `onRemove`, `onConfirm` | Lista editable de criterios, validación de suma = 100, botón confirmar deshabilitado si peso ≠ 100 |
| `CVsStep` | `cvBatch`, `onChange`, `cvCount`, `progress`, `onSubmit`, `loading` | Textarea CVs, `ProgressBar` inline, muestra `failedCvs` si los hay |
| `ResultsStep` | `rankings`, `executiveSummary`, `nearTies`, `onReset`, `onExportCSV` | Tabla de rankings, resumen ejecutivo, `NearTiesAlert`, botones de exportar y reset |

### 2.4 `App.tsx` post-refactoring

```typescript
// App.tsx resultante — ~40 líneas en lugar de ~350
export default function App() {
  const { step, criteria, candidates, nearTies, confirmCriteria, reset } = useEvaluation();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header step={step} />
      <main className="container mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {step === 'JD' && (
            <JDStep onSubmit={criteria.submitJD} loading={criteria.loading} error={criteria.error} />
          )}
          {step === 'CRITERIA' && (
            <CriteriaStep
              criteria={criteria.criteria}
              totalWeight={criteria.totalWeight}
              onUpdateWeight={criteria.updateWeight}
              onConfirm={confirmCriteria}
            />
          )}
          {step === 'CVS' && (
            <CVsStep
              cvBatch={candidates.cvBatch}
              onChange={candidates.setCvBatch}
              progress={candidates.progress}
              onSubmit={() => candidates.runEvaluation(criteria.criteria, criteria.jd)}
              loading={candidates.loading}
              failedCvs={candidates.failedCvs}
            />
          )}
          {step === 'RESULTS' && (
            <ResultsStep
              rankings={candidates.rankings}
              executiveSummary={candidates.executiveSummary}
              nearTies={nearTies}
              onReset={reset}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
```

### 2.5 `ErrorBanner` — reemplazar `alert()`

```typescript
// src/components/ui/ErrorBanner.tsx
export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onDismiss} className="text-rose-400 hover:text-rose-600">✕</button>
    </div>
  );
}
```

---

## 3. Backlog Funcional Priorizado

### P1 — Modo batch con progreso en tiempo real _(Impacto: Alto | Esfuerzo: M — 2-3 días)_

**Caso de uso:** El usuario carga 10 CVs y actualmente ve una pantalla bloqueada sin feedback. Con 10 llamadas secuenciales puede esperar 2-3 minutos sin saber qué está pasando.

**Cambios en `types.ts`:**
```typescript
// Añadir a types.ts
export interface EvaluationProgress {
  total: number;
  done: number;
  currentCandidateName?: string;  // nombre extraído del CV en proceso
  failed: number;
}
```

**Cambios en `geminiService.ts`:** ninguno — la lógica de progreso vive en `useCandidates`.

**Cambios en `App.tsx` / hooks:** `useCandidates.runEvaluation` actualiza `progress.done` después de cada CV. `CVsStep` muestra `ProgressBar` con `{done}/{total}` y nombre del candidato actual.

```typescript
// ProgressBar.tsx
<div className="w-full bg-slate-200 rounded-full h-2">
  <div
    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
    style={{ width: `${(progress.done / progress.total) * 100}%` }}
  />
</div>
<p className="text-xs text-slate-500 mt-2">
  Evaluando {progress.done}/{progress.total} — {progress.currentCandidateName ?? '...'}
</p>
```

---

### P2 — Exportar resultados a CSV _(Impacto: Alto | Esfuerzo: S — <1 día)_

**Caso de uso:** El reclutador necesita enviar los resultados al hiring manager en un formato que se pueda abrir en Excel.

**Cambios en `types.ts`:** ninguno.

**Cambios en `geminiService.ts`:** ninguno.

**Nueva utilidad:**
```typescript
// src/utils/exportCsv.ts
export function exportRankingsToCSV(rankings: CandidateRanking[]): void {
  const headers = ['Rank', 'Nombre', 'Score', 'Recomendación', 'Fortalezas', 'Brechas', 'Red Flags'];
  const rows = rankings.map(r => [
    r.rank ?? '',
    r.name,
    r.score,
    r.recommendation,
    r.strengths.join(' | '),
    r.gaps.join(' | '),
    r.red_flags.join(' | '),
  ]);
  const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `talentbridge-triage-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

Integración: botón "Exportar CSV" en `ResultsStep` llama `exportRankingsToCSV(rankings)`.

---

### P3 — Ajuste manual post-IA de scores _(Impacto: Alto | Esfuerzo: M — 2-3 días)_

**Caso de uso:** El reclutador conoce contexto que el modelo no tiene (referidos, entrevista previa). Quiere ajustar el score de un candidato y que la recomendación se recalcule automáticamente.

**Cambios en `types.ts`:**
```typescript
export interface CandidateRanking {
  // ... campos existentes ...
  score_ai: number;          // NUEVO — score original del modelo
  score_override?: number;   // NUEVO — ajuste manual
  score: number;             // computed: score_override ?? score_ai
  override_note?: string;    // NUEVO — razón del ajuste
}
```

**Cambios en `geminiService.ts`:** al parsear la respuesta, copiar `score` a `score_ai`:
```typescript
const parsed = JSON.parse(response.text);
assertCandidateRanking(parsed);
return { ...parsed, score_ai: parsed.score };
```

**En `useCandidates`:** función `overrideScore(index, newScore, note)`:
```typescript
const overrideScore = (index: number, newScore: number, note: string) => {
  setRankings(prev => {
    const updated = prev.map((r, i) => {
      if (i !== index) return r;
      const score = newScore;
      const recommendation =
        score >= 8.0 ? 'AVANZAR' : score >= 6.0 ? 'CONSIDERAR' : 'RECHAZAR';
      return { ...r, score, score_override: newScore, override_note: note, recommendation };
    });
    return updated.sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 }));
  });
};
```

En `CandidateCard`: pequeño botón de edición inline con input numérico y textarea para nota.

---

### P4 — Historial de evaluaciones con localStorage _(Impacto: Medio | Esfuerzo: M — 2-3 días)_

**Caso de uso:** El reclutador cierra el navegador accidentalmente y pierde 10 evaluaciones. También quiere comparar distintos lotes para el mismo puesto.

**Cambios en `types.ts`:**
```typescript
export interface EvaluationSession {
  id: string;              // crypto.randomUUID()
  created_at: string;      // ISO 8601
  job_title: string;       // extraído del JD o ingresado manualmente
  jd: string;
  criteria: Criterion[];
  rankings: CandidateRanking[];
  executive_summary: ExecutiveSummary;
}
```

**Cambios en `geminiService.ts`:** ninguno.

**Nuevo hook `useHistory`:**
```typescript
// src/hooks/useHistory.ts
const STORAGE_KEY = 'talentbridge_sessions';

export function useHistory() {
  const [sessions, setSessions] = useState<EvaluationSession[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
    catch { return []; }
  });

  const saveSession = (session: Omit<EvaluationSession, 'id' | 'created_at'>) => {
    const full: EvaluationSession = {
      ...session,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    const updated = [full, ...sessions].slice(0, 20); // máximo 20 sesiones
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSessions(updated);
    return full.id;
  };

  const deleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSessions(updated);
  };

  return { sessions, saveSession, deleteSession };
}
```

En `useEvaluation`: llamar `saveSession` automáticamente al completar `runEvaluation`. Añadir panel lateral "Historial" accesible desde el header.

---

### P5 — Carga de CVs desde archivo .txt / .pdf _(Impacto: Medio | Esfuerzo: L — 1+ semana)_

**Caso de uso:** Los CVs llegan como archivos adjuntos. Pegar texto manualmente es lento y propenso a errores de formato.

**Cambios en `types.ts`:**
```typescript
export type CVSource = 'text' | 'file';

export interface CVFile {
  name: string;
  source: CVSource;
  content: string;   // texto extraído
  size: number;      // bytes originales
}
```

**Cambios en `geminiService.ts`:** para PDFs, usar la Gemini Files API:
```typescript
// src/services/fileProcessor.ts (nuevo)
export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'text/plain') {
    return file.text();
  }
  if (file.type === 'application/pdf') {
    // Usar Gemini Files API + inline data si < 20MB
    const buffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          { text: 'Extrae el texto completo de este CV en formato plano. Sin markdown.' },
          { inlineData: { mimeType: 'application/pdf', data: base64 } },
        ]
      }]
    });
    return response.text;
  }
  throw new Error(`Formato no soportado: ${file.type}`);
}
```

**En `CVsStep`:** añadir zona drag-and-drop con `<input type="file" multiple accept=".txt,.pdf">`. Cada archivo procesado se convierte en un elemento del `cvList` con el mismo formato que el split por `---`. El texto extraído se puede previsualizar antes de evaluar.

**Esfuerzo L** por: manejo de errores de extracción por archivo, límite de tamaño, preview UI, tests.

---

## 4. Roadmap Sugerido

### Fase 1 — Estabilidad y UX básica _(Sprint 1 — ~1 semana)_

Objetivo: hacer la app robusta ante errores y mejorar la experiencia durante la evaluación.

| # | Mejora | Tipo | Esfuerzo |
|---|---|---|---|
| 1 | Capa `withRetry` + exponential backoff en las 3 llamadas | Técnico | S |
| 2 | Validadores post-parse (`assertCriteriaArray`, `assertCandidateRanking`) | Técnico | S |
| 3 | `ErrorBanner` en UI — eliminar todos los `alert()` | Técnico | S |
| 4 | Progreso en tiempo real durante evaluación de CVs (P1) | Funcional | M |
| 5 | Exportar CSV (P2) | Funcional | S |

**Entregable:** app que no rompe silenciosamente, con feedback visual durante el proceso.

---

### Fase 2 — Refactoring y control del usuario _(Sprint 2-3 — ~2 semanas)_

Objetivo: arquitectura mantenible y capacidad de corrección post-IA.

| # | Mejora | Tipo | Esfuerzo |
|---|---|---|---|
| 6 | Extraer `useCriteria`, `useCandidates`, `useEvaluation` | Refactoring | M |
| 7 | Crear componentes `JDStep`, `CriteriaStep`, `CVsStep`, `ResultsStep` | Refactoring | M |
| 8 | Ajuste manual de scores post-IA (P3) | Funcional | M |
| 9 | Prompts mejorados + schemas enriquecidos para las 3 llamadas | Técnico | S |
| 10 | `ErrorBanner` con botón "Reintentar" que re-ejecuta solo los CVs fallidos | UX | S |

**Entregable:** App.tsx < 60 líneas, componentes testables individualmente, scores ajustables.

---

### Fase 3 — Persistencia y capacidades avanzadas _(Sprint 4-5 — ~2-3 semanas)_

Objetivo: flujo de trabajo completo para reclutadores profesionales.

| # | Mejora | Tipo | Esfuerzo |
|---|---|---|---|
| 11 | Historial con localStorage + panel de sesiones (P4) | Funcional | M |
| 12 | Carga de CVs desde archivos .txt/.pdf (P5) | Funcional | L |
| 13 | `criteria_scores` por criterio visible en `CandidateCard` (trazabilidad) | Funcional | S |
| 14 | Exportar sesión completa a JSON (backup/restore) | Funcional | S |
| 15 | Tests unitarios para validators.ts y hooks | Calidad | M |

**Entregable:** producto completo para uso profesional diario, con historial y soporte de archivos.

---

*Generado el 2026-05-09. Revisar prioridades con el equipo antes de iniciar Fase 2.*
