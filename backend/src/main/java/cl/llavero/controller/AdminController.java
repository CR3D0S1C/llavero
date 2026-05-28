package cl.llavero.controller;

import cl.llavero.dto.*;
import cl.llavero.entity.EstadoReserva;
import cl.llavero.service.AdminService;
import cl.llavero.service.EmailService;
import cl.llavero.service.ReservaService;
import cl.llavero.service.VentaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
    private final VentaService ventaService;

    public AdminController(AdminService adminService, EmailService emailService,
                           ReservaService reservaService, VentaService ventaService) {
        this.adminService = adminService;
        this.emailService = emailService;
        this.reservaService = reservaService;
        this.ventaService = ventaService;
    }

    @GetMapping("/metricas")
    public ResponseEntity<MetricasResponse> getMetricas() {
        return ResponseEntity.ok(adminService.getMetricas());
    }

    @GetMapping("/estadisticas")
    public ResponseEntity<OcupacionResponse> getEstadisticas() {
        return ResponseEntity.ok(adminService.getOcupacion());
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
    public ResponseEntity<?> crearUsuario(@RequestBody UsuarioRequest req) {
        try {
            return ResponseEntity.ok(adminService.crearUsuario(req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/usuarios/{id}")
    public ResponseEntity<?> editarUsuario(@PathVariable UUID id, @RequestBody UsuarioRequest req) {
        try {
            return ResponseEntity.ok(adminService.editarUsuario(id, req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
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

    @PostMapping("/reservas")
    public ResponseEntity<?> crearReserva(@RequestBody ReservaStaffRequest req) {
        try {
            return ResponseEntity.ok(reservaService.crearComoStaff(req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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

    @PostMapping("/reservas/{id}/checkin")
    public ResponseEntity<?> checkinReserva(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(reservaService.checkin(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Estadías activas ──────────────────────────────────────────────

    @GetMapping("/estadias")
    public ResponseEntity<List<VentaResponse>> getEstadiasActivas() {
        return ResponseEntity.ok(ventaService.getEstadiasActivas());
    }

    @PostMapping("/estadias/{ventaId}/cargo")
    public ResponseEntity<?> agregarCargo(@PathVariable UUID ventaId,
                                          @RequestBody AgregarCargoRequest req) {
        try {
            return ResponseEntity.ok(ventaService.agregarCargo(ventaId, req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/estadias/{ventaId}/checkout")
    public ResponseEntity<?> checkout(@PathVariable UUID ventaId,
                                      @RequestBody CheckoutRequest req,
                                      Authentication auth) {
        try {
            return ResponseEntity.ok(ventaService.checkout(ventaId, req, auth.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
