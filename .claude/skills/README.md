# TalentBridge — Skills de Desarrollo

Patrones de prompt reutilizables para acelerar el desarrollo asistido por IA en este proyecto.

---

## Skill: Nuevo endpoint con Gemini

Patrón base cuando necesitas un endpoint que llame a Gemini con structured output.

```typescript
// 1. Importa y crea la instancia
import { GoogleGenAI, Type } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';

// 2. Define el responseSchema antes del prompt
const schema = {
  type: Type.OBJECT,
  properties: {
    field: { type: Type.STRING },
  },
  required: ['field'],
};

// 3. Llama con withRetry (cuando esté implementado)
const response = await ai.models.generateContent({
  model: MODEL,
  contents: prompt,
  config: { responseMimeType: 'application/json', responseSchema: schema },
});

// 4. Valida antes de retornar
const data = JSON.parse(response.text ?? '{}');
// assertMyType(data); ← validator post-parse
```

**Trigger:** Cuando el prompt menciona "nuevo endpoint Gemini", "llamada al modelo", o "structured output".

---

## Skill: Extraer custom hook de App.tsx

Secuencia para extraer estado y lógica de `App.tsx` a un custom hook.

1. Identifica el estado relacionado: `const [x, setX] = useState(...)` + las funciones que lo usan.
2. Crea `frontend/src/hooks/useX.ts` con el estado y funciones.
3. El hook retorna un objeto plano con todos los valores y setters necesarios.
4. En `App.tsx`: reemplaza el bloque extraído con `const { x, setX, ... } = useX()`.
5. Corre `npm run lint` en frontend — 0 errores antes de continuar.

**Trigger:** Cuando el prompt menciona "extraer hook", "custom hook", o "separar lógica de App.tsx".

---

## Skill: Validar input de endpoint Express

Template para validar el body de un endpoint antes de procesarlo.

```typescript
router.post('/ruta', async (req: Request, res: Response) => {
  const { campo } = req.body as { campo: string };

  // Validación temprana — siempre al inicio
  if (!campo || campo.trim().length === 0) {
    res.status(400).json({ error: 'El campo es requerido.' });
    return;
  }

  // Lógica principal...
  try {
    const result = await processLogic(campo);
    res.json(result);
  } catch (error) {
    console.error('[ruta Error]', error);
    res.status(500).json({ error: 'Error al procesar. Intenta de nuevo.' });
  }
});
```

**Trigger:** Cuando el prompt menciona "nuevo endpoint", "validar input", o "route handler".

---

## Skill: Verificar seguridad antes de commit

Checklist rápido antes de `git commit`:

```bash
grep -r "GEMINI_API_KEY" frontend/   # debe retornar vacío
grep -r "VITE_GEMINI" . --include="*.ts" --include="*.tsx"  # debe retornar vacío
git ls-files backend/.env            # debe retornar vacío
npm run lint                         # debe pasar sin errores
```

**Trigger:** Antes de cualquier commit que toque `backend/`, `frontend/`, o archivos de configuración.
