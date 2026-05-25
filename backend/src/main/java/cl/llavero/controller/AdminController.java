package cl.llavero.controller;

import cl.llavero.dto.EstadoActualResponse;
import cl.llavero.dto.MetricasResponse;
import cl.llavero.dto.UsuarioRequest;
import cl.llavero.dto.UsuarioResponse;
import cl.llavero.service.AdminService;
import cl.llavero.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('JEFE')")
public class AdminController {

    private final AdminService adminService;
    private final EmailService emailService;

    public AdminController(AdminService adminService, EmailService emailService) {
        this.adminService = adminService;
        this.emailService = emailService;
    }

    @GetMapping("/metricas")
    public ResponseEntity<MetricasResponse> getMetricas() {
        return ResponseEntity.ok(adminService.getMetricas());
    }

    @GetMapping("/estado-actual")
    public ResponseEntity<EstadoActualResponse> getEstadoActual() {
        return ResponseEntity.ok(adminService.getEstadoActual());
    }

    @PostMapping("/resumen-dia/enviar")
    public ResponseEntity<Map<String, String>> enviarResumenManual() {
        emailService.enviarResumenDiarioAsync(adminService.getEstadoActual());
        return ResponseEntity.ok(Map.of("mensaje", "Resumen del día enviado al correo del jefe"));
    }

    @GetMapping("/usuarios")
    public ResponseEntity<List<UsuarioResponse>> getUsuarios() {
        return ResponseEntity.ok(adminService.getUsuarios());
    }

    @PostMapping("/usuarios")
    public ResponseEntity<UsuarioResponse> crearUsuario(@RequestBody UsuarioRequest req) {
        return ResponseEntity.ok(adminService.crearUsuario(req));
    }

    @PutMapping("/usuarios/{id}")
    public ResponseEntity<UsuarioResponse> editarUsuario(@PathVariable UUID id, @RequestBody UsuarioRequest req) {
        return ResponseEntity.ok(adminService.editarUsuario(id, req));
    }

    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<Void> desactivarUsuario(@PathVariable UUID id) {
        adminService.desactivarUsuario(id);
        return ResponseEntity.noContent().build();
    }
}
