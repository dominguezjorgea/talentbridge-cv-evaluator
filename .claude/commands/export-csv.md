# export-csv

Implementa o actualiza la funcionalidad de exportar rankings a CSV.

**Uso:** `/export-csv`

**Pasos que Claude debe seguir:**
1. Crea (o actualiza) `frontend/src/utils/exportCsv.ts`:
   - Función `exportRankingsToCSV(rankings: CandidateRanking[], jobTitle?: string): void`
   - Columnas: Rank, Nombre, Score, Recomendación, Fortalezas (joined con ` | `), Brechas, Red Flags
   - Usa `Blob` + `URL.createObjectURL` para descarga sin dependencias externas
   - BOM UTF-8 (`﻿`) al inicio para compatibilidad con Excel
   - Nombre del archivo: `talentbridge-ranking-${new Date().toISOString().slice(0,10)}.csv`
2. En `frontend/src/App.tsx` (o `ResultsStep` si ya fue extraído):
   - Importa `exportRankingsToCSV`
   - Agrega botón "Exportar CSV" junto al botón "Nueva Evaluación"
   - Solo visible cuando `rankings.length > 0`
3. Corre `cd frontend && npm run lint` — 0 errores.

**Reglas aplicables:** R-STATE, R-TYPES
