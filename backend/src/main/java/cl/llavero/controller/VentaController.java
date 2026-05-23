package cl.llavero.controller;

import cl.llavero.dto.VentaRequest;
import cl.llavero.dto.VentaResponse;
import cl.llavero.service.VentaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ventas")
public class VentaController {

    private final VentaService ventaService;

    public VentaController(VentaService ventaService) {
        this.ventaService = ventaService;
    }

    @GetMapping
    public ResponseEntity<List<VentaResponse>> listar(
            @RequestParam(required = false) String turno,
            @RequestParam(required = false) String periodo,
            Authentication auth) {
        String usuarioId = auth.getName();
        String rol = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst().orElse("").replace("ROLE_", "");
        return ResponseEntity.ok(ventaService.listar(turno, periodo, usuarioId, rol));
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody VentaRequest request, Authentication auth) {
        try {
            String usuarioId = auth.getName();
            VentaResponse response = ventaService.crear(request, usuarioId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> eliminar(@PathVariable String id) {
        try {
            ventaService.eliminar(id);
            return ResponseEntity.ok(Map.of("mensaje", "Venta eliminada"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Anular con clave maestra 1271 — cualquier rol autenticado
    @PostMapping("/{id}/anular")
    public ResponseEntity<?> anular(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            ventaService.anular(id, body.get("clave"));
            return ResponseEntity.ok(Map.of("mensaje", "Venta anulada"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
