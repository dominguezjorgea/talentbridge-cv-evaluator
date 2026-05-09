# check-security

Auditoría de seguridad rápida del repositorio.

**Uso:** `/check-security`

**Pasos que Claude debe ejecutar:**
1. `grep -r "GEMINI_API_KEY" frontend/` → debe retornar vacío.
2. `grep -r "VITE_GEMINI" . --include="*.ts" --include="*.tsx"` → debe retornar vacío.
3. `grep -r "process.env" frontend/src/` → reporta cualquier hallazgo como ⚠️.
4. Verifica que `backend/.env` está en `backend/.gitignore`.
5. Verifica que `backend/.env` NO está trackeado: `git ls-files backend/.env`.
6. Si existe `frontend/dist/`: `grep -r "GEMINI_API_KEY" frontend/dist/ 2>/dev/null`
7. Produce un reporte: ✅ sin hallazgos / ⚠️ [lista de problemas con archivo:línea].

**Regla aplicable:** R-SEC
