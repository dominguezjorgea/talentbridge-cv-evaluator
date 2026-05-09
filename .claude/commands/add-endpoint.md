# add-endpoint

Scaffolding de un nuevo endpoint Express en `backend/src/routes/`.

**Uso:** `/add-endpoint [nombre] [método] [ruta]`
Ejemplo: `/add-endpoint history GET /api/history`

**Pasos que Claude debe seguir:**
1. Crea `backend/src/routes/$NOMBRE.ts` con:
   - Import de express `Router`
   - Validaciones de input (400 con mensaje en español si falla)
   - `try/catch` con `console.error` en catch y `{ error: string }` al cliente
   - Export del router
2. Registra el router en `backend/src/index.ts`:
   `import $NOMBRERouter from './routes/$NOMBRE.js'; app.use('/api', $NOMBRERouter);`
3. Si el endpoint interactúa con Gemini, usa `withRetry()` y `responseSchema`.
4. Corre `cd backend && npm run lint` y corrige errores de TypeScript.
5. Muestra el shape de request/response esperado como comentario en el archivo.

**Reglas aplicables:** R-API, R-GEMINI, R-TYPES, R-GIT
