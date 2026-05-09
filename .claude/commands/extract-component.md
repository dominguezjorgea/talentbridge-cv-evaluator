# extract-component

Extrae un componente inline de `App.tsx` a su propio archivo.

**Uso:** `/extract-component [NombreDelComponente]`
Ejemplo: `/extract-component CandidateCard`

**Pasos que Claude debe seguir:**
1. Localiza `NombreDelComponente` dentro de `frontend/src/App.tsx`.
2. Determina qué props recibe (inferidas de su uso actual).
3. Crea `frontend/src/components/[NombreDelComponente].tsx` con:
   - Interface `[NombreDelComponente]Props` explícita
   - Componente funcional tipado: `const X: React.FC<XProps> = (props) => ...`
   - Export named y default
4. Reemplaza la definición inline en `App.tsx` con el import correspondiente.
5. Corre `cd frontend && npm run lint` — cero errores antes de terminar.
6. Verifica que `App.tsx` tiene menos líneas que antes (confirma con `wc -l`).

**Reglas aplicables:** R-TYPES, R-STATE
