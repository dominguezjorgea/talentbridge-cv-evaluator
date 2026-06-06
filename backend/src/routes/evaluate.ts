import { Router, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const router = Router();

// Tipos inline (copia de frontend/src/types.ts)
interface Criterion {
  name: string;
  weight: number;
  observable_signs: string;
  degradation_signs: string;
}

interface CandidateRanking {
  rank?: number;
  name: string;
  email?: string;
  score: number;
  recommendation: 'AVANZAR' | 'CONSIDERAR' | 'RECHAZAR';
  evidence: string[];
  strengths: string[];
  gaps: string[];
  red_flags: string[];
  experience_years?: number;
  skills?: string[];
  score_breakdown?: { skills_match: number; experience: number; education: number };
  evaluated_at?: string;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';

// Helper: instancia de Gemini
function getAI(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada en el servidor');
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// POST /api/extract-criteria
router.post('/extract-criteria', async (req: Request, res: Response) => {
  try {
    const { jobDescription } = req.body as { jobDescription: string };
    if (!jobDescription || jobDescription.trim().split(/\s+/).length < 10) {
      res.status(400).json({ error: 'Descripción de cargo muy corta. Incluye al menos 10 palabras.' });
      return;
    }

    const ai = getAI();
    const prompt = `
Como experto Headhunter Técnico B2B de TalentBridge, analiza la siguiente Job Description (JD) y extrae los criterios clave de evaluación.
Divide los criterios en técnicos (hard) y blandos (soft).
Para cada criterio define:
1. Nombre.
2. Peso (en porcentaje, la suma total debe ser 100%).
3. Signos observables (qué buscar en el CV para dar puntaje).
4. Signos de degradación (qué indica que el candidato no cumple o tiene fatiga en ese criterio).

JD:
${jobDescription}
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              weight: { type: Type.NUMBER },
              observable_signs: { type: Type.STRING },
              degradation_signs: { type: Type.STRING },
            },
            required: ['name', 'weight', 'observable_signs', 'degradation_signs'],
          },
        },
      },
    });

    const criteria = JSON.parse(response.text ?? '[]') as Criterion[];
    res.json(criteria);
  } catch (error) {
    console.error('[extract-criteria Error]', error);
    res.status(500).json({ error: 'Error al extraer criterios. Intenta de nuevo.' });
  }
});

// POST /api/evaluate-candidates
router.post('/evaluate-candidates', async (req: Request, res: Response) => {
  try {
    const { jobDescription, criteria, cvs } = req.body as {
      jobDescription: string;
      criteria: Criterion[];
      cvs: Array<{ filename: string; content: string }>;
    };

    if (!cvs || cvs.length === 0) {
      res.status(400).json({ error: 'Debes proporcionar al menos un CV para evaluar.' });
      return;
    }
    if (cvs.length > 20) {
      res.status(400).json({ error: 'Cantidad de CVs fuera de rango. Máximo 20 CVs por evaluación.' });
      return;
    }
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'Servidor mal configurado — contacta al administrador.' });
      return;
    }

    const ai = getAI();
    const rankings: CandidateRanking[] = [];

    for (const cv of cvs) {
      const prompt = `
Evalúa al siguiente candidato contra los criterios establecidos para esta posición.

CRITERIOS Y PESOS:
${JSON.stringify(criteria, null, 2)}

JOB DESCRIPTION:
${jobDescription}

CV DEL CANDIDATO:
${cv.content}

REGLAS:
- Score de 0 a 10.
- Sé crítico y objetivo.
- Cita evidencia REAL del CV para cada conclusión.
- Identifica Red Flags (⚠️).
- Recomendación: 'AVANZAR' (8.0+), 'CONSIDERAR' (6.0-7.9), 'RECHAZAR' (<6.0).
- Extrae el email del candidato si aparece en el CV (si no hay, omítelo).
- Estima los años de experiencia relevante como número entero.
- Lista las skills técnicas principales como array (máximo 8).
- Desglosa el score en 3 dimensiones de 0 a 10 cada una: skills_match, experience, education.
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              score: { type: Type.NUMBER },
              recommendation: { type: Type.STRING, enum: ['AVANZAR', 'CONSIDERAR', 'RECHAZAR'] },
              evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
              red_flags: { type: Type.ARRAY, items: { type: Type.STRING } },
              email: { type: Type.STRING },
              experience_years: { type: Type.NUMBER },
              skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              score_breakdown: {
                type: Type.OBJECT,
                properties: {
                  skills_match: { type: Type.NUMBER },
                  experience: { type: Type.NUMBER },
                  education: { type: Type.NUMBER },
                },
                required: ['skills_match', 'experience', 'education'],
              },
            },
            required: ['name', 'score', 'recommendation', 'evidence', 'strengths', 'gaps', 'red_flags'],
          },
        },
      });

      const ranking = JSON.parse(response.text ?? '{}') as CandidateRanking;
      rankings.push(ranking);
    }

    res.json(rankings);
  } catch (error) {
    console.error('[evaluate-candidates Error]', error);
    res.status(500).json({ error: 'Error al evaluar candidatos. Intenta de nuevo.' });
  }
});

// POST /api/generate-summary
router.post('/generate-summary', async (req: Request, res: Response) => {
  try {
    const { rankings, criteria } = req.body as {
      rankings: CandidateRanking[];
      criteria: Criterion[];
    };

    const ai = getAI();
    const prompt = `
Analiza estos resultados de triage de candidatos y genera un resumen ejecutivo.

RANKINGS:
${JSON.stringify(rankings, null, 2)}

CRITERIOS MÁS IMPORTANTES (por peso):
${criteria.sort((a, b) => b.weight - a.weight).slice(0, 3).map(c => c.name).join(', ')}

¿Cuál fue el diferenciador clave en este lote?
¿Quiénes son los top 3?
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            top_3: { type: Type.ARRAY, items: { type: Type.STRING } },
            consider: { type: Type.ARRAY, items: { type: Type.STRING } },
            key_differentiator: { type: Type.STRING },
          },
          required: ['top_3', 'consider', 'key_differentiator'],
        },
      },
    });

    const summary = JSON.parse(response.text ?? '{}');
    res.json(summary);
  } catch (error) {
    console.error('[generate-summary Error]', error);
    res.status(500).json({ error: 'Error al generar resumen. Intenta de nuevo.' });
  }
});

export default router;
