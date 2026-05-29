# Llavero — Sistema de Gestión Hotelera

Sistema POS completo para hostales y hoteles pequeños, desarrollado con Spring Boot 3 y React 18. Permite gestionar habitaciones, ventas, turnos de caja, inventario, documentos tributarios electrónicos (DTE) y reservas online para el mercado chileno. Pensado para operación remota: el jefe puede monitorear todo desde su casa mientras los cajeros operan en el hostal.

**Sistema interno (staff):** `https://mimaravillahostal.com/llavero`
**Sitio público de reservas:** `https://mimaravillahostal.com/`
**Acceso remoto:** Cloudflare Tunnel (dominio fijo, sin costo adicional).

---

## Tecnologías

| Capa | Stack |
|---|---|
| Backend | Java 17 · Spring Boot 3.2.5 · Spring Security 6 · Spring Data JPA · @EnableAsync · @EnableScheduling |
| Frontend staff | React 18 · Vite 5 · Tailwind CSS (dark mode) · React Router 6 |
| Frontend público | React 18 · Vite 5 · Tailwind CSS (light, estilo hostal) · React Router 6 |
| Base de datos | PostgreSQL 15 |
| Autenticación | JWT (JJWT 0.12.6) — SHA-256 para staff, BCrypt para huéspedes |
| Email | JavaMailSender + Gmail SMTP con App Password |
| PDF | openhtmltopdf (XHTML estricto) |
| Tunneling | Cloudflare Tunnel (dominio fijo en producción) |
| DTE | Cola local + emisión manual en portal SII MiPyme |

---

## Arquitectura general

```
Huéspedes (internet)           Staff / Jefe (internet)
        │                              │
        ▼                              ▼
  mimaravillahostal.com  ←── Cloudflare Tunnel
        │
        ▼
Spring Boot (puerto 8080)
 ├── /              → Sitio público de reservas (React SPA en static/reservas/)
 ├── /llavero/      → Sistema interno staff (React SPA en static/llavero/)
 ├── /uploads/      → Fotos de habitaciones (servidas como archivos estáticos)
 └── /api/*         → REST API (JWT para staff, JWT separado para huéspedes)
        │
        ▼
   PostgreSQL 15
```

Hay dos SPAs independientes servidas por el mismo backend. La SPA pública usa un sistema de autenticación separado (huéspedes registran cuenta con email/contraseña BCrypt y pueden ver y gestionar sus propias reservas).

---

## Funcionalidades

### Autenticación y sesiones (staff)
- Login con **nombre de usuario + PIN de 4 dígitos**. El nombre es el identificador de login (ej: `scruchaga`). No se muestra lista de usuarios para no exponer quién tiene acceso.
- **Formato nombre clave**: primera letra del nombre + apellido, todo minúscula, sin espacios ni caracteres especiales. El admin define el nombre al crear el usuario.
- JWT con expiración de **2 horas**. Al expirar el sistema cierra sesión automáticamente y muestra el mensaje correspondiente.
- **Sesión única por usuario**: el `sessionId` (UUID) se embebe en el JWT y se verifica en cada request. Si un usuario inicia sesión en otro dispositivo, la sesión anterior queda inválida.
- **Protección de fuerza bruta**: tras 5 intentos fallidos el usuario queda bloqueado 30 minutos. El login retorna HTTP 401 con mensaje genérico.

### Autenticación de huéspedes (sitio público)
- Registro con nombre, email y contraseña (BCrypt). El registro puede deshabilitarse desde `application.properties` (`app.registro.habilitado=false`).
- Login independiente del staff (tokens JWT distintos).
- Página "Mis Reservas" donde el huésped ve el historial y estado de sus reservas.

### Sitio público de reservas
- **Barra de búsqueda** en `/habitaciones`: check-in, check-out y número de personas. Filtra habitaciones disponibles en tiempo real.
- **Disponibilidad de estacionamiento**: 4 plazas disponibles. El buscador muestra cuántas quedan para las fechas elegidas (indicador verde/amarillo/rojo).
- **Página de habitaciones**: grilla con foto portada, estado (disponible / ocupado / reservado), precio desde, capacidad y amenidades.
- **Detalle de habitación**: carrusel de fotos, descripción, precios por tarifa, opción de agregar estacionamiento, formulario de reserva.
- Las fechas buscadas se pasan automáticamente al formulario de reserva del detalle.
- La disponibilidad se calcula en el backend — una habitación físicamente ocupada hoy sigue aceptando reservas para fechas futuras.
- Reservas quedan en estado `pendiente` hasta que el staff las aprueba (o se crean directamente como `confirmada` desde Llavero).

### Gestión de habitaciones (staff)
- Vista tipo dashboard con tarjetas por habitación.
- 5 estados: **Libre**, **Ocupado**, **En Aseo**, **Mantención**, **Deshabilitada**.
- Contador regresivo en tiempo real para habitaciones ocupadas (rojo < 10 min, amarillo < 30 min).
- Auto-aseo programado: el `HabitacionScheduler` revisa habitaciones con tiempo vencido hace más de 30 min y las pasa automáticamente a aseo.
- Código de barras opcional → escaneable desde Nueva Venta.
- **Panel de gestión completo (jefe)**: fotos de habitación (subir, eliminar, marcar portada), descripción para el sitio web, capacidad máxima, amenidades, tarifas y datos internos — todo desde una sola pantalla en Llavero.

### Reservas desde el panel staff
- El jefe puede crear reservas directamente desde Llavero sin que el huésped tenga cuenta.
- Selecciona habitación, fechas, y datos del huésped (nombre, email, teléfono opcionales).
- Si se ingresa email, se crea o reutiliza la cuenta del huésped. Sin email, se genera una cuenta walk-in interna.
- La reserva queda en estado `confirmada` de inmediato (sin paso de aprobación).

### Ventas
- **Dos modos**: Hostal y Minimarket (toggle arriba de la página).
- En **modo Hostal**: habitación opcional — se pueden vender productos sueltos sin asignarlos a una habitación.
- Tarifas por hora (1h, 2h, 3h) y tarifa noche. Al seleccionar tarifa noche aparece un **selector de noches** (− N +) con la fecha de salida calculada automáticamente.
- **Early check-in**: si se vende tarifa noche entre 00:00 y 11:59, el sistema consulta si fue sin costo, con costo (+$8.000) o si salen a las 12:00 del mismo día.
- **Walk-in pago al salir**: botón "Estadía activa — pago al salir" que crea la estadía activa sin cobrar. El cobro ocurre al hacer check-out.
- **Cargo a estadía activa**: si hay estadías en curso, el vendedor puede elegir cargar los ítems del carrito directamente a la cuenta de un huésped hospedado (sin crear una venta nueva).
- En **modo Minimarket**: input siempre enfocado para la pistola de código de barras.
- Ítems libres con código supervisor (7777).
- Anulación con clave — devuelve stock y libera habitación. Envía alerta al jefe.
- **Método de pago registrado** en cada venta (efectivo / transferencia / débito / crédito / otro).

### Inventario (minimarket)
- Catálogo compartido: descuenta en modo hostal y minimarket.
- Stock mínimo con alertas visuales.
- Costo unitario para valorización del inventario.
- Ingresos y ajustes de stock con historial de movimientos.

### Turnos de caja
- Apertura automática al iniciar sesión.
- **Cierre con arqueo obligatorio** firmado con PIN (wizard de 3 pasos): resumen del sistema → desglose por método de pago + conteo de billetes → firma.
- Email automático al jefe con PDF del arqueo al cerrar.
- Alerta independiente si la diferencia supera $5.000.

### Panel del Jefe (tiempo real)
Vista `/llavero/admin` con auto-refresh cada 30 segundos:
- Total vendido hoy y en la semana.
- Turnos activos con cajero, tiempo desde apertura, ventas y total.
- Habitaciones ocupadas con hora de salida estimada (rojo si vencidas).
- DTEs pendientes de emisión.
- Botón "Enviar resumen del día".

### Correos automáticos al jefe
| Cuándo | Qué llega |
|---|---|
| Cada noche a las 23:30 | Resumen del día (turnos, total, habitaciones, DTEs) |
| Cada cierre de turno | Arqueo completo + PDF adjunto |
| Cierre con diferencia ≥ $5.000 | Alerta separada |
| Venta anulada | Alerta con cajero, monto y detalle |
| Botón manual del panel admin | Resumen al instante |

Todos los envíos son asíncronos (`@Async`).

### Gestión de usuarios (solo jefe)
- CRUD completo desde `/llavero/usuarios`.
- Roles: **Jefe** (acceso total), **Cajero** (venta, historial, aseo), **Mucama/Aseo** (solo aseo).
- PIN de 4 a 8 dígitos (SHA-256). Nombre de usuario = identificador de login.
- Solo se muestran usuarios activos — los desactivados no aparecen en ninguna pantalla.
- Desactivar preserva historial de ventas (soft delete).

### Aseo y housekeeping
- Vista `/llavero/aseo` accesible sin JWT con PIN de aseo (`app.pin.aseo`, default 1441).
- **Panel de aseo** (`/llavero/panel-aseo`, solo jefe): asigna habitaciones en estado aseo a cualquier usuario con rol Aseo, Cajero o Jefe.
- Polling automático cada 30 segundos en la vista de aseo.
- Historial del día con hora de completado.
- Al completar aseo completo → habitación pasa automáticamente a Libre.

### Reportería y estadísticas
- **Estadísticas de ocupación** (`/llavero/estadisticas`): tasa de ocupación por mes, ingresos por tipo de habitación, días de la semana con más check-ins, comparativo mes/mes anterior.
- **Reporte de ventas** (`/llavero/reporte`): filtro por rango de fechas y tipo (hostal/minimarket), desglose por método de pago, exportación a CSV.
- **Widget de stock bajo** en el dashboard: productos bajo el mínimo definido aparecen destacados con botón a inventario.

### Confirmación de depósito (reservas)
- Al confirmar una reserva pendiente, el staff puede ingresar la referencia del depósito recibido.
- Se envía un email al huésped con el asunto "¡Reserva confirmada!" que incluye los datos de la estadía y la referencia del depósito.

### Sitio público (mimaravillahostal.com)
- Habitaciones cargadas dinámicamente desde la API (fotos, precios, disponibilidad reales).
- Trust band con número real de habitaciones del sistema.
- Sección de ubicación con dirección (Vicuña 461, La Serena), mapa embed y botón WhatsApp.
- Sección de política de cancelación.
- Precio mínimo dinámico en los CTAs.
- Botón WhatsApp flotante en todas las páginas.
- SEO: title dinámico por página, Open Graph completo para WhatsApp/redes sociales.
- Preload del hero para eliminar el flash blanco inicial.

### Fotos de habitaciones
- Subida de fotos desde el panel de Llavero (JEFE).
- Las fotos se guardan en `uploads/habitaciones/` en el servidor y se sirven como archivos estáticos.
- Una foto se marca como **portada** y aparece en las tarjetas de la página de habitaciones.
- Las demás fotos forman el **carrusel** de la página de detalle.
- Si no hay fotos cargadas, las tarjetas muestran imágenes de Unsplash como fallback.

### Carrusel de fotos (página de detalle)
- Imagen hero a pantalla completa con flechas de navegación ‹ › superpuestas.
- Navegación circular: desde la última foto vuelve a la primera.
- Puntos indicadores en la parte inferior con animación de ancho.
- Contador de fotos "N / Total" en la esquina inferior derecha.
- Thumbnails en barra oscura para saltar directamente a cualquier foto.

### Estadías activas (ciclo completo de hospedaje)

Cierra el ciclo entre reserva web y cobro. El flujo completo es:

1. **Reserva web** — huésped reserva desde `mimaravillahostal.com`, queda en estado `pendiente`.
2. **Confirmación** — jefe confirma desde Llavero → estado `confirmada`.
3. **Check-in** — jefe hace click en "🛎️ Check-in" el día de llegada → se crea una **estadía activa** con los cargos iniciales (N noches × precio estimado). La habitación pasa a `ocupado`.
4. **Cargos durante la estadía** — desde `/llavero/estadias` el staff agrega cargos extras (desayuno, minibar, lavandería) que se acumulan en el total.
5. **Check-out** — staff abre la estadía, revisa todos los cargos, selecciona método de pago y confirma el cobro. La habitación pasa a `aseo` y se genera el DTE pendiente.

El dashboard muestra un widget verde con las estadías activas en tiempo real.

### Documentos Tributarios (DTE)
Sin integración API. Flujo manual:
1. Cada venta genera un registro `pendiente` en `dte_queue`.
2. El operador emite el documento en el portal SII MiPyme.
3. Marca el registro como `emitido` en el sistema.

### Roles y permisos

| Rol | Acceso |
|---|---|
| **Jefe** | Todo + gestión de habitaciones, inventario, usuarios, DTEs, panel admin, panel de fotos y detalles de habitaciones |
| **Cajero** | Dashboard, Nueva Venta, Historial, Cierre. Operaciones de habitación con clave |

---

## Seguridad

- PINs hasheados con SHA-256 (staff) y BCrypt (huéspedes).
- JWT firmado con HMAC-SHA256 + sessionId en BD para invalidación remota.
- Spring Security stateless, sin cookies, sin CSRF.
- **CORS restringido** a los orígenes configurados en `cors.allowed-origins` (no wildcard).
- **Protección de fuerza bruta** en login de staff: bloqueo de 30 min tras 5 intentos fallidos.
- **Endpoints de fotos y edición protegidos** con `@PreAuthorize("hasRole('JEFE')")`.
- Registro de huéspedes puede deshabilitarse con `app.registro.habilitado=false`.
- `application.properties` con secretos no se commitea (está en `.gitignore`).

---

## Requisitos previos

- **Java 17+**
- **Maven 3.8+**
- **Node.js 18+**
- **PostgreSQL 15** corriendo en `localhost:5432`
- **Cloudflare Tunnel** configurado (para acceso remoto desde internet)
- **Cuenta Gmail con App Password** (para emails automáticos)

---

## Instalación

### 1. Base de datos
```sql
CREATE DATABASE llavero;
```
El esquema se crea automáticamente con `spring.jpa.hibernate.ddl-auto=update`.

### 2. Backend
```bash
cd backend
mvn spring-boot:run
```
Corre en `http://localhost:8080`.

### 3. Frontends (modo desarrollo, opcional)
```bash
# Staff
cd frontend && npm install && npm run dev
# Público
cd frontend-publico && npm install && npm run dev
```

### 4. Build para producción
```bash
# Staff → backend/src/main/resources/static/llavero/
cd frontend && npm run build

# Público → backend/src/main/resources/static/reservas/
cd frontend-publico && npm run build
```

---

## Inicio rápido con `iniciar.bat`

Levanta todo el stack en un solo paso (Windows):

1. Verifica e inicia PostgreSQL (intenta postgresql-x64-15/16/17).
2. Compila ambos frontends con `npm run build`.
3. Lanza Spring Boot en una ventana aparte.
4. Hace polling al backend cada 2 segundos hasta confirmar que responde (máx. 2 minutos).
5. Inicia Cloudflare Tunnel.

```bash
iniciar.bat
```

Después de arrancar:
- **Local staff:** `http://localhost:8080/llavero`
- **Local público:** `http://localhost:8080/`
- **Remoto:** `https://mimaravillahostal.com`

---

## Configuración

Archivo: `backend/src/main/resources/application.properties`

```properties
# ===== BASE DE DATOS =====
spring.datasource.url=jdbc:postgresql://localhost:5432/llavero
spring.datasource.username=postgres
spring.datasource.password=postgres

# ===== JWT =====
jwt.secret=<base64-min-32-chars>
jwt.expiration=7200000

# ===== CLAVES OPERATIVAS =====
llavero.codigo.supervisor=7777
llavero.clave.anulacion=1271
llavero.clave.operaciones=1331
llavero.clave.deshabilitar=1221

# ===== EMAIL =====
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=tucorreo@gmail.com
spring.mail.password=<gmail-app-password>
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

llavero.arqueo.email.destino=jefe@miempresa.cl
llavero.arqueo.email.remitente=Llavero <tucorreo@gmail.com>

# ===== CORS =====
cors.allowed-origins=http://localhost:3000,http://localhost:5173,http://localhost:5174,https://mimaravillahostal.com,https://www.mimaravillahostal.com

# ===== REGISTRO DE HUÉSPEDES =====
app.registro.habilitado=false
```

---

## Usuarios iniciales

El `DataInitializer` se ejecuta en cada arranque y garantiza estos 3 usuarios base (desactivando cualquier otro):

| Nombre | PIN | Rol |
|---|---|---|
| `admin` | `1271` | Jefe |
| `cajero` | `1891` | Cajero |
| `mucama` | `1441` | Aseo |

**Cambiar nombres y PINes después del primer login** desde *Gestión de Usuarios* (solo jefe). El nombre del usuario es su identificador de login — se recomienda usar el formato compacto (ej: `scruchaga`).

---

## Claves de operación

| Código | Acción |
|---|---|
| `7777` | Agregar ítems de precio libre en una venta |
| `1271` | Anular una venta → notifica al jefe |
| `1331` | Liberar habitación o enviar a aseo |
| `1221` | Deshabilitar una habitación |

---

## Estructura del proyecto

```
Sistema hotelero/
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/cl/llavero/
│       │   ├── config/          # DataInitializer, WebConfig, Schedulers
│       │   ├── controller/      # REST controllers + SPA controllers
│       │   ├── dto/             # Request / Response objects
│       │   ├── entity/          # JPA entities
│       │   ├── repository/      # Spring Data repositories
│       │   ├── security/        # JwtUtil, JwtAuthFilter, SecurityConfig
│       │   └── service/         # Servicios de negocio
│       └── resources/
│           ├── application.properties           # NO commiteado
│           ├── application.properties.example
│           └── static/
│               ├── reservas/    # Sitio público buildeado (servido en /)
│               ├── llavero/     # SPA staff buildeada (servida en /llavero/)
│               └── uploads/     # Fotos de habitaciones (generado en runtime)
│
├── frontend/              # SPA staff (React + Tailwind dark)
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── components/
│       ├── context/       # SesionContext
│       ├── pages/         # Dashboard, NuevaVenta, Habitaciones, Reservas, Admin...
│       └── services/      # api.js
│
├── frontend-publico/      # Sitio público (React + Tailwind light, estilo hostal)
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       ├── components/    # Navbar, Footer
│       └── pages/         # HomePage, HabitacionesPage, HabitacionDetallePage,
│                          # LoginPage, RegisterPage, MisReservasPage
│
├── iniciar.bat
├── Manual de Usuario - Llavero.html
├── Manual del Jefe - Llavero.html
└── README.md
```

---

## API principal

### Auth staff (público)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/auth/usuarios` | Lista de nombres para el login dinámico |
| POST | `/api/auth/login` | Login nombre + PIN → JWT |
| POST | `/api/auth/logout` | Logout |

### Auth huéspedes (público)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/public/registro` | Registro de huésped |
| POST | `/api/public/login` | Login de huésped → JWT |
| GET | `/api/public/habitaciones` | Listado público de habitaciones |
| GET | `/api/public/habitaciones/{id}` | Detalle de habitación |

### Habitaciones (staff)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/habitaciones` | Listar con estado |
| PUT | `/api/habitaciones/{id}/operar` | Cambiar estado con clave |
| PUT | `/api/habitaciones/{id}/estado` | Cambiar estado directo (jefe) |
| POST | `/api/habitaciones` | Crear (jefe) |
| PUT | `/api/habitaciones/{id}` | Editar (jefe) |
| POST | `/api/habitaciones/{id}/fotos` | Subir foto (jefe) |
| PUT | `/api/habitaciones/{id}/fotos/{fotoId}/portada` | Marcar portada (jefe) |
| DELETE | `/api/habitaciones/{id}/fotos/{fotoId}` | Eliminar foto (jefe) |

### Reservas
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/reservas/mis-reservas` | Reservas del huésped autenticado |
| POST | `/api/reservas` | Crear reserva (huésped autenticado) |
| DELETE | `/api/reservas/{id}` | Cancelar reserva propia |
| GET | `/api/admin/reservas` | Todas las reservas (jefe) |
| POST | `/api/admin/reservas` | Crear reserva como staff (jefe) |
| PUT | `/api/admin/reservas/{id}/confirmar` | Confirmar reserva (staff) |
| PUT | `/api/admin/reservas/{id}/completar` | Completar reserva (staff) |
| PUT | `/api/admin/reservas/{id}/cancelar` | Cancelar reserva (staff) |

### Ventas
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/ventas` | Crear venta |
| GET | `/api/ventas` | Historial |
| POST | `/api/ventas/{id}/anular` | Anular con clave → email al jefe |

### Turnos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/turnos/activo` | Turno activo |
| GET | `/api/turnos/activo/resumen` | Resumen para cierre |
| POST | `/api/turnos/cerrar` | Cerrar turno con arqueo |

### Admin (solo jefe)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/metricas` | Métricas + productos bajo stock |
| GET | `/api/admin/estadisticas` | Ocupación, ingresos, días semana |
| GET | `/api/admin/reporte` | Reporte filtrable por fecha/tipo |
| GET | `/api/admin/estado-actual` | Estado en tiempo real |
| POST | `/api/admin/resumen-dia/enviar` | Disparar correo del día |
| GET/POST | `/api/admin/usuarios` | Listar (solo activos) / crear |
| PUT/DELETE | `/api/admin/usuarios/{id}` | Editar / desactivar usuario |
| GET | `/api/admin/estadias` | Estadías activas |
| POST | `/api/admin/estadias/{id}/cargo` | Agregar cargo individual |
| POST | `/api/admin/estadias/{id}/cargos-batch` | Agregar múltiples cargos |
| POST | `/api/admin/estadias/{id}/checkout` | Hacer check-out |
| PUT | `/api/admin/reservas/{id}/confirmar` | Confirmar + referencia depósito |

### Tests automatizados
```bash
cd backend && mvn test
```
22 tests de integración cubriendo: auth (login, brute force, roles), ventas (hostal, minimarket, estadías), reservas (crear, confirmar, cancelar) y habitaciones (estados, métricas).

---

## Hardware soportado

### Pistola lectora de códigos de barra
Plug and play vía USB (reconocida como teclado). En modo Minimarket hay un input siempre enfocado que captura la lectura + Enter y busca el producto.

### Impresora térmica 58mm
Configuración única en Windows: tamaño de papel 58mm. En Chrome/Edge primera impresión: márgenes Ninguno, escala 100%, sin encabezados. Detalle completo en `Manual del Jefe - Llavero.html`.

---

## Licencia

Proyecto privado — Sociedad Cruchagas SpA · Hostal Mi Maravilla · La Serena, Chile.
