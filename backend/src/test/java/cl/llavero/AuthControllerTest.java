package cl.llavero;

import cl.llavero.entity.Rol;
import cl.llavero.entity.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("Auth — Login y seguridad")
class AuthControllerTest extends TestBase {

    // Usamos nombres que NO colisionan con DataInitializer (admin/cajero)
    @BeforeEach
    void setup() {
        crearUsuario("jefe_test", Rol.jefe, "1234");
        crearUsuario("cajero_test", Rol.cajero, "5678");
    }

    @Test
    @DisplayName("Login correcto con PIN válido retorna token")
    void loginExitoso() throws Exception {
        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("nombre", "jefe_test", "pin", "1234"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andExpect(jsonPath("$.nombre").value("jefe_test"))
            .andExpect(jsonPath("$.rol").value("jefe"));
    }

    @Test
    @DisplayName("Login con PIN incorrecto retorna 401")
    void loginPinIncorrecto() throws Exception {
        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("nombre", "jefe_test", "pin", "9999"))))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Login con usuario inexistente retorna 401")
    void loginUsuarioInexistente() throws Exception {
        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("nombre", "nadie", "pin", "1234"))))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Brute force: 5 intentos fallidos bloquean la cuenta")
    void bruteForceBloqueo() throws Exception {
        for (int i = 0; i < 5; i++) {
            mvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body(Map.of("nombre", "cajero_test", "pin", "0000"))))
                .andExpect(status().isUnauthorized());
        }
        // El 6to intento (incluso con PIN correcto) debe estar bloqueado
        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("nombre", "cajero_test", "pin", "5678"))))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("bloqueada")));
    }

    @Test
    @DisplayName("Endpoint protegido sin token retorna 401")
    void sinTokenRetorna401() throws Exception {
        mvc.perform(post("/api/admin/usuarios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("nombre", "x", "rol", "cajero", "pin", "1111"))))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Cajero no puede acceder a endpoints de jefe → 403")
    void cajeroSinAccesoAdmin() throws Exception {
        Usuario cajero = crearUsuario("cajero2", Rol.cajero, "1111");
        mvc.perform(post("/api/admin/usuarios")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", tokenPara(cajero))
                .content(body(Map.of("nombre", "nuevo", "rol", "cajero", "pin", "2222"))))
            .andExpect(status().isForbidden());
    }
}
