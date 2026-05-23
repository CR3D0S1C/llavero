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
- Tarifas por hora (1h, 2h, 3h) y tarifa noche (salida 12:00 del día siguiente)
- **Early check-in**: si se vende tarifa noche entre 00:00 y 11:59, el sistema consulta si fue sin costo, con costo (+$8.000) o si salen a las 12:00 del mismo día
- Agregar productos con ícono y categoría
- Ítems libres con código supervisor (7777)
- Anulación de ventas con clave (1271) disponible para todos los usuarios

### Documentos Tributarios
- Generación de boleta o factura en cada venta
- Cola DTE local con estado: pendiente → emitido / error
- Página dedicada para emitir manualmente en el [portal SII MiPyme](https://mipyme.sii.cl)

### Turnos de caja
- Apertura automática al iniciar sesión
- Cierre de turno con resumen de ventas del período
- Historial filtrable: mi turno / hoy / semana / todo

### Roles
| Rol | Acceso |
|---|---|
| **Jefe** | Todo: métricas, CRUD habitaciones y productos, historial completo, admin |
| **Cajero** | Nueva venta, historial de su turno, liberación de habitaciones con clave |

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

| Código | Uso |
|---|---|
| `7777` | Agregar ítems libres en una venta (requiere supervisor) |
| `1271` | Anular una venta (cualquier usuario autenticado) |
| `1331` | Liberar habitación o enviar a aseo (cualquier usuario autenticado) |

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
