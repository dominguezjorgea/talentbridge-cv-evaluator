# add-criterion

Agrega un nuevo campo al schema de evaluación de candidatos.

**Uso:** `/add-criterion [nombre-del-campo]`
Ejemplo: `/add-criterion cultural_fit`

**Pasos que Claude debe seguir:**
1. Agrega el campo a la interfaz `Criterion` en `frontend/src/types.ts`.
2. Actualiza el `responseSchema` en `backend/src/routes/evaluate.ts` para incluir el nuevo campo con su tipo.
3. Actualiza el system prompt de `extractCriteria` para que Gemini genere el nuevo campo.
4. Si el campo afecta el ranking, actualiza también el schema de `CandidateRanking`.
5. Actualiza el componente de UI que muestra el criterio (`CriteriaStep` o `CandidateCard`).
6. Corre lint en frontend y backend. Corrige todos los errores de TypeScript.
7. Muestra un diff resumido de los archivos modificados.

**Reglas aplicables:** R-TYPES, R-GEMINI
