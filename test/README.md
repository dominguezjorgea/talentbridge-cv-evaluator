# Suite de Pruebas E2E — TalentBridge CV Evaluator

Tests automatizados con Playwright que validan el flujo end-to-end del evaluador.

## Prerequisitos

1. **Stack corriendo:**
   ```bash
   npm run dev   # desde la raíz del proyecto
   ```

2. **API key configurada:**
   ```bash
   # backend/.env debe contener:
   GEMINI_API_KEY=tu_api_key_aquí
   ```

3. **Playwright instalado:**
   ```bash
   npm install          # instala @playwright/test
   npx playwright install chromium
   ```

## Ejecución

```bash
# Todos los tests (headless)
npm run test:e2e

# Con browser visible
npm run test:e2e:headed

# Un test específico
npx playwright test --grep "TC-001"

# Ver reporte HTML después de correr
npm run test:e2e:report
```

## Estructura

```
test/
├── data/              ← archivos de texto plano con JD y 5 CVs
├── e2e/
│   └── evaluacion.spec.ts   ← suite automatizada (TC-001, 002, 004, 009)
├── plan/
│   └── TEST-PLAN.md   ← 10 casos de prueba documentados
└── screenshots/       ← capturas generadas por los tests (creada automáticamente)
```

## Tests automatizados

| ID | Descripción | Gemini | Duración aprox. |
|----|-------------|--------|-----------------|
| TC-001 | Happy path completo — 5 CVs + ranking | Sí | ~5-8 min |
| TC-002 | JD corta rechazada antes de llamar a la API | No | ~5 seg |
| TC-004 | Pesos que no suman 100% bloquean avance | Solo extracción | ~1 min |
| TC-009 | Reset desde RESULTS vuelve al Step JD | Sí (reutiliza) | ~5-8 min |

## Screenshots generados

- `test/screenshots/happy-path-results.png` — RESULTS con los 5 candidatos rankeados
- `test/screenshots/reset-verificado.png` — Step JD vacío tras el reset

## Nota sobre tiempos

Cada llamada a la API de Gemini puede tardar entre 15 y 90 segundos según la carga.
El timeout por test es de **3 minutos**. Si ves errores de timeout, verifica que
la API key es válida y que el backend responde en `http://localhost:3001/api/health`.
