# Roadmap — Sistema Hotelero Llavero

## Leyenda
- ✅ Completado
- 🚧 En progreso
- 📋 Pendiente
- ❌ Descartado

---

## Sprint 1 — Operación diaria (en curso)

### 1. Estado "reservado" + check-in desde reserva web ✅
**Por qué:** Las habitaciones con reserva confirmada no tienen estado visual en el panel. El cajero no puede hacer check-in desde la reserva, tiene que reingresar todo manualmente en el POS.

**Alcance:**
- [x] Agregar estado `reservado` al enum `EstadoHabitacion`
- [x] Scheduler que marca habitaciones como `reservado` cuando llega el día de check-in (00:05 daily)
- [x] Botón "Check-in" en pantalla de Reservas → marca habitación `ocupado`, reserva `completada`
- [x] Badge visual `reservado` en dashboard y gestión de habitaciones (filtro + dot azul)

**Estado:** ✅ Completado (2026-05-27)

---

### 2. Estadísticas de ocupación ✅
**Por qué:** El dueño no tiene visibilidad histórica. Sin datos no puede decidir precios ni marketing.

**Alcance:**
- [x] Tasa de ocupación por mes (noches vendidas / habitaciones × días del mes)
- [x] Ingresos por tipo de habitación (últimos 6 meses)
- [x] Días de la semana con más ocupación
- [x] Comparativo mes actual vs mes anterior con variación %

**Estado:** ✅ Completado (2026-05-27) — nueva página `/estadisticas` en menú admin

---

### 3. Tarifas por temporada / fecha
**Por qué:** La Serena tiene temporada alta (enero-febrero, Fiestas Patrias). Precios fijos dejan plata sobre la mesa.

**Alcance:**
- [x] Entidad `TarifaTemporada` (tipo_id, fecha_desde, fecha_hasta, precio, label)
- [x] CRUD en admin (pantalla de Tipos de habitación — sección expandible por tipo)
- [x] Lógica en reservas web: banner dorado con precio vigente al seleccionar fechas; total calculado con precio de temporada
- [x] Lógica en POS: banner amarillo cuando la tarifa de temporada aplica hoy al seleccionar habitación

**Estado:** ✅ Completado (2026-05-27)

---

### 4. Lista de aseo / housekeeping
**Por qué:** No hay flujo para la persona de limpieza. Hoy el jefe le avisa por WhatsApp qué habitaciones limpiar.

**Alcance:**
- [x] Vista `/aseo` con habitaciones en estado `aseo` ordenadas por urgencia (más tiempo = más urgente, badge amarillo si >1h)
- [x] Acceso sin rol jefe — PIN de 4 dígitos (`app.pin.aseo`, default 1441) almacenado en sessionStorage
- [x] Botón "✓ Limpia" por habitación → cambia estado a `libre`, log "Aseo" como operador
- [x] Historial del día: listado de habitaciones completadas con hora

**Estado:** ✅ Completado (2026-05-27) — URL `/llavero/aseo`, polling cada 30s

---

## Backlog (próximos sprints)

| # | Mejora | Impacto | Esfuerzo |
|---|--------|---------|----------|
| 5 | Confirmación de depósito en reservas | Alto | Bajo |
| 6 | Estacionamientos configurables | Medio | Bajo |
| 7 | Notas internas por habitación | Medio | Bajo |
| 8 | Búsqueda de huéspedes con historial | Medio | Medio |
| 9 | Productos frecuentes en minimarket | Medio | Bajo |
| 10 | Alertas de bajo stock en dashboard | Alto | Bajo |
| 11 | Multi-idioma (español/inglés) portal público | Medio | Alto |
| 12 | Integración SII real (SimpleFactura API) | Alto | Alto |
| 13 | WhatsApp directo en portal público | Bajo | Bajo |
| 14 | Motor de reseñas post-checkout | Alto | Medio |

---

## Historial de cambios

### 2026-05-27
- Proyecto iniciado con base funcional: POS, reservas web, portal público, arqueo de turno, DTE offline
- Seguridad: credenciales SMTP purgadas del historial git, rotadas
- Reservas sin registro: huéspedes pueden reservar sin crear cuenta
- Email de confirmación con datos de transferencia bancaria
- Fotos reales del hostal cargadas (20 fotos, 15 habitaciones)
- DataInitializer simplificado: solo crea `admin` y `cajero` con PINs por defecto
- CRUD de tipos de habitación desde el admin
- Habitaciones ordenadas numéricamente (fix VARCHAR sort)
