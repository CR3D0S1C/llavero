package cl.llavero;

import cl.llavero.entity.*;
import cl.llavero.repository.HabitacionRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("Habitaciones — Estados y gestión")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class HabitacionControllerTest extends TestBase {

    @Autowired HabitacionRepository habitacionRepo;

    private Usuario jefe;
    private String token;

    @BeforeEach
    void setup() {
        jefe = crearUsuario("jefe_hab", Rol.jefe, "1234");
        token = tokenPara(jefe);
    }

    private Habitacion nuevaHabitacion(String numero, EstadoHabitacion estado) {
        Habitacion h = new Habitacion();
        h.setNumero(numero);
        h.setEstado(estado);
        h.setActiva(true);
        return habitacionRepo.save(h);
    }

    @Test
    @Order(1)
    @DisplayName("Listar habitaciones requiere autenticación")
    void listarRequiereAuth() throws Exception {
        mvc.perform(get("/api/habitaciones"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(2)
    @DisplayName("Listar habitaciones retorna lista con estado correcto")
    void listarHabitaciones() throws Exception {
        nuevaHabitacion("201", EstadoHabitacion.libre);
        nuevaHabitacion("202", EstadoHabitacion.ocupado);

        mvc.perform(get("/api/habitaciones")
                .header("Authorization", token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.numero=='201')].estado", hasItem("libre")))
            .andExpect(jsonPath("$[?(@.numero=='202')].estado", hasItem("ocupado")));
    }

    @Test
    @Order(3)
    @DisplayName("Solo jefe puede cambiar estado de habitación")
    void soloJefeCambiaEstado() throws Exception {
        Habitacion h = nuevaHabitacion("203", EstadoHabitacion.libre);
        Usuario cajero = crearUsuario("cajero_hab", Rol.cajero, "5678");

        mvc.perform(put("/api/habitaciones/{id}/estado", h.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", tokenPara(cajero))
                .content(body(Map.of("estado", "mantenimiento"))))
            .andExpect(status().isForbidden());
    }

    @Test
    @Order(4)
    @DisplayName("Jefe puede cambiar estado a mantenimiento")
    void jefeModificaEstado() throws Exception {
        Habitacion h = nuevaHabitacion("204", EstadoHabitacion.libre);

        mvc.perform(put("/api/habitaciones/{id}/estado", h.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", token)
                .content(body(Map.of("estado", "mantenimiento", "motivo", "Reparación baño"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.estado").value("mantenimiento"));
    }

    @Test
    @Order(5)
    @DisplayName("Liberación de habitación ocupada cambia a aseo")
    void liberarHabitacion() throws Exception {
        Habitacion h = nuevaHabitacion("205", EstadoHabitacion.ocupado);

        mvc.perform(put("/api/habitaciones/{id}/liberar", h.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", token)
                .content(body(Map.of("motivo", "Check-out manual"))))
            .andExpect(status().isOk());
    }

    @Test
    @Order(6)
    @DisplayName("Métricas de jefe incluyen alertas de stock")
    void metricasIncluyenStock() throws Exception {
        mvc.perform(get("/api/admin/metricas")
                .header("Authorization", token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.productosBajoStock").isArray())
            .andExpect(jsonPath("$.habitacionesPorEstado").isMap());
    }
}
