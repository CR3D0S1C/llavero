package cl.llavero.controller;

import cl.llavero.dto.DteQueueResponse;
import cl.llavero.service.DteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dte")
public class DteController {

    private final DteService dteService;

    public DteController(DteService dteService) {
        this.dteService = dteService;
    }

    @GetMapping("/pendientes")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<List<DteQueueResponse>> listarPendientes() {
        return ResponseEntity.ok(dteService.listarPendientes());
    }

    @GetMapping("/todos")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<List<DteQueueResponse>> listarTodos() {
        return ResponseEntity.ok(dteService.listarTodos());
    }

    @PutMapping("/{id}/emitido")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> marcarEmitido(@PathVariable String id) {
        try {
            return ResponseEntity.ok(dteService.marcarEmitido(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/error")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> marcarError(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(dteService.marcarError(id, body.get("mensaje")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
