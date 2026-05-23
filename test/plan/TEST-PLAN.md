# Test Plan: TalentBridge CV Evaluator
Versión: 1.0 | Fecha: 2026-05-23 | Autor: QA Engineering

---

## 1. Alcance

**En scope:**
- Flujo end-to-end: JD → CRITERIA → CVS → RESULTS
- Validaciones de entrada (JD corta, pesos incorrectos)
- Comportamiento de la UI bajo condiciones de error
- Funcionalidad de reset/reinicio

**Fuera de scope:**
- Tests unitarios de componentes React
- Tests de la API backend en aislamiento
- Tests de performance / carga
- Tests en múltiples navegadores (solo Chromium)
- Tests de accesibilidad (WCAG)

**Ambiente:**
- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:3001 (Express + Gemini API)
- Prerequisito: `GEMINI_API_KEY` válida en `backend/.env`

---

## 2. Casos de Prueba

| ID | Descripción | Precondición | Pasos | Resultado Esperado | Resultado Real | Estado |
|----|-------------|--------------|-------|-------------------|----------------|--------|
| TC-001 | Flujo completo happy path con 5 CVs | Stack corriendo, API key válida | 1. Ir a / 2. Pegar JD completa 3. Click "Continuar a Análisis de Perfil" 4. Esperar criterios 5. Click "Continuar a Evaluación" 6. Pegar 5 CVs separados por --- 7. Click "Iniciar Triage Experto" 8. Esperar resultados | 5 candidatos rankeados, Laura Martínez en #1 con recomendación AVANZAR | — | Pendiente |
| TC-002 | JD de menos de 10 palabras | App en paso JD | 1. Escribir "Hola mundo necesito un programador" 2. Click continuar | Error visible / alert. No avanza a CRITERIA | — | Pendiente |
| TC-003 | CVs separados por --- | App en paso CVS | Pegar 5 CVs con separador --- entre cada uno | El sistema detecta 5 candidatos distintos | — | Manual |
| TC-004 | Pesos que no suman 100% | App en paso CRITERIA | Modificar peso a 99 → intentar continuar | Botón deshabilitado o mensaje de error | — | Pendiente |
| TC-005 | Evaluación y ranking de 5 CVs | TC-001 completado | Ver pantalla RESULTS | Exactamente 5 candidatos en orden de score desc | — | Pendiente |
| TC-006 | Near-ties (diff score ≤ 0.5) | TC-001 completado | Revisar RESULTS por alerta de near-tie | Si hay candidatos con diff ≤ 0.5, aparece indicador visual | — | Manual |
| TC-007 | Backend no disponible | Backend detenido | Cargar la app | Banner o mensaje indicando servidor no disponible | — | Manual |
| TC-008 | Banner verde de servidor conectado | Backend corriendo | Cargar la app | No aparece error de conexión / banner verde visible | — | Manual |
| TC-009 | Reset desde RESULTS | TC-001 completado | Click "Nueva Evaluación de Puesto" | Vuelve al Step JD con textarea vacío | — | Pendiente |
| TC-010 | Ordenamiento correcto del ranking | TC-001 completado | Ver lista de candidatos | Candidato con mayor score aparece primero | — | Pendiente |

---

## 3. Criterios de Aceptación

- `cv-01-ideal.txt` (Laura Martínez) debe recibir recomendación **AVANZAR** (score ≥ 8.0)
- `cv-04-debil.txt` (Pedro Gómez) y `cv-05-descartable.txt` (Roberto Sánchez) deben recibir **RECHAZAR** (score < 6.0)
- Laura Martínez debe aparecer en posición #1 del ranking
- Los pesos deben sumar exactamente 100% antes de poder avanzar al paso CVS
- El reset debe limpiar completamente el estado de la app

---

## 4. Ambiente de Prueba

```bash
# Iniciar stack completo
npm run dev

# En otra terminal: ejecutar tests
npm run test:e2e

# Ver reporte HTML
npm run test:e2e:report
```

**Tiempo estimado de ejecución:** 8–15 minutos (depende de latencia de Gemini)
