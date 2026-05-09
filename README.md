# TalentBridge CV Evaluator

Evaluador técnico de CVs asistido por IA. Analiza candidatos contra una Job Description usando Google Gemini, con arquitectura segura frontend/backend.

## Estructura del proyecto

```
talentbridge-cv-evaluator/
├── frontend/          # React 19 + Vite (puerto 5173)
│   ├── src/
│   │   ├── App.tsx           # Wizard de 4 pasos
│   │   ├── services/
│   │   │   └── apiService.ts # Llamadas al backend
│   │   └── types.ts
│   ├── vite.config.ts        # Proxy /api → backend:3001
│   └── package.json
├── backend/           # Express + TypeScript (puerto 3001)
│   ├── src/
│   │   ├── index.ts
│   │   └── routes/
│   │       └── evaluate.ts   # 3 endpoints de evaluación
│   ├── .env                  # GEMINI_API_KEY (no commitear)
│   └── package.json
├── docs/              # Análisis técnico y propuestas de mejora
└── package.json       # Scripts raíz con concurrently
```

## Requisitos

- Node.js 18+
- Una API key de Google Gemini — obtener en [Google AI Studio](https://aistudio.google.com)

## Instalación

```bash
# 1. Instalar dependencias de los 3 paquetes
npm run install:all

# 2. Configurar la API key del backend
cp backend/.env.example backend/.env
# Edita backend/.env y rellena: GEMINI_API_KEY=tu_api_key_aquí
```

## Desarrollo

```bash
npm run dev
```

Arranca frontend en `http://localhost:5173` y backend en `http://localhost:3001` simultáneamente.

## Build de producción

```bash
npm run build
# Genera frontend/dist/ — sirve con cualquier CDN o servidor estático
# El backend se despliega por separado (Cloud Run, Railway, Render, etc.)
```

## API del backend

| Endpoint | Body | Descripción |
|---|---|---|
| `GET /api/health` | — | Estado del servidor |
| `POST /api/extract-criteria` | `{ jobDescription }` | Extrae criterios de evaluación de la JD |
| `POST /api/evaluate-candidates` | `{ jobDescription, criteria, cvs }` | Evalúa CVs contra criterios |
| `POST /api/generate-summary` | `{ rankings, criteria }` | Genera resumen ejecutivo del lote |

## Flujo de la aplicación

1. **JD** — Pega la Job Description → el backend extrae criterios con Gemini
2. **Criterios** — Revisa y ajusta los pesos (deben sumar 100%)
3. **CVs** — Pega los CVs separados por `---` → el backend evalúa cada uno
4. **Resultados** — Ranking de candidatos con scores, evidencias y recomendaciones

## Seguridad

La `GEMINI_API_KEY` vive únicamente en `backend/.env` y nunca se expone al cliente. El frontend se comunica con el backend a través de `/api/*`, que Vite proxea en desarrollo y debe enrutar en producción.

## Documentación técnica

Ver [`docs/`](./docs/) para análisis técnico completo, propuestas de mejora y roadmap.
