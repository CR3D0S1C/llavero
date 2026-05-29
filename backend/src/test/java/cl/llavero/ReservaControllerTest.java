package cl.llavero;

import cl.llavero.entity.*;
import cl.llavero.repository.HabitacionRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("Reservas — Flujo completo")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ReservaControllerTest extends TestBase {

    @Autowired HabitacionRepository habitacionRepo;

    private Usuario jefe;
    private Habitacion habitacion;
    private String token;

    @BeforeEach
    void setup() {
        jefe = crearUsuario("jefe_res", Rol.jefe, "1234");
        token = tokenPara(jefe);

        habitacion = new Habitacion();
        habitacion.setNumero("301");
        habitacion.setEstado(EstadoHabitacion.libre);
        habitacion.setActiva(true);
        habitacion = habitacionRepo.save(habitacion);
    }

    private String crearReservaYObtenerID() throws Exception {
        var payload = Map.of(
            "habitacionId", habitacion.getId().toString(),
            "fechaEntrada", LocalDate.now().plusDays(3).toString(),
            "fechaSalida",  LocalDate.now().plusDays(5).toString(),
            "nombreHuesped", "Juan Pérez",
            "emailHuesped", "juan@test.com"
        );

        var result = mvc.perform(post("/api/admin/reservas")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", token)
                .content(body(payload)))
            .andExpect(status().isOk())
            .andReturn();

        var root = new com.fasterxml.jackson.databind.ObjectMapper()
            .readTree(result.getResponse().getContentAsString());
        return root.get("id").asText();
    }

    @Test
    @Order(1)
    @DisplayName("Crear reserva como staff → estado confirmada")
    void crearReservaStaff() throws Exception {
        mvc.perform(post("/api/admin/reservas")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", token)
                .content(body(Map.of(
                    "habitacionId", habitacion.getId().toString(),
                    "fechaEntrada", LocalDate.now().plusDays(3).toString(),
                    "fechaSalida",  LocalDate.now().plusDays(5).toString(),
                    "nombreHuesped", "María López",
                    "emailHuesped", "maria@test.com"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.estado").value("confirmada"))
            .andExpect(jsonPath("$.huespedNombre").value("María López"));
    }

    @Test
    @Order(2)
    @DisplayName("Confirmar reserva pendiente con referencia de depósito")
    void confirmarConDeposito() throws Exception {
        var reservaRepo = mvc.perform(post("/api/admin/reservas")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", token)
                .content(body(Map.of(
                    "habitacionId", habitacion.getId().toString(),
                    "fechaEntrada", LocalDate.now().plusDays(10).toString(),
                    "fechaSalida",  LocalDate.now().plusDays(12).toString(),
                    "nombreHuesped", "Pedro Test"
                ))))
            .andExpect(status().isOk())
            .andReturn();

        var id = new com.fasterxml.jackson.databind.ObjectMapper()
            .readTree(reservaRepo.getResponse().getContentAsString()).get("id").asText();

        // Confirmar con referencia de depósito
        mvc.perform(put("/api/admin/reservas/{id}/confirmar", id)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", token)
                .content(body(Map.of("referenciaDeposito", "TRF-20260528-001"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.estado").value("confirmada"))
            .andExpect(jsonPath("$.referenciaDeposito").value("TRF-20260528-001"));
    }

    @Test
    @Order(3)
    @DisplayName("Confirmar reserva sin referencia → igual se confirma")
    void confirmarSinReferencia() throws Exception {
        var result = mvc.perform(post("/api/admin/reservas")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", token)
                .content(body(Map.of(
                    "habitacionId", habitacion.getId().toString(),
                    "fechaEntrada", LocalDate.now().plusDays(20).toString(),
                    "fechaSalida",  LocalDate.now().plusDays(22).toString(),
                    "nombreHuesped", "Sin Referencia"
                ))))
            .andExpect(status().isOk())
            .andReturn();

        var id = new com.fasterxml.jackson.databind.ObjectMapper()
            .readTree(result.getResponse().getContentAsString()).get("id").asText();

        mvc.perform(put("/api/admin/reservas/{id}/confirmar", id)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", token)
                .content("{}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.estado").value("confirmada"));
    }

    @Test
    @Order(4)
    @DisplayName("Cancelar reserva confirmada")
    void cancelarReserva() throws Exception {
        var result = mvc.perform(post("/api/admin/reservas")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", token)
                .content(body(Map.of(
                    "habitacionId", habitacion.getId().toString(),
                    "fechaEntrada", LocalDate.now().plusDays(30).toString(),
                    "fechaSalida",  LocalDate.now().plusDays(32).toString(),
                    "nombreHuesped", "A Cancelar"
                ))))
            .andReturn();

        var id = new com.fasterxml.jackson.databind.ObjectMapper()
            .readTree(result.getResponse().getContentAsString()).get("id").asText();

        mvc.perform(put("/api/admin/reservas/{id}/cancelar", id)
                .header("Authorization", token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.estado").value("cancelada"));
    }

    @Test
    @Order(5)
    @DisplayName("Cajero no puede listar reservas")
    void cajeroNoVeReservas() throws Exception {
        Usuario cajero = crearUsuario("cajero_res", Rol.cajero, "9999");
        mvc.perform(get("/api/admin/reservas")
                .header("Authorization", tokenPara(cajero)))
            .andExpect(status().isForbidden());
    }
}
