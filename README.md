# Llavero — Sistema de Gestión Hotelera

Sistema POS completo para hostales y hoteles pequeños, desarrollado con Spring Boot 3 y React 18. Permite gestionar habitaciones, ventas, turnos de caja y documentos tributarios electrónicos (DTE) para el mercado chileno.

---

## Tecnologías

| Capa | Stack |
|---|---|
| Backend | Java 17 · Spring Boot 3.2.5 · Spring Security 6 · Spring Data JPA |
| Frontend | React 18 · Vite · Tailwind CSS (dark mode) |
| Base de datos | PostgreSQL 15 |
| Autenticación | JWT (JJWT 0.12.6) |
| DTE | Cola local + emisión manual en portal SII MiPyme |

---

## Funcionalidades

### Gestión de habitaciones
- Vista tipo dashboard con tarjetas por habitación
- 5 estados: **Libre**, **Ocupado**, **En Aseo**, **Mantención**, **Deshabilitada**
- Contador regresivo en tiempo real para habitaciones ocupadas (rojo < 10 min, amarillo < 30 min)
- Transición de estado con clave de operaciones (1331): ocupado → libre, ocupado → aseo, aseo → libre

### Ventas
- **Dos modos**: Hostal y Minimarket (toggle arriba de la página)
- En **modo Hostal**: la habitación es **opcional** — podés vender productos sueltos (ej: cigarros, condones, jugos) sin asignarlo a una habitación
- Si seleccionás habitación + tarifa: la habitación queda ocupada
- Si no seleccionás habitación: solo se cobran los productos (igual que en minimarket)
- En **modo Hostal**: tarifas por hora (1h, 2h, 3h) y tarifa noche (salida 12:00 del día siguiente)
- **Early check-in**: si se vende tarifa noche entre 00:00 y 11:59, el sistema consulta si fue sin costo, con costo (+$8.000) o si salen a las 12:00 del mismo día
- En **modo Minimarket**: input de pistola de código de barras + grilla de productos con stock visible
- Agregar productos con ícono y categoría
- Ítems libres con código supervisor (7777)
- Anulación de ventas con clave (1271) — devuelve stock automáticamente

### Inventario (minimarket)
- Catálogo compartido con hostal: cualquier producto con stock trackeado descuenta en ambos modos
- Stock opcional por producto (si se deja en blanco, el producto no trackea inventario)
- Stock mínimo configurable para alertas visuales
- Costo unitario para cálculo de valor del inventario
- Código de barras único (acepta cualquier formato, usado por la pistola)
- **Página /inventario (jefe)**:
  - Lista filtrable: todos / bajo mínimo / sin stock / sin trackear
  - Búsqueda por nombre o código
  - Botones rápidos por producto: **Ingreso** (sumar al stock) y **Ajuste** (corregir tras conteo físico)
  - Tabla de movimientos recientes con quién, qué, cuándo

### Documentos Tributarios
- Generación de boleta o factura en cada venta
- Cola DTE local con estado: pendiente → emitido / error
- Página dedicada para emitir manualmente en el [portal SII MiPyme](https://mipyme.sii.cl)

### Impresión y comprobantes
- **Comprobante térmico 58mm** para cada venta — preview en pantalla + botón "Imprimir"
- Funciona con cualquier impresora térmica USB instalada en el OS (browser usa el driver del sistema)
- "Reimprimir" disponible desde el Historial de ventas para reimprimir comprobantes pasados
- **Comprobante de cierre de turno** también en 58mm con el resumen del arqueo

### Email del cierre de turno
- Al cerrar el turno con arqueo firmado, se envía un email automático al jefe
- El email lleva un PDF adjunto con el detalle completo (resumen, desglose por método, conteo de billetes, diferencia, observación)
- Configurar SMTP en `application.properties`:
  ```
  spring.mail.host=smtp.gmail.com
  spring.mail.port=587
  spring.mail.username=tucorreo@gmail.com
  spring.mail.password=clave-de-aplicación
  llavero.arqueo.email.destino=jefe@miempresa.cl
  ```
- Para Gmail usar **clave de aplicación** (no la contraseña normal): https://myaccount.google.com/apppasswords
- Si el email no está configurado, el cierre sigue funcionando — solo se omite el envío

### Turnos de caja
- Apertura automática al iniciar sesión
- **Cierre con arqueo obligatorio** firmado con PIN (wizard de 3 pasos)
- Historial filtrable: mi turno / hoy / semana / todo

#### Wizard de cierre de turno
1. **Resumen del sistema** — total recaudado, # ventas, boletas/facturas, habitaciones operadas, limpiezas, productos top vendidos, duración
2. **Desglose y conteo** — declarar cuánto ingresó por efectivo / transferencia / tarjeta débito / crédito / otro + conteo detallado de billetes y monedas (9 denominaciones del peso chileno) con cálculo de diferencia en tiempo real
3. **Firma** — observación (obligatoria si hay diferencia) + PIN del cajero

Todo el arqueo se guarda en la tabla `arqueos_turno` para auditoría posterior por el jefe.

### Roles
| Rol | Acceso |
|---|---|
| **Jefe** | Todo + dropdown "Administración" con: Gestión, Configurar, Productos, Inventario, DTEs, Métricas |
| **Cajero** | Dashboard, Nueva Venta, Historial, Cierre. Gestión de habitaciones con clave |

#### Estructura del menú
- **Comunes (todos)**: Dashboard · Nueva Venta · Historial · Cierre
- **Administración (solo jefe, dropdown)**: Gestión de habitaciones · Configurar habitaciones · Productos · Inventario · DTEs SII · Métricas

Las habitaciones tienen un campo opcional de **código de barras** — si lo configurás, podés escanearlas con la pistola desde Nueva Venta (modo Hostal) para seleccionarlas rápido.

#### Estados que puede asignar cada rol

| Estado | Jefe (panel edición) | Cajero (con clave) |
|---|---|---|
| Libre | ✅ directo | ✅ clave 1331 (desde ocupado o aseo) |
| Ocupado | ✅ directo | ✅ vía nueva venta |
| En Aseo | ✅ directo | ✅ clave 1331 (desde ocupado) |
| Mantención | ✅ directo | ❌ |
| Deshabilitada | ✅ directo | ✅ clave 1221 (desde cualquier estado) |

---

## Requisitos previos

- Java 17+
- Maven 3.8+
- Node.js 18+
- PostgreSQL 15 corriendo en `localhost:5432`

---

## Instalación y puesta en marcha

### 1. Base de datos

```sql
CREATE DATABASE llavero;
```

El esquema se crea automáticamente al iniciar el backend (`ddl-auto=update`).

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

Corre en `http://localhost:8080`. Al arrancar por primera vez crea los datos de prueba (habitaciones y usuarios).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Corre en `http://localhost:3000`. El proxy de Vite redirige `/api` al backend.

---

## Configuración

El archivo de configuración está en `backend/src/main/resources/application.properties`:

```properties
# Base de datos
spring.datasource.url=jdbc:postgresql://localhost:5432/llavero
spring.datasource.username=postgres
spring.datasource.password=postgres

# Claves del sistema
llavero.codigo.supervisor=7777      # ítem libre en ventas
llavero.clave.anulacion=1271        # anular ventas
llavero.clave.operaciones=1331      # liberar / cambiar estado habitación

# JWT
jwt.secret=bGxhdmVyby1qd3Qtc2VjcmV0...   # cambiar en producción
jwt.expiration=86400000                    # 24 horas
```

> **Importante:** Cambiar el `jwt.secret` antes de poner en producción.

---

## Usuarios de prueba

| Nombre | PIN | Rol |
|---|---|---|
| Carlos Mendoza | 1234 | Jefe |
| Ana Torres | 5678 | Cajero |
| Luis Pérez | 9012 | Cajero |

---

## Habitaciones de prueba

| N° | Tipo | Baño |
|---|---|---|
| L101 | Loft | Privado |
| M201 | Matrimonial | Privado |
| M202 | Matrimonial | Privado |
| I301 | Individual | Privado |
| M401 | Matrimonial | Compartido |
| F501 | Familiar | Privado |
| I601 | Individual | Compartido |

---

## Claves de operación

| Código | Quién | Acción |
|---|---|---|
| `7777` | Supervisor | Agregar ítems de precio libre en una venta |
| `1271` | Cualquier usuario | Anular una venta del historial |
| `1331` | Cualquier usuario | Liberar habitación (ocupado→libre) o enviar a aseo (ocupado→aseo / aseo→libre) |
| `1221` | Cualquier usuario | Deshabilitar una habitación desde cualquier estado |

> La re-habilitación de una habitación deshabilitada solo la puede hacer el **Jefe** desde el panel de edición en Habitaciones.

---

## Flujo de venta

```
1. Seleccionar habitación libre
2. Elegir tarifa (1h / 2h / 3h / noche)
   └─ Si tarifa=noche y hora < 12:00 → modal early check-in
      ├─ Sin costo → sale mañana 12:00
      ├─ Con costo (+$8.000) → sale mañana 12:00
      └─ Sale hoy 12:00 → no es early check-in
3. Agregar productos opcionales
4. Confirmar tipo DTE (boleta / factura)
5. La habitación pasa a Ocupado con contador regresivo
```

## Flujo de liberación

```
Desde cualquier pantalla → botón en la tarjeta de habitación
→ Ingresar clave 1331
→ Elegir: Liberar (→ Libre) o Aseo (→ En Aseo)
└─ Desde estado Aseo → solo opción Liberar disponible
```

---

## Estructura del proyecto

```
Sistema hotelero/
├── backend/
│   ├── pom.xml
│   └── src/main/java/cl/llavero/
│       ├── config/          # DataInitializer, CORS
│       ├── controller/      # REST endpoints
│       ├── dto/             # Request / Response objects
│       ├── entity/          # JPA entities
│       ├── repository/      # Spring Data repositories
│       ├── security/        # JWT filter, SecurityConfig
│       └── service/         # Lógica de negocio
│
└── frontend/
    └── src/
        ├── components/      # RoomCard, Navbar, Modales
        ├── context/         # SesionContext (JWT + rol)
        ├── pages/           # Dashboard, NuevaVenta, Historial, ...
        └── services/        # api.js (Axios)
```

---

## API principal

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Login con nombre + PIN |
| GET | `/api/habitaciones` | Listar habitaciones con estado y salida estimada |
| PUT | `/api/habitaciones/{id}/operar` | Cambiar estado con clave 1331 |
| POST | `/api/ventas` | Crear venta |
| POST | `/api/ventas/{id}/anular` | Anular venta con clave 1271 |
| GET | `/api/ventas` | Historial (params: turno / periodo) |
| GET | `/api/dte/pendientes` | DTEs pendientes de emisión |
| PUT | `/api/dte/{id}/emitido` | Marcar DTE como emitido |
| GET | `/api/admin/metricas` | Métricas (solo jefe) |
| POST | `/api/turnos/cerrar` | Cerrar turno activo |

---

## DTE — Documentos Tributarios Electrónicos

El sistema **no emite DTEs automáticamente**. En cambio:

1. Cada venta genera un registro en la tabla `dte_queue` con estado `pendiente`
2. La página **DTE Pendientes** muestra todos los datos necesarios (RUT, monto, tipo, receptor)
3. El operador ingresa manualmente al [portal SII MiPyme](https://mipyme.sii.cl) y emite el documento
4. Una vez emitido, marca el registro como `emitido` en el sistema

Esto permite operar sin integración API y sin costo adicional.

---

## Licencia

Proyecto privado — Sociedad Cruchagas SpA.
