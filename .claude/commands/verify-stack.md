# verify-stack

Verifica que el stack completo (frontend + backend) arranca y se comunica correctamente.

**Uso:** `/verify-stack`

**Pasos que Claude debe ejecutar:**
1. `cd backend && npm run lint` → 0 errores de TypeScript.
2. `cd frontend && npm run lint` → 0 errores de TypeScript.
3. Inicia backend en background: `npm run dev:backend &` — espera 3 segundos.
4. Verifica health: `curl -s http://localhost:3001/api/health`
   → espera: `{"status":"ok","version":"1.0"}`
5. Inicia frontend en background: `npm run dev:frontend &` — espera 5 segundos.
6. Verifica proxy: `curl -s http://localhost:5173/api/health`
   → espera: mismo JSON (proxied por Vite hacia backend)
7. Mata ambos procesos.
8. Reporta: ✅ stack OK / ❌ [servicio] falló con [error].
