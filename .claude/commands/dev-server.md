# dev-server

Sube o baja el stack completo de desarrollo (frontend + backend).

**Uso:**
- `/dev-server up`     — inicia frontend y backend
- `/dev-server down`   — mata ambos procesos
- `/dev-server status` — muestra si los procesos están corriendo

---

## Acción: UP

Cuando el argumento sea `up` (o no haya argumento), Claude ejecuta estos pasos:

1. Verifica si ya hay procesos corriendo:
   ```bash
   cat /tmp/talentbridge-pids.txt 2>/dev/null
   ```
   Si el archivo existe y tiene contenido, avisa al usuario:
   "⚠️ El stack ya está corriendo (PIDs: [contenido]). Usa /dev-server down primero."
   y detente aquí.

2. Inicia el backend en background desde la raíz del proyecto:
   ```bash
   npm run dev:backend > /tmp/talentbridge-backend.log 2>&1 &
   echo $! > /tmp/talentbridge-pids.txt
   ```

3. Espera 3 segundos. Verifica que el backend responde:
   ```bash
   curl -s --max-time 3 http://localhost:3001/api/health
   ```
   - Si responde `{"status":"ok"...}` → ✅ Backend listo
   - Si falla → muestra las últimas 20 líneas del log:
     `tail -20 /tmp/talentbridge-backend.log`
     y detente aquí (no inicies el frontend con el backend caído).

4. Inicia el frontend en background:
   ```bash
   npm run dev:frontend > /tmp/talentbridge-frontend.log 2>&1 &
   echo $! >> /tmp/talentbridge-pids.txt
   ```

5. Espera 5 segundos. Verifica que el frontend responde:
   ```bash
   curl -s --max-time 5 -o /dev/null -w "%{http_code}" http://localhost:5173
   ```
   - Si retorna `200` → ✅ Frontend listo
   - Si falla → muestra las últimas 20 líneas:
     `tail -20 /tmp/talentbridge-frontend.log`

6. Muestra el reporte final:
   ```
   ✅ Stack TalentBridge corriendo
      Backend  → http://localhost:3001/api/health
      Frontend → http://localhost:5173
      PIDs     → [pids guardados]
      Logs     → /tmp/talentbridge-backend.log / /tmp/talentbridge-frontend.log
   ```

---

## Acción: DOWN

Cuando el argumento sea `down`, Claude ejecuta estos pasos:

1. Lee los PIDs guardados:
   ```bash
   cat /tmp/talentbridge-pids.txt 2>/dev/null
   ```
   Si el archivo no existe o está vacío:
   "ℹ️ No hay procesos registrados en /tmp/talentbridge-pids.txt."
   y detente aquí.

2. Mata los procesos registrados:
   ```bash
   while IFS= read -r pid; do
     kill "$pid" 2>/dev/null && echo "✅ PID $pid terminado" || echo "⚠️ PID $pid no encontrado"
   done < /tmp/talentbridge-pids.txt
   ```

3. Elimina el archivo de PIDs:
   ```bash
   rm -f /tmp/talentbridge-pids.txt
   ```

4. Confirma:
   ```
   🛑 Stack TalentBridge detenido.
   ```

---

## Acción: STATUS

Cuando el argumento sea `status`, Claude ejecuta estos pasos:

1. Verifica el backend:
   ```bash
   curl -s --max-time 2 http://localhost:3001/api/health
   ```
   - Respuesta con `{"status":"ok"}` → ✅ Backend corriendo en :3001
   - Sin respuesta → ❌ Backend no disponible

2. Verifica el frontend:
   ```bash
   curl -s --max-time 2 -o /dev/null -w "%{http_code}" http://localhost:5173
   ```
   - Código `200` → ✅ Frontend corriendo en :5173
   - Otro código o sin respuesta → ❌ Frontend no disponible

3. Muestra los PIDs registrados si existen:
   ```bash
   cat /tmp/talentbridge-pids.txt 2>/dev/null || echo "(sin PIDs registrados)"
   ```

4. Reporte final:
   ```
   Backend  [:3001] → ✅/❌
   Frontend [:5173] → ✅/❌
   PIDs registrados → [contenido o "ninguno"]
   ```
