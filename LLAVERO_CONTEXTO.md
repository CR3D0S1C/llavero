# LLAVERO — Sistema de Gestión de Hospedaje
> **Documento maestro del proyecto. Leer completo al iniciar cada sesión de Claude Code.**
> Última actualización: Mayo 2026

---

## INSTRUCCIONES PARA CLAUDE CODE

Al iniciar sesión en terminal:
```bash
cd ~/llavero
claude
```

Dentro de Claude Code, lo primero que debes hacer:
```
/read LLAVERO_CONTEXTO.md
```

Luego indicar la tarea del día. Ejemplo:
```
Leíste el contexto. Hoy vamos a migrar el módulo de habitaciones del HTML al backend Spring Boot.
El HTML de referencia está en: hostal-control.html
```

**Reglas para Claude Code en este proyecto:**
- Stack obligatorio: Java 17 + Spring Boot 3 + React 18 + Vite + PostgreSQL 15
- Siempre crear tests unitarios con JUnit 5 para la lógica de negocio
- El frontend se comunica SOLO via REST JSON con el backend
- Nunca hardcodear credenciales — usar application.properties o variables de entorno
- Respetar la estructura de carpetas definida en la sección de arquitectura
- Cuando se toque lógica DTE, revisar siempre la sección 7 de este documento

---

## 1. EMPRESA Y PRODUCTO

| Campo | Valor |
|-------|-------|
| Razón social | Sociedad Cruchagas SpA |
| Producto | **Llavero** |
| Slogan | Sistema de gestión para hospedaje |
| Dominio objetivo | llavero.cl (verificar en nic.cl) |
| Mercado | Chile — hostales, residenciales, moteles, apart-hoteles, cabañas |
| Desarrollador | Sebastian Cruchaga |
| Cliente piloto | Hostal del padre del desarrollador |

---

## 2. PROBLEMA QUE RESUELVE

Los hospedajes pequeños en Chile tienen hoy solo dos opciones:

- **Bsale** (~$73.000/mes): caro, diseñado para retail, lleno de funciones que un hostal no usa
- **Portal SII MiPyme**: gratuito pero 100% manual, sin API, sin integración posible

**Llavero** ocupa el espacio del medio:
- Barato ($15.000-$50.000/mes según plan)
- Simple — cajero sin conocimiento técnico lo opera solo
- Llave en mano — el cliente recibe el equipo configurado y listo
- Específico para hospedaje — no es un sistema genérico adaptado
- DTE integrado — boletas y facturas electrónicas sin salir del sistema

---

## 3. MODELO DE NEGOCIO

### Planes de venta

| Plan | Precio/mes | Incluye |
|------|-----------|---------|
| Solo software | $15.000 | Sistema + hasta 300 DTE + soporte remoto |
| Kit completo arriendo | $45.000-$50.000 | Hardware + software + DTE + soporte |

### Costo del Kit hardware (por unidad)

| Componente | Costo aprox. |
|-----------|-------------|
| Notebook usado funcional | $150.000 |
| SSD 256GB si trae HDD | $25.000 |
| Impresora térmica USB (Xprinter XP-58) | $45.000 |
| Scanner QR/1D USB | $25.000 |
| Dock impreso en 3D (logo Llavero) | ~$8.000 en filamento |
| **Total costo** | **~$253.000** |
| **Precio venta sugerido** | **$380.000-$450.000** |

### Proyección MRR

| Clientes | Ingreso/mes |
|---------|------------|
| 10 | $350.000-$500.000 |
| 20 | $700.000-$1.000.000 |
| 50 | $1.750.000-$2.500.000 |

### Modelo de licencia (Fase 2)

El sistema valida un código mensual de 8 caracteres generado por el dueño:

```java
// Algoritmo de generación del código mensual
String seed = rutCliente + yearMonth + SECRET_KEY;
String codigo = SHA256(seed).substring(0, 8).toUpperCase();
// Se envía por WhatsApp al cliente cuando paga
```

Si no hay código válido al arrancar → pantalla de bloqueo. El sistema no requiere internet para validar (100% offline).

---

## 4. STACK TÉCNICO

### Fase 1 — MVP (hostal piloto, sin costo)

```
Frontend:   React 18 + Vite + TailwindCSS
Backend:    Spring Boot 3.x (Java 17)
Base datos: PostgreSQL 15 (local, embedded en el equipo del cliente)
DTE:        SimpleFactura API (simplefactura.cl) — $15.000/mes
Deploy:     JAR ejecutable + Chromium kiosk en Linux local
Build:      Maven
Tests:      JUnit 5 + Mockito
```

### Fase 2 — Producto comercial

```
Motor DTE:  Propio en Java (certificado Sociedad Cruchagas SpA ante SII)
Licencias:  Código mensual offline (SHA-256)
Hardware:   Notebook Linux preconfigurado
Servidor:   VPS para distribución de actualizaciones
```

### Fase 3 — Escala SaaS

```
Certificación SII: Sociedad Cruchagas SpA como proveedor DTE
Motor DTE propio:  Reemplaza SimpleFactura — costo cero por DTE
Multicliente:      Un servidor central, múltiples instancias
```

---

## 5. ARQUITECTURA DEL SISTEMA

### Diagrama general

```
[Chromium Kiosk - localhost:3000]
            ↓ REST JSON
[Spring Boot API - localhost:8080]
            ↓
    ┌───────┴────────┐
    ↓                ↓
[PostgreSQL]    [Servicio DTE]
 local            ↓
               [SimpleFactura API]
                  ↓
               [SII Chile]
```

### Estructura de carpetas del proyecto

```
llavero/
├── hostal-control.html          ← PROTOTIPO HTML (referencia visual)
├── LLAVERO_CONTEXTO.md          ← ESTE ARCHIVO
│
├── backend/                     ← Spring Boot
│   ├── src/main/java/cl/llavero/
│   │   ├── config/
│   │   ├── controller/
│   │   │   ├── HabitacionController.java
│   │   │   ├── VentaController.java
│   │   │   ├── ProductoController.java
│   │   │   ├── TurnoController.java
│   │   │   └── DteController.java
│   │   ├── service/
│   │   │   ├── HabitacionService.java
│   │   │   ├── VentaService.java
│   │   │   ├── TurnoService.java
│   │   │   └── DteService.java          ← llama a SimpleFactura
│   │   ├── model/
│   │   │   ├── Habitacion.java
│   │   │   ├── Venta.java
│   │   │   ├── VentaItem.java
│   │   │   ├── Producto.java
│   │   │   ├── Turno.java
│   │   │   ├── Usuario.java
│   │   │   └── Dte.java
│   │   ├── repository/
│   │   └── dto/
│   ├── src/main/resources/
│   │   └── application.properties
│   └── src/test/
│
├── frontend/                    ← React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Habitaciones.jsx
│   │   │   ├── NuevaVenta.jsx
│   │   │   ├── Historial.jsx
│   │   │   ├── Productos.jsx
│   │   │   ├── CierreTurno.jsx
│   │   │   └── Admin.jsx
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── ModalDTE.jsx
│   │   │   ├── RoomCard.jsx
│   │   │   └── CajaVenta.jsx
│   │   ├── services/
│   │   │   └── api.js           ← fetch al backend
│   │   └── context/
│   │       └── SesionContext.jsx ← usuario y turno activo
│   └── vite.config.js
│
└── scripts/
    ├── setup-linux.sh           ← configura kiosk en el equipo del cliente
    └── generar-codigo.sh        ← genera código mensual de licencia
```

### Modo offline

- El sistema opera 100% sin internet para registrar ventas
- Los DTE pendientes se encolan en tabla `dte_queue` en PostgreSQL
- Un scheduler de Spring (`@Scheduled`) intenta enviarlos cada 5 minutos
- Si hay internet, los envía y marca como `emitido`

---

## 6. MODELO DE DATOS (PostgreSQL)

```sql
-- Usuarios del sistema
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('jefe', 'cajero')),
    pin_hash VARCHAR(64) NOT NULL,   -- SHA-256 del PIN
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Turnos de trabajo
CREATE TABLE turnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id),
    inicio TIMESTAMP NOT NULL DEFAULT NOW(),
    fin TIMESTAMP,
    cerrado BOOLEAN DEFAULT false,
    observacion TEXT,
    total_turno NUMERIC(12,2) DEFAULT 0
);

-- Tipos de habitacion (catalogo)
CREATE TABLE tipos_habitacion (
    id VARCHAR(50) PRIMARY KEY,   -- 'loft', 'matrimonial-privado', etc.
    label VARCHAR(100) NOT NULL,
    bano VARCHAR(20) NOT NULL,    -- 'Privado', 'Compartido'
    color VARCHAR(10)
);

-- Habitaciones
CREATE TABLE habitaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(20) NOT NULL,
    tipo_id VARCHAR(50) REFERENCES tipos_habitacion(id),
    descripcion VARCHAR(200),
    estado VARCHAR(30) DEFAULT 'libre'
        CHECK (estado IN ('libre','ocupado','mantenimiento','deshabilitada')),
    nota VARCHAR(300),
    activa BOOLEAN DEFAULT true
);

-- Precios por habitacion, personas y duracion
CREATE TABLE habitacion_precios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habitacion_id UUID REFERENCES habitaciones(id),
    personas INT NOT NULL,
    duracion VARCHAR(10) NOT NULL,  -- '1h','2h','3h','noche'
    precio NUMERIC(10,2) NOT NULL
);

-- Productos del catalogo
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    precio NUMERIC(10,2) NOT NULL,
    icono VARCHAR(50),
    categoria VARCHAR(50),
    activo BOOLEAN DEFAULT true
);

-- Ventas (cabecera)
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id UUID REFERENCES turnos(id),
    usuario_id UUID REFERENCES usuarios(id),
    habitacion_id UUID REFERENCES habitaciones(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora TIME NOT NULL DEFAULT CURRENT_TIME,
    created_at TIMESTAMP DEFAULT NOW(),
    observacion TEXT,
    total NUMERIC(12,2) NOT NULL,
    tipo_dte VARCHAR(10) NOT NULL DEFAULT 'boleta'
        CHECK (tipo_dte IN ('boleta', 'factura')),
    -- Datos receptor (solo facturas)
    receptor_rut VARCHAR(15),
    receptor_razon VARCHAR(200),
    receptor_giro VARCHAR(200),
    receptor_direccion VARCHAR(300),
    receptor_comuna VARCHAR(100),
    receptor_ciudad VARCHAR(100),
    receptor_email VARCHAR(150)
);

-- Items de cada venta
CREATE TABLE venta_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID REFERENCES ventas(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('habitacion','producto','libre')),
    descripcion VARCHAR(200) NOT NULL,
    cantidad INT DEFAULT 1,
    precio_unitario NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    es_libre BOOLEAN DEFAULT false  -- item autorizado con código supervisor
);

-- Cola de DTE pendientes de enviar al SII
CREATE TABLE dte_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID REFERENCES ventas(id),
    tipo_dte VARCHAR(10) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente','emitido','error')),
    intentos INT DEFAULT 0,
    folio INT,
    pdf_url TEXT,
    error_msg TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    emitido_at TIMESTAMP
);
```

---

## 7. DTE E INTEGRACIÓN SII

### Proveedor: SimpleFactura (Fase 1)

| Campo | Valor |
|-------|-------|
| Web | simplefactura.cl |
| Plan | Independiente — $15.000/mes + IVA |
| DTE incluidos | 500/mes |
| Modelo cobro | 1 boleta = 1 DTE (no por llamadas API) |
| Integración | 1 sola llamada REST → ellos hacen todo |
| Prueba gratis | 7 días sin tarjeta |

### Volumen estimado hostal piloto

- ~4 habitaciones/día + ~2 productos = **~180 DTE/mes**
- El plan de 500 DTE/mes cubre holgadamente

### Flujo de emisión desde Spring Boot

```java
// DteService.java — llamada a SimpleFactura
@Service
public class DteService {

    @Value("${simplefactura.api.key}")
    private String apiKey;

    @Value("${simplefactura.rut.emisor}")
    private String rutEmisor;

    public DteResponse emitirBoleta(Venta venta) {
        // 1 sola llamada REST a SimpleFactura
        // Ellos firman, timbran y envían al SII
    }

    public DteResponse emitirFactura(Venta venta) {
        // Igual pero con datos del receptor
    }

    public DteResponse emitirNotaCredito(String ventaId, String motivo) {
        // Anulación — referencia al DTE original
        // En Chile NO existe anulación directa
        // Se emite Nota de Crédito tipo 61
    }
}
```

### JSON para boleta (SimpleFactura)

```json
POST /api/dte/emitir
Authorization: Bearer {jwt}

{
  "tipoDTE": 39,
  "emisor": {
    "rutEmisor": "76123456-7",
    "sucursal": "Casa Matriz"
  },
  "detalles": [
    {
      "nombre": "Habitacion 101 - Matrimonial 2h",
      "cantidad": 1,
      "precioUnitario": 14000
    }
  ]
}
```

### JSON para factura (SimpleFactura)

```json
{
  "tipoDTE": 33,
  "emisor": { "rutEmisor": "76123456-7", "sucursal": "Casa Matriz" },
  "receptor": {
    "rutReceptor": "76987654-3",
    "razonSocial": "Empresa SpA",
    "giro": "Servicios empresariales",
    "direccion": "Av. Providencia 123",
    "comuna": "Providencia",
    "ciudad": "Santiago",
    "email": "admin@empresa.cl"
  },
  "detalles": [
    {
      "nombre": "Servicio de hospedaje",
      "cantidad": 1,
      "precioUnitario": 90000
    }
  ]
}
```

### Datos receptor — ingreso manual

- El cajero ingresa a mano: RUT, razón social, giro, dirección, comuna, ciudad, email
- El RUT se valida con el algoritmo del dígito verificador chileno (ya implementado en HTML)
- Sin integración externa para autocompletar (decisión final: simplicidad > comodidad)

### Anulación de documentos

- En Chile NO existe anulación directa de un DTE
- Se emite Nota de Crédito (tipo 61) referenciando el folio original
- Cuenta como 1 DTE adicional en el plan mensual
- El sistema debe guardar el folio de cada DTE emitido para poder referenciar

### Certificado digital

- La empresa ya tiene certificado cargado en el SII
- Se sube UNA SOLA VEZ al panel de SimpleFactura durante configuración inicial
- Verificar vigencia antes de arrancar (duración 1-2 años)

---

## 8. FUNCIONALIDADES DEL SISTEMA

### Módulos y acceso por rol

| Módulo | Jefe | Cajero |
|--------|------|--------|
| Dashboard | ✅ | ✅ |
| Habitaciones — ver | ✅ | ✅ |
| Habitaciones — vender/liberar | ✅ | ✅ |
| Habitaciones — cambiar estado | ✅ | ❌ |
| Habitaciones — editar precios | ✅ | ❌ |
| Nueva Venta | ✅ | ✅ |
| Ítem libre (con código supervisor) | ✅ | ✅ (necesita código) |
| Historial — turno propio | ✅ | ✅ |
| Historial — todo | ✅ | ❌ |
| Eliminar ventas | ✅ | ❌ |
| Productos — ver en venta | ✅ | ✅ |
| Productos — CRUD catálogo | ✅ | ❌ |
| Cierre de turno | ✅ | ✅ |
| Ver todos los turnos del día | ✅ | ❌ |
| Panel Admin | ✅ | ❌ |

### Tipos de habitaciones

| Tipo | Baño | Personas | Tarifas |
|------|------|----------|---------|
| Loft | Privado | 2/3/4 | 1h, 2h, 3h, noche |
| Matrimonial baño privado | Privado | 2 | 1h, 2h, 3h, noche |
| Individual baño privado | Privado | 1 | 1h, 2h, 3h, noche |
| Matrimonial baño compartido | Compartido | 2 | 1h, 2h, 3h, noche |
| Familiar baño compartido | Compartido | 2/3/4 | 1h, 2h, 3h, noche |
| Individual baño compartido | Compartido | 1 | solo noche |

### Flujo de venta completo

```
1. Cajero inicia sesión con PIN (4 dígitos, teclado en pantalla)
2. Sistema crea turno automáticamente si no hay uno activo
3. Cajero va a "Nueva Venta"
4. Selecciona habitación libre + tarifa (filtradas por estado)
5. Agrega productos adicionales del catálogo (click directo)
6. Opcionalmente agrega ítem libre (requiere código supervisor: 7777 en mock)
7. Presiona "Confirmar Venta"
8. Modal DTE aparece:
   - Opción BOLETA → emite sin datos extra
   - Opción FACTURA → formulario con RUT, razón social, giro, dirección, comuna, ciudad, email
9. Sistema guarda la venta + encola DTE
10. Habitación pasa a estado "Ocupado" automáticamente
11. DTE se envía a SimpleFactura (si hay internet) o queda en cola
```

### Ítem libre

- El cajero puede agregar cualquier producto que no esté en el catálogo
- Ingresa descripción y precio manualmente
- Requiere código de supervisor de 4 dígitos (lo da el jefe verbalmente)
- Se marca como `[LIBRE]` en la caja, historial y resumen de cierre
- Se guarda en `venta_items` con `es_libre = true`

### Cierre de turno

- Muestra: duración, total ventas, desglose por tipo habitación, productos vendidos, ítems libres separados
- Una vez cerrado, bloquea nuevas ventas del mismo usuario
- Para seguir vendiendo hay que iniciar sesión nuevamente (nuevo turno)
- El jefe además ve la tabla de todos los turnos del día con sus totales

---

## 9. SISTEMA DE LOGIN Y SESIÓN

### Mock usuarios (desarrollo)

| Nombre | Rol | PIN | Código supervisor |
|--------|-----|-----|-------------------|
| Carlos Mendoza | jefe | 1234 | 7777 |
| Ana Torres | cajero | 5678 | — |
| Luis Pérez | cajero | 9012 | — |

### En producción

- Los PINs se guardan como SHA-256 en la BD
- El código supervisor es un campo de configuración del sistema (admin del jefe)
- Los usuarios se crean desde el panel Admin (solo jefe)

### Gestión de sesión en React

```jsx
// SesionContext.jsx
const SesionContext = createContext();

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [turno, setTurno] = useState(null);
  // ...
}
```

---

## 10. HARDWARE Y DESPLIEGUE LOCAL

### Equipo del cliente

- Notebook usado funcional (~$150.000) — requisitos: 4GB RAM, SSD, WiFi
- Impresora térmica USB: **Xprinter XP-58** (buena relación precio/calidad en Chile)
- Scanner QR/1D USB — se comporta como teclado, sin driver especial
- Dock impreso en 3D con filamento PETG (más resistente que PLA)

### Sistema operativo

```bash
# Debian minimal o Ubuntu Server con escritorio mínimo
# Auto-login al encender
# Chromium en modo kiosk apuntando a localhost:3000 (frontend React)

# /etc/systemd/system/llavero.service
[Unit]
Description=Llavero Backend
After=network.target postgresql.service

[Service]
ExecStart=/usr/bin/java -jar /opt/llavero/llavero.jar
Restart=always
User=llavero

[Install]
WantedBy=multi-user.target

# Arranque de kiosk en autostart
chromium-browser --kiosk --no-sandbox --disable-infobars http://localhost:3000
```

### Impresión térmica desde Spring Boot

```java
// Protocolo ESC/POS para impresoras térmicas USB
// Librería recomendada: escpos-coffee (Maven)
<dependency>
    <groupId>com.github.anastaciocintra</groupId>
    <artifactId>escpos-coffee</artifactId>
    <version>4.1.0</version>
</dependency>
```

---

## 11. INTEGRACIÓN SIMPLEFACTURA — CONFIGURACIÓN

```properties
# application.properties
simplefactura.api.key=${SIMPLEFACTURA_API_KEY}
simplefactura.rut.emisor=${RUT_EMISOR}
simplefactura.ambiente=produccion   # o 'pruebas' para desarrollo
simplefactura.base.url=https://api.simplefactura.cl

spring.datasource.url=jdbc:postgresql://localhost:5432/llavero
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASS}

# Scheduler para envío de DTEs en cola
dte.queue.scheduler.enabled=true
dte.queue.retry.interval=300000   # 5 minutos en ms
```

---

## 12. CERTIFICACIÓN ANTE SII (Fase 2-3)

- **Postulación:** gratuita — representante legal con certificado digital en sii.cl
- **Proceso técnico:** gratuito — el SII envía ~50 sets de prueba que el motor DTE debe procesar correctamente
- **Plazo:** 5-7 días hábiles una vez enviados los sets de prueba
- **Lo que se certifica:** los documentos (tipo 33, 39, 61) — NO el software
- **Ventaja:** una vez certificado Sociedad Cruchagas SpA, los clientes no se certifican — solo se registran como usuarios del sistema

---

## 13. ESTADO ACTUAL DEL PROYECTO

### Completado en HTML ✅

- [x] Login con PIN y teclado numérico en pantalla
- [x] Sistema de roles: jefe / cajero con permisos diferenciados
- [x] Turno automático al iniciar sesión
- [x] Dashboard con stats en tiempo real
- [x] Gestión de habitaciones — 6 tipos, estados, precios
- [x] Nueva venta — habitación + tarifa + productos + ítem libre
- [x] Ítem libre con código supervisor (4 dígitos)
- [x] Modal DTE — selector boleta/factura con validación RUT chileno
- [x] Datos receptor factura — formulario manual completo
- [x] Historial con filtros (turno / hoy / semana / todo)
- [x] Columna DTE en historial con badge boleta/factura + datos receptor
- [x] Catálogo de productos — CRUD (solo jefe)
- [x] Cierre de turno con resumen detallado
- [x] Panel Admin con métricas, credenciales mock, exportar CSV
- [x] Datos persistidos en localStorage
- [x] Diseño dark mode completo

### Pendiente 🔲

- [ ] **Migración Phase 1:** Spring Boot + React + PostgreSQL
- [ ] **DTE real:** integración SimpleFactura API con credenciales reales
- [ ] **Cola offline:** scheduler para DTEs pendientes
- [ ] **Impresión térmica:** ESC/POS via escpos-coffee
- [ ] **Autenticación real:** JWT + BCrypt para PINs
- [ ] **Nota de crédito:** flujo de anulación desde historial
- [ ] **Configuración Linux kiosk:** script setup-linux.sh
- [ ] **Licencias fase 2:** código mensual SHA-256
- [ ] **Motor DTE propio:** fase 2, reemplaza SimpleFactura
- [ ] **Certificación SII:** fase 2-3

### Próximo paso inmediato

```
1. Recoger feedback del hostal piloto (papá)
2. Ajustar el HTML según feedback
3. Arrancar migración a Spring Boot + React
   - Primero: modelo de datos + repositorios + endpoints básicos
   - Segundo: React consumiendo los endpoints
   - Tercero: integrar SimpleFactura con cuenta de prueba
```

---

## 14. DECISIONES TÉCNICAS — REGISTRO

| Decisión | Elección | Razón | Fecha |
|----------|----------|-------|-------|
| Proveedor DTE fase 1 | SimpleFactura | $15.000/mes, 1 llamada REST, 1 DTE = 1 cobro (predecible) | Mayo 2026 |
| Datos receptor factura | Ingreso manual | Sin costo extra, sin dependencia externa, suficiente para el volumen | Mayo 2026 |
| Base de datos | PostgreSQL local | Robusto, gratuito, funciona offline | Mayo 2026 |
| Backend | Spring Boot 3 (Java 17) | Conocido por el desarrollador, estándar enterprise | Mayo 2026 |
| Frontend | React 18 + Vite | Ecosistema maduro, rápido de desarrollar | Mayo 2026 |
| SO cliente | Debian/Ubuntu minimal | Ligero, estable, controlable, gratuito | Mayo 2026 |
| Modo kiosk | Chromium --kiosk | Gratuito, nativo, sin configuración extra | Mayo 2026 |
| Impresora térmica | Xprinter XP-58 | Mejor precio/calidad disponible en Chile | Mayo 2026 |
| Licencias | Código SHA-256 offline | Sin servidor requerido para operar, máxima disponibilidad | Mayo 2026 |
| Hardware cliente | Notebook usado ~$150k | Mejor relación precio/prestación vs NUC o similar | Mayo 2026 |
| Anulación DTE | Nota de Crédito tipo 61 | Único mecanismo válido en Chile ante el SII | Mayo 2026 |

---

## 15. REFERENCIA RÁPIDA — ENDPOINTS API (a implementar)

```
POST   /api/auth/login              → { usuario, turno, token }
POST   /api/auth/logout

GET    /api/habitaciones            → lista con estado actual
POST   /api/habitaciones            → crear (solo jefe)
PUT    /api/habitaciones/{id}       → editar estado/precios (solo jefe)

GET    /api/ventas?turno=&periodo=  → historial filtrado
POST   /api/ventas                  → registrar venta + encolar DTE
DELETE /api/ventas/{id}             → eliminar (solo jefe)

POST   /api/dte/emitir/{ventaId}    → emitir DTE via SimpleFactura
POST   /api/dte/anular/{ventaId}    → emitir Nota de Crédito
GET    /api/dte/estado/{ventaId}    → consultar estado en SII

GET    /api/productos               → catálogo
POST   /api/productos               → crear (solo jefe)
PUT    /api/productos/{id}          → editar (solo jefe)
DELETE /api/productos/{id}          → eliminar (solo jefe)

GET    /api/turnos/activo           → turno del usuario en sesión
POST   /api/turnos/cerrar           → cerrar turno actual
GET    /api/turnos/hoy              → todos los turnos del día (solo jefe)

GET    /api/admin/metricas          → métricas globales (solo jefe)
```

---

*Sociedad Cruchagas SpA — Producto: Llavero — Mayo 2026*
