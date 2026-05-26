package cl.llavero.controller;

import cl.llavero.dto.EstadoActualResponse;
import cl.llavero.dto.MetricasResponse;
import cl.llavero.dto.ReservaResponse;
import cl.llavero.dto.UsuarioRequest;
import cl.llavero.dto.UsuarioResponse;
import cl.llavero.entity.EstadoReserva;
import cl.llavero.service.AdminService;
import cl.llavero.service.EmailService;
import cl.llavero.service.ReservaService;
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
    private final ReservaService reservaService;

    public AdminController(AdminService adminService, EmailService emailService, ReservaService reservaService) {
        this.adminService = adminService;
        this.emailService = emailService;
        this.reservaService = reservaService;
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

    @GetMapping("/reservas")
    public ResponseEntity<List<ReservaResponse>> listarReservas() {
        return ResponseEntity.ok(reservaService.listarTodas());
    }

    @PutMapping("/reservas/{id}/confirmar")
    public ResponseEntity<?> confirmarReserva(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(reservaService.cambiarEstado(id, EstadoReserva.confirmada));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/reservas/{id}/completar")
    public ResponseEntity<?> completarReserva(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(reservaService.cambiarEstado(id, EstadoReserva.completada));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/reservas/{id}/cancelar")
    public ResponseEntity<?> cancelarReserva(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(reservaService.cambiarEstado(id, EstadoReserva.cancelada));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
