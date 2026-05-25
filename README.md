# Llavero — Sistema de Gestión Hotelera

Sistema POS completo para hostales y hoteles pequeños, desarrollado con Spring Boot 3 y React 18. Permite gestionar habitaciones, ventas, turnos de caja, inventario y documentos tributarios electrónicos (DTE) para el mercado chileno. Pensado para operación remota: el jefe puede monitorear todo desde su casa mientras los cajeros operan en el hostal.

**Desplegado en:** `https://hostalmimaravilla.com/llavero` (sistema) y `https://hostalmimaravilla.com/` (landing page del hostal).
**Para pruebas:** se puede exponer temporalmente a internet con ngrok desde el script `iniciar.bat`.

---

## Tecnologías

| Capa | Stack |
|---|---|
| Backend | Java 17 · Spring Boot 3.2.5 · Spring Security 6 · Spring Data JPA · @EnableAsync · @EnableScheduling |
| Frontend | React 18 · Vite 5 · Tailwind CSS (dark mode) · React Router 6 |
| Base de datos | PostgreSQL 15 |
| Autenticación | JWT (JJWT 0.12.6) con sessionId persistido en BD (sesión única por usuario) |
| Email | JavaMailSender + Gmail SMTP con App Password |
| PDF | openhtmltopdf (XHTML estricto) |
| Tunneling para pruebas | ngrok |
| DTE | Cola local + emisión manual en portal SII MiPyme |

---

## Arquitectura general

```
Cliente (navegador / móvil)
        │
        ▼
   ngrok tunnel  ←─── opcional, para pruebas remotas
        │
        ▼
Spring Boot (puerto 8080)
 ├── /              → landing page (en construcción)
 ├── /llavero/      → React SPA (servida desde static/llavero/)
 ├── /llavero/assets/ → JS/CSS estáticos
 └── /api/*         → endpoints REST (JWT-protected)
        │
        ▼
   PostgreSQL 15
```

El backend sirve tanto la SPA como la API. El frontend usa `basename="/llavero"` (React Router) y `base: '/llavero/'` (Vite). La landing page del hostal vive en el root, separada del sistema interno.

---

## Funcionalidades

### Autenticación y sesiones
- Login con **nombre + PIN de 4 dígitos** (sin contraseñas).
- Los nombres de usuario se cargan **dinámicamente** desde `/api/auth/usuarios` (público) — al crear/eliminar usuarios en BD, el login se actualiza solo.
- JWT con expiración de 24 horas.
- **Sesión única por usuario**: al hacer login se genera un `sessionId` (UUID) que se guarda en la tabla `usuarios` y se embebe en el JWT como claim `sid`. En cada request el `JwtAuthFilter` verifica que el `sid` del token coincida con el de BD. Si un mismo usuario inicia sesión en otro dispositivo, el `sid` anterior queda inválido → el filtro no autentica → Spring Security devuelve 401 → el frontend redirige al login con el mensaje *"Tu sesión se cerró. Puede que hayas iniciado en otro dispositivo o que la sesión expirara."*
- Distintos cajeros pueden estar logueados simultáneamente sin problema — la restricción es **una sesión por usuario**, no una sesión total.

### Gestión de habitaciones
- Vista tipo dashboard con tarjetas por habitación.
- 5 estados: **Libre**, **Ocupado**, **En Aseo**, **Mantención**, **Deshabilitada**.
- Contador regresivo en tiempo real para habitaciones ocupadas (rojo < 10 min, amarillo < 30 min).
- Auto-aseo programado: cada minuto el `HabitacionScheduler` revisa habitaciones con tiempo vencido hace más de 30 min y las pasa automáticamente a estado *aseo*.
- Código de barras opcional por habitación → escaneable con pistola desde Nueva Venta.

### Ventas
- **Dos modos**: Hostal y Minimarket (toggle arriba de la página).
- En **modo Hostal**: la habitación es **opcional** — podés vender productos sueltos (cigarros, condones, jugos) sin asignarlos a una habitación.
- Si seleccionás habitación + tarifa: la habitación queda ocupada.
- En modo Hostal: tarifas por hora (1h, 2h, 3h) y tarifa noche (salida 12:00 del día siguiente).
- **Early check-in**: si se vende tarifa noche entre 00:00 y 11:59, el sistema consulta si fue sin costo, con costo (+$8.000) o si salen a las 12:00 del mismo día.
- En **modo Minimarket**: input siempre enfocado para la pistola de código de barras + grilla de productos con stock visible.
- Ítems libres con código supervisor (7777).
- Anulación de ventas con clave (1271) — devuelve stock automáticamente y libera la habitación si estaba asociada. **Envía alerta por email al jefe** con el detalle de lo anulado.

### Inventario (minimarket)
- Catálogo compartido con hostal: cualquier producto con stock trackeado descuenta en ambos modos.
- Stock opcional por producto (si se deja en blanco, no se trackea).
- Stock mínimo configurable para alertas visuales.
- Costo unitario para cálculo de valor del inventario.
- Código de barras único.
- **Página /inventario (jefe)**:
  - Lista filtrable: todos / bajo mínimo / sin stock / sin trackear.
  - Búsqueda por nombre o código.
  - Botones rápidos por producto: **Ingreso** (sumar al stock) y **Ajuste** (corregir tras conteo físico).
  - Tabla de movimientos recientes con quién, qué, cuándo.

### Turnos de caja
- Apertura automática al iniciar sesión.
- **Cierre con arqueo obligatorio** firmado con PIN (wizard de 3 pasos).
- Historial filtrable: mi turno / hoy / semana / todo.

#### Wizard de cierre de turno
1. **Resumen del sistema** — total recaudado, # ventas, boletas/facturas, habitaciones operadas, limpiezas, productos top vendidos, duración.
2. **Desglose y conteo** — declarar cuánto ingresó por efectivo / transferencia / tarjeta débito / crédito / otro + conteo detallado de billetes y monedas (9 denominaciones del peso chileno) con cálculo de diferencia en tiempo real.
3. **Firma** — observación (obligatoria si hay diferencia) + PIN del cajero.

Al cerrar, se envía **email automático al jefe** con un PDF adjunto del arqueo completo. Si la diferencia supera $5.000 (en cualquier sentido), se envía además una **alerta independiente**.

### Panel del Jefe (tiempo real)
Vista `/llavero/admin` con auto-refresh cada 30 segundos. Muestra:
- Total vendido hoy y en la semana.
- **Turnos activos ahora**: cajeros trabajando con tiempo desde apertura, número de ventas, total acumulado.
- **Habitaciones ocupadas** con hora de salida estimada — destacadas en rojo si están vencidas.
- Cajeros sin turno abierto.
- DTEs pendientes de emisión en SII.
- Conteo de habitaciones por estado (libre / ocupada / aseo / mantención / deshabilitada).
- Botón **"Enviar resumen del día"** que dispara el correo con el estado actual.

### Correos automáticos al jefe
| Cuándo | Qué llega |
|---|---|
| Cada noche a las 23:30 | Resumen del día (turnos cerrados, total, habitaciones ocupadas, DTEs pendientes) — vía `ResumenDiarioScheduler` |
| Cada cierre de turno | Detalle del arqueo + PDF adjunto |
| Cierre con diferencia ≥ $5.000 | Alerta separada con el monto y signo |
| Venta anulada | Alerta con cajero, monto y detalle de los ítems anulados |
| Botón manual del panel admin | Resumen al instante |

Todos los envíos son **asíncronos** (`@Async`) y no bloquean la operación si Gmail tiene latencia o falla.

### Gestión de usuarios (solo jefe)
- CRUD completo desde `/llavero/usuarios`.
- Crear cajeros o jefes nuevos con PIN de 4 a 8 dígitos.
- Editar nombre, rol o cambiar PIN.
- Desactivar (no borra — preserva historial de ventas).
- El PIN se guarda hasheado con SHA-256.

### Impresión y comprobantes
- **Comprobante térmico 58mm** para cada venta con preview en pantalla + botón "Imprimir".
- Implementación: React Portal renderiza el ticket como hijo directo de `<body>`, y `@media print` oculta el resto mostrando solo `.print-only`. Garantiza que solo se imprima el ticket sin interfaz del sistema.
- CSS configurado con `@page { size: 58mm auto }` y márgenes en 0 para impresoras térmicas.
- Funciona con cualquier impresora térmica USB instalada en el OS (Chrome/Edge usa el driver del sistema).
- **"Reimprimir"** disponible desde el Historial para comprobantes pasados.
- Comprobante de cierre de turno también en 58mm.

### Documentos Tributarios (DTE)
El sistema **no emite DTEs automáticamente**. En cambio:
1. Cada venta genera un registro en la tabla `dte_queue` con estado `pendiente`.
2. La página **DTE Pendientes** muestra todos los datos necesarios (RUT, monto, tipo, receptor).
3. El operador ingresa manualmente al [portal SII MiPyme](https://mipyme.sii.cl) y emite el documento.
4. Una vez emitido, marca el registro como `emitido` en el sistema.

Esto permite operar sin integración API ni costos adicionales mientras la operación lo permita.

### Roles y permisos

| Rol | Acceso |
|---|---|
| **Jefe** | Todo + dropdown "Administración" con: Gestión de habitaciones, Inventario, Usuarios, DTEs SII, Panel admin tiempo real |
| **Cajero** | Dashboard, Nueva Venta, Historial, Cierre. Operaciones de habitación con clave |

#### Estados que puede asignar cada rol

| Estado | Jefe (panel edición) | Cajero (con clave) |
|---|---|---|
| Libre | ✅ directo | ✅ clave 1331 (desde ocupado o aseo) |
| Ocupado | ✅ directo | ✅ vía nueva venta |
| En Aseo | ✅ directo | ✅ clave 1331 (desde ocupado) |
| Mantención | ✅ directo | ❌ |
| Deshabilitada | ✅ directo | ✅ clave 1221 (desde cualquier estado) |

La re-habilitación de una habitación deshabilitada solo la puede hacer el **Jefe** desde el panel.

---

## Requisitos previos

- **Java 17+**
- **Maven 3.8+**
- **Node.js 18+**
- **PostgreSQL 15** corriendo en `localhost:5432`
- **ngrok** (opcional, para acceso remoto desde fuera de la red local)
- **Cuenta Gmail con App Password** (opcional, para emails)

---

## Instalación

### 1. Base de datos
```sql
CREATE DATABASE llavero;
```
El esquema se crea automáticamente al iniciar el backend (`spring.jpa.hibernate.ddl-auto=update`).

### 2. Backend
```bash
cd backend
mvn spring-boot:run
```
Corre en `http://localhost:8080`. Al arrancar por primera vez el `DataInitializer` crea los datos de prueba (usuarios, habitaciones, productos).

### 3. Frontend (modo desarrollo, opcional)
```bash
cd frontend
npm install
npm run dev
```
Corre en `http://localhost:5173/llavero/`. El proxy de Vite redirige `/api` al backend.

### 4. Frontend (build para producción)
```bash
cd frontend
npm run build
# Copiar dist/ a backend/src/main/resources/static/llavero/
```
Spring Boot sirve estos archivos estáticos automáticamente bajo `/llavero/`.

---

## Inicio rápido con `iniciar.bat`

El script `iniciar.bat` levanta todo el stack en un solo paso (Windows):

1. Verifica e inicia PostgreSQL (intenta postgresql-x64-15/16/17).
2. Lanza Spring Boot en una ventana aparte.
3. Hace **polling al endpoint público** `/api/auth/usuarios` cada 2 segundos hasta confirmar que el backend responde 200 (máx. 2 minutos).
4. Lanza ngrok en otra ventana → da la URL pública para compartir.

Si PostgreSQL o el backend no arrancan, el script falla con un mensaje claro en lugar de seguir adelante a ciegas.

```bash
iniciar.bat
```

Después de arrancar:
- **Local:** `http://localhost:8080/llavero`
- **Remoto (vía ngrok):** mostrado en la ventana de ngrok

---

## Configuración

Archivo: `backend/src/main/resources/application.properties` (no se commitea — está en `.gitignore`. Existe `application.properties.example` como plantilla).

```properties
# ===== BASE DE DATOS =====
spring.datasource.url=jdbc:postgresql://localhost:5432/llavero
spring.datasource.username=postgres
spring.datasource.password=postgres

# ===== JWT =====
jwt.secret=<base64-min-32-chars>           # CAMBIAR EN PRODUCCION
jwt.expiration=86400000                    # 24 horas

# ===== CLAVES OPERATIVAS =====
llavero.codigo.supervisor=7777             # ítem libre en ventas
llavero.clave.anulacion=1271               # anular ventas
llavero.clave.operaciones=1331             # liberar / cambiar estado habitación
llavero.clave.deshabilitar=1221            # deshabilitar habitación

# ===== EMAIL (Gmail con App Password) =====
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=tucorreo@gmail.com
spring.mail.password=<gmail-app-password>  # NO la contraseña normal
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

llavero.arqueo.email.destino=jefe@miempresa.cl
llavero.arqueo.email.remitente=Llavero <tucorreo@gmail.com>
```

> **Gmail App Password:** `https://myaccount.google.com/apppasswords` — requiere tener 2FA activado en la cuenta.
> Si el email no está configurado, el sistema funciona igual — solo se omiten los envíos.

---

## Usuarios iniciales

Al arrancar con BD vacía, el `DataInitializer` crea estos usuarios:

| Nombre | PIN | Rol |
|---|---|---|
| Abelardo Cruchaga | 1271 | Jefe |
| Salma Cruchaga | 1271 | Jefe |
| Cesar Cruchaga | 1271 | Jefe |
| cajero1 | 1891 | Cajero |
| cajero2 | 1891 | Cajero |
| cajero3 | 1891 | Cajero |

Después del primer login, **cambiar los PINes** desde *Usuarios* (solo jefe).

---

## Habitaciones de prueba

| N° | Tipo | Baño |
|---|---|---|
| L101 | Loft | Privado |
| M201 | Matrimonial | Privado |
| M202 | Matrimonial | Privado |
| I301 | Individual | Privado |
| M401 | Matrimonial | Compartido |
| F501 | Familiar | Compartido |
| I601 | Individual | Compartido |

Editables desde el panel del jefe.

---

## Claves de operación

| Código | Quién | Acción |
|---|---|---|
| `7777` | Supervisor | Agregar ítems de precio libre en una venta |
| `1271` | Cualquier usuario | Anular una venta del historial → notifica al jefe |
| `1331` | Cualquier usuario | Liberar habitación (ocupado→libre) o enviar a aseo |
| `1221` | Cualquier usuario | Deshabilitar una habitación desde cualquier estado |

---

## Flujo de venta (hostal)

```
1. Login → turno abierto automáticamente
2. Nueva Venta → modo Hostal
3. Seleccionar habitación libre (clic o escanear código)
4. Elegir tarifa (1h / 2h / 3h / noche)
   └─ Si tarifa=noche y hora < 12:00 → modal early check-in
      ├─ Sin costo → sale mañana 12:00
      ├─ Con costo (+$8.000) → sale mañana 12:00
      └─ Sale hoy 12:00 → no es early check-in
5. Agregar productos opcionales del minimarket
6. Confirmar tipo DTE (boleta / factura)
7. Habitación pasa a Ocupado con contador regresivo
8. Se imprime comprobante térmico 58mm
9. Se genera entrada en cola DTE
```

---

## Estructura del proyecto

```
Sistema hotelero/
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/cl/llavero/
│       │   ├── config/          # DataInitializer, WebConfig, Schedulers (Habitacion, Resumen)
│       │   ├── controller/      # REST + LlaveroSpaController (sirve la SPA)
│       │   ├── dto/             # Request / Response objects
│       │   ├── entity/          # JPA entities (Usuario, Venta, Habitacion, Turno, ArqueoTurno...)
│       │   ├── repository/      # Spring Data repositories
│       │   ├── security/        # JwtUtil, JwtAuthFilter, SecurityConfig
│       │   └── service/         # VentaService, TurnoService, EmailService, PdfService, AdminService...
│       └── resources/
│           ├── application.properties           # NO commiteado (en .gitignore)
│           ├── application.properties.example   # plantilla pública
│           └── static/
│               ├── index.html       # Landing page del hostal (root /)
│               └── llavero/         # SPA buildeada (servida en /llavero/)
│                   ├── index.html
│                   └── assets/
│
├── frontend/
│   ├── vite.config.js     # base: '/llavero/'
│   └── src/
│       ├── App.jsx        # <BrowserRouter basename="/llavero">
│       ├── components/    # RoomCard, Navbar, Modales, ComprobanteVenta, ComprobanteCierre
│       ├── context/       # SesionContext (JWT + rol)
│       ├── pages/         # Login, Dashboard, NuevaVenta, Historial, Admin, GestionUsuarios...
│       ├── services/      # api.js (Axios con interceptor 401 → /llavero/)
│       └── utils/         # toast.js, helpers
│
├── iniciar.bat                            # Inicio one-click con health check
├── Manual de Usuario - Llavero.html       # Manual para cajeros (imprimible a PDF)
├── Manual del Jefe - Llavero.html         # Manual para el jefe (operación remota + hardware)
└── README.md
```

---

## API principal

### Auth (público)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/auth/usuarios` | Lista de usuarios activos para el login dinámico |
| POST | `/api/auth/login` | Login con nombre + PIN → JWT + sessionId |
| POST | `/api/auth/logout` | Logout (cliente borra token) |

### Habitaciones
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/habitaciones` | Listar habitaciones con estado y salida estimada |
| GET | `/api/habitaciones/buscar/{codigo}` | Buscar por código de barras |
| PUT | `/api/habitaciones/{id}/operar` | Cambiar estado con clave 1331 |
| PUT | `/api/habitaciones/{id}/estado` | Cambiar estado directamente (jefe) |
| POST | `/api/habitaciones` | Crear habitación (jefe) |
| PUT | `/api/habitaciones/{id}` | Editar habitación (jefe) |
| GET | `/api/habitaciones/log` | Historial de cambios de estado |

### Ventas
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/ventas` | Crear venta |
| GET | `/api/ventas` | Historial (params: turno / periodo) |
| POST | `/api/ventas/{id}/anular` | Anular venta con clave 1271 → email al jefe |

### Productos / Inventario
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/productos` | Listar productos |
| GET | `/api/productos/buscar/{codigo}` | Buscar por código de barras |
| POST | `/api/productos/{id}/stock/entrada` | Ingreso de stock |
| POST | `/api/productos/{id}/stock/ajuste` | Ajuste tras conteo físico |
| GET | `/api/productos/movimientos` | Movimientos recientes |

### Turnos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/turnos/activo` | Turno activo del usuario |
| GET | `/api/turnos/activo/resumen` | Resumen para el wizard de cierre |
| POST | `/api/turnos/cerrar` | Cerrar turno con arqueo firmado |

### DTE
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/dte/pendientes` | DTEs pendientes |
| GET | `/api/dte/todos` | Histórico completo |
| PUT | `/api/dte/{id}/emitido` | Marcar emitido |

### Admin (solo jefe)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/admin/metricas` | Métricas históricas |
| GET | `/api/admin/estado-actual` | Estado en tiempo real (auto-refresh del panel) |
| POST | `/api/admin/resumen-dia/enviar` | Disparar correo del resumen del día |
| GET | `/api/admin/usuarios` | Listar usuarios |
| POST | `/api/admin/usuarios` | Crear usuario |
| PUT | `/api/admin/usuarios/{id}` | Editar usuario |
| DELETE | `/api/admin/usuarios/{id}` | Desactivar usuario |

---

## Manuales de uso

En la raíz del proyecto hay dos manuales en HTML pensados para imprimir como PDF desde Chrome (`Ctrl+P → Guardar como PDF`):

- **`Manual de Usuario - Llavero.html`** — para los cajeros y hermanos. Explica login, ventas, habitaciones, cierre de turno y problemas comunes.
- **`Manual del Jefe - Llavero.html`** — para el administrador del hostal (papá). Foco en operación remota desde casa: panel en tiempo real, interpretación de correos, alertas, gestión de usuarios, configuración inicial de la impresora térmica y el scanner.

---

## Hardware soportado

### Pistola lectora de códigos de barra
**Plug and play.** Se conecta por USB y el OS la reconoce como teclado. En modo Minimarket de Nueva Venta hay un input siempre enfocado que captura la lectura + Enter → busca el producto y lo agrega al carrito. También funciona para seleccionar habitaciones desde Hostal si están configuradas con código.

### Impresora térmica 58mm
Requiere configuración única la primera vez:
1. **Windows:** Configuración → Bluetooth y dispositivos → Impresoras → Preferencias → tamaño de papel **58mm**.
2. **Chrome/Edge** (en la primera impresión): márgenes **Ninguno**, escala **100%**, **desactivar** encabezados y pies de página. El navegador recuerda la configuración por impresora.

Detalle completo en `Manual del Jefe - Llavero.html` sección 10.

---

## Seguridad

- PINs hasheados con SHA-256.
- JWT firmado con HMAC-SHA256 + sessionId en BD para invalidación remota.
- Spring Security stateless, sin cookies, sin CSRF.
- `authenticationEntryPoint` configurado para devolver 401 (no 403) cuando la sesión es inválida → el frontend redirige automáticamente al login.
- CORS permisivo solo para `/api/**` (ngrok puede tener subdominios variables).
- `application.properties` con secretos **no se commitea** (está en `.gitignore`).

> **Para producción real:** cambiar `jwt.secret` (mínimo 32 caracteres base64), rotar las claves operativas (1271/1331/1221/7777), endurecer CORS al dominio real.

---

## Despliegue remoto temporal con ngrok

Para que el jefe pueda monitorear desde su casa o que los hermanos prueben desde sus celulares sin estar en la red local del hostal:

1. Tener ngrok instalado y autenticado (`ngrok config add-authtoken ...`).
2. Ejecutar `iniciar.bat`.
3. La ventana "Llavero - Ngrok" muestra la URL pública (ej: `https://xxx-yyy-zzz.ngrok-free.app`).
4. Compartir esa URL con `+ /llavero` al final.

> La URL gratuita de ngrok cambia en cada arranque. Para dominio fijo se necesita ngrok pago o desplegar en un VPS.

---

## Licencia

Proyecto privado — Sociedad Cruchagas SpA · Hostal Mi Maravilla · La Serena, Chile.
