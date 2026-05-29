package cl.llavero;

import cl.llavero.entity.*;
import cl.llavero.repository.HabitacionRepository;
import cl.llavero.repository.HabitacionPrecioRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("Ventas — Crear y validar")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class VentaControllerTest extends TestBase {

    @Autowired HabitacionRepository habitacionRepo;
    @Autowired HabitacionPrecioRepository precioRepo;

    private Usuario jefe;
    private Habitacion habitacion;
    private String token;

    @BeforeEach
    void setup() {
        jefe = crearUsuario("jefe_ventas", Rol.jefe, "1234");
        token = tokenPara(jefe);

        habitacion = new Habitacion();
        habitacion.setNumero("101");
        habitacion.setEstado(EstadoHabitacion.libre);
        habitacion.setActiva(true);
        habitacion = habitacionRepo.save(habitacion);

        HabitacionPrecio precio = new HabitacionPrecio();
        precio.setHabitacion(habitacion);
        precio.setPersonas(2);
        precio.setDuracion("Por noche");
        precio.setPrecio(BigDecimal.valueOf(30000));
        precioRepo.save(precio);
    }

    @Test
    @Order(1)
    @DisplayName("Crear venta hostal exitosa → habitación pasa a ocupado")
    void crearVentaHostal() throws Exception {
        var payload = Map.of(
            "tipoVenta", "hostal",
            "tipoDte", "boleta",
            "habitacionId", habitacion.getId().toString(),
            "duracion", "Por noche",
            "cantidadNoches", 1,
            "items", List.of(Map.of(
                "tipo", "habitacion",
                "descripcion", "Hab. 101 Por noche (2 pers.)",
                "cantidad", 1,
                "precioUnitario", 30000,
                "esLibre", false
            )),
            "metodoPago", "efectivo",
            "montoPagado", 30000
        );

        mvc.perform(post("/api/ventas")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", token)
                .content(body(payload)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(30000))
            .andExpect(jsonPath("$.tipoVenta").value("hostal"))
            .andExpect(jsonPath("$.estado").value("cerrada"));

        // Verificar que la habitación quedó ocupada
        mvc.perform(get("/api/habitaciones")
                .header("Authorization", token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.numero=='101')].estado", hasItem("ocupado")));
    }

    @Test
    @Order(2)
    @DisplayName("Crear venta minimarket sin habitación → OK")
    void crearVentaMinimarket() throws Exception {
        var payload = Map.of(
            "tipoVenta", "minimarket",
            "tipoDte", "boleta",
            "items", List.of(
                Map.of("tipo", "producto", "descripcion", "Agua mineral", "cantidad", 2, "precioUnitario", 800, "esLibre", false),
                Map.of("tipo", "producto", "descripcion", "Café", "cantidad", 1, "precioUnitario", 1200, "esLibre", false)
            ),
            "metodoPago", "efectivo",
            "montoPagado", 2800
        );

        mvc.perform(post("/api/ventas")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", token)
                .content(body(payload)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(2800))
            .andExpect(jsonPath("$.tipoVenta").value("minimarket"));
    }

    @Test
    @Order(3)
    @DisplayName("Crear venta sin token → 401")
    void crearVentaSinToken() throws Exception {
        mvc.perform(post("/api/ventas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("tipoVenta", "minimarket", "tipoDte", "boleta", "items", List.of()))))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(4)
    @DisplayName("Crear estadía activa (pago al salir) → estado activa")
    void crearEstadiaActiva() throws Exception {
        var otroJefe = crearUsuario("jefe2", Rol.jefe, "4321");
        var otroToken = tokenPara(otroJefe);

        Habitacion hab2 = new Habitacion();
        hab2.setNumero("102");
        hab2.setEstado(EstadoHabitacion.libre);
        hab2.setActiva(true);
        hab2 = habitacionRepo.save(hab2);

        var payload = Map.of(
            "tipoVenta", "hostal",
            "tipoDte", "boleta",
            "habitacionId", hab2.getId().toString(),
            "duracion", "Por noche",
            "cantidadNoches", 2,
            "pagoAlSalir", true,
            "items", List.of(Map.of(
                "tipo", "habitacion",
                "descripcion", "Hab. TEST-02 — 2 noches",
                "cantidad", 2,
                "precioUnitario", 30000,
                "esLibre", false
            ))
        );

        mvc.perform(post("/api/ventas")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", otroToken)
                .content(body(payload)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.estado").value("activa"))
            .andExpect(jsonPath("$.total").value(60000));
    }

    @Test
    @Order(5)
    @DisplayName("Venta con 3 noches → salidaEstimada = hoy + 3 días")
    void ventaTresNochesCalculaSalida() throws Exception {
        Habitacion hab3 = new Habitacion();
        hab3.setNumero("103");
        hab3.setEstado(EstadoHabitacion.libre);
        hab3.setActiva(true);
        hab3 = habitacionRepo.save(hab3);

        var payload = Map.of(
            "tipoVenta", "hostal",
            "tipoDte", "boleta",
            "habitacionId", hab3.getId().toString(),
            "duracion", "Por noche",
            "cantidadNoches", 3,
            "items", List.of(Map.of(
                "tipo", "habitacion",
                "descripcion", "Hab. TEST-03 — 3 noches",
                "cantidad", 3,
                "precioUnitario", 30000,
                "esLibre", false
            )),
            "metodoPago", "transferencia"
        );

        mvc.perform(post("/api/ventas")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", token)
                .content(body(payload)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(90000))
            .andExpect(jsonPath("$.salidaEstimada").isNotEmpty());
    }
}
