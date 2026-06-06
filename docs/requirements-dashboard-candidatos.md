# Requirements — Dashboard de Candidatos con Score
**Proyecto:** TalentBridge Colombia  
**Feature:** Dashboard de gestión de candidatos evaluados  
**Versión:** 1.0 · Sesión 6 — Taller Integrador

---

## Contexto y Problema

Los reclutadores de TalentBridge reciben entre 150 y 300 CVs por posición abierta. Hoy, el evaluador de CVs ya genera un score de compatibilidad por candidato, pero no existe una vista unificada que permita comparar candidatos, filtrar por criterios y armar un shortlist de manera eficiente.

El resultado: los reclutadores exportan datos manualmente, arman tablas en Excel y pierden entre 2 y 4 horas por proceso de selección revisando información que ya está calculada.

---

## Objetivo del Feature

Proveer una interfaz de dashboard que permita al reclutador:
- Ver todos los candidatos evaluados para una posición en una sola pantalla
- Comparar scores de compatibilidad side-by-side
- Filtrar y ordenar por múltiples criterios
- Agregar notas internas por candidato
- Exportar el shortlist filtrado a CSV

**Métrica de éxito:** Reducir el tiempo de armado de shortlist de 2–4 horas a menos de 15 minutos.

---

## Usuarios

| Usuario | Descripción | Frecuencia de uso |
|---------|-------------|-------------------|
| Reclutador Senior | Gestiona 3–5 posiciones abiertas simultáneamente | Diaria |
| Gerente de Talento | Revisa el shortlist final antes de avanzar candidatos | Semanal |

---

## User Stories

### US-01 · Vista de tabla de candidatos

**Como** reclutador,  
**quiero** ver una tabla con todos los candidatos evaluados para una posición,  
**para** tener visibilidad completa del pool de candidatos en un solo lugar.

**Criterios de Aceptación:**

- **Dado** que hay candidatos evaluados para una posición,  
  **cuando** accedo al dashboard de esa posición,  
  **entonces** veo una tabla con columnas: Nombre, Posición, Score (%), Experiencia (años), Skills match, Fecha evaluación, Estado.

- **Dado** que estoy en el dashboard,  
  **cuando** la lista tiene más de 20 candidatos,  
  **entonces** la tabla tiene paginación de 20 registros por página.

- **Dado** que no hay candidatos evaluados para una posición,  
  **cuando** accedo al dashboard,  
  **entonces** veo un mensaje vacío con CTA para iniciar una evaluación.

---

### US-02 · Filtros y ordenamiento

**Como** reclutador,  
**quiero** filtrar y ordenar la lista de candidatos por múltiples criterios,  
**para** encontrar rápidamente los candidatos más relevantes sin revisar toda la lista.

**Criterios de Aceptación:**

- **Dado** que estoy en el dashboard,  
  **cuando** aplico un filtro por score mínimo (ej: ≥ 70%),  
  **entonces** la tabla muestra solo los candidatos que cumplen ese umbral y el contador de resultados se actualiza.

- **Dado** que estoy en el dashboard,  
  **cuando** hago clic en el header de una columna,  
  **entonces** la tabla se ordena por esa columna (ascendente/descendente de forma alternada).

- **Dado** que apliqué uno o más filtros,  
  **cuando** hago clic en "Limpiar filtros",  
  **entonces** todos los filtros se resetean y veo la lista completa nuevamente.

- Los filtros disponibles son: Score mínimo (slider 0–100%), Experiencia mínima (años), Skills (multiselect), Estado (Pendiente / En proceso / Descartado / Shortlisted).

---

### US-03 · Score visual por candidato

**Como** reclutador,  
**quiero** ver el score de compatibilidad de forma visual y clara,  
**para** comparar candidatos de un vistazo sin leer números.

**Criterios de Aceptación:**

- **Dado** que estoy en la tabla,  
  **cuando** veo la columna de score,  
  **entonces** el score se muestra como un badge de color:  
  - Verde (≥ 80%): candidato recomendado  
  - Amarillo (60–79%): candidato a revisar  
  - Rojo (< 60%): candidato no recomendado

- **Dado** que hago hover sobre el badge de score,  
  **cuando** el tooltip aparece,  
  **entonces** veo el desglose del score: Skills match (X%), Experiencia (X%), Formación (X%).

---

### US-04 · Notas del reclutador

**Como** reclutador,  
**quiero** agregar notas internas a cada candidato,  
**para** registrar impresiones y contexto que no está en el CV evaluado.

**Criterios de Aceptación:**

- **Dado** que estoy en la tabla,  
  **cuando** hago clic en el ícono de nota de un candidato,  
  **entonces** se abre un panel lateral (drawer) con un textarea donde puedo escribir notas de hasta 500 caracteres.

- **Dado** que escribí una nota y hago clic en "Guardar",  
  **cuando** cierro y vuelvo a abrir el panel,  
  **entonces** la nota guardada aparece cargada.

- **Dado** que un candidato tiene una nota guardada,  
  **cuando** lo veo en la tabla,  
  **entonces** el ícono de nota tiene un indicador visual (punto azul) que diferencia "tiene nota" de "sin nota".

---

### US-05 · Exportar shortlist a CSV

**Como** reclutador,  
**quiero** exportar la lista filtrada de candidatos a un archivo CSV,  
**para** compartir el shortlist con el gerente de talento por email o subirlo al ATS.

**Criterios de Aceptación:**

- **Dado** que estoy en el dashboard (con o sin filtros aplicados),  
  **cuando** hago clic en "Exportar shortlist",  
  **entonces** se descarga un archivo `shortlist-[posicion]-[fecha].csv` con los candidatos visibles en ese momento.

- El CSV incluye: Nombre completo, Email, Score (%), Posición, Experiencia (años), Skills, Estado, Notas del reclutador.

- **Dado** que la lista está vacía,  
  **cuando** intento exportar,  
  **entonces** el botón de exportar está deshabilitado y hay un tooltip que explica por qué.

---

## Restricciones Técnicas

- Stack frontend: React + TypeScript (consistente con el evaluador de CVs existente)
- Estilo: Tailwind CSS, componentes reutilizables del design system actual
- Estado: React Query para fetching + Zustand para filtros/estado local
- El endpoint de candidatos evaluados ya existe: `GET /api/evaluations?position_id={id}`
- La exportación a CSV debe ser client-side (no server-side) para evitar overhead de infraestructura
- No se requiere autenticación nueva — usa el contexto de sesión existente

---

## Definition of Done

- [ ] Todos los criterios de aceptación de US-01 a US-05 verificados manualmente
- [ ] Tests unitarios para la lógica de filtros y generación del CSV
- [ ] Componentes documentados con comentarios de props
- [ ] No hay regresiones en el evaluador de CVs existente
- [ ] El feature funciona en Chrome, Firefox y Safari (últimas 2 versiones)
- [ ] Issue de GitHub cerrado con commit semántico referenciado
