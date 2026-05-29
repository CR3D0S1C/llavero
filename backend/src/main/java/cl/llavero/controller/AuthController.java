package cl.llavero.controller;

import cl.llavero.dto.LoginRequest;
import cl.llavero.dto.LoginResponse;
import cl.llavero.entity.Usuario;
import cl.llavero.repository.UsuarioRepository;
import cl.llavero.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UsuarioRepository usuarioRepository;

    public AuthController(AuthService authService, UsuarioRepository usuarioRepository) {
        this.authService = authService;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/usuarios")
    public ResponseEntity<List<Map<String, String>>> usuariosActivos() {
        List<Map<String, String>> lista = usuarioRepository.findAll().stream()
                .filter(Usuario::getActivo)
                .sorted((a, b) -> a.getNombre().compareToIgnoreCase(b.getNombre()))
                .map(u -> Map.of("nombre", u.getNombre(), "rol", u.getRol().name()))
                .toList();
        return ResponseEntity.ok(lista);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("mensaje", "Sesión cerrada"));
    }
}
