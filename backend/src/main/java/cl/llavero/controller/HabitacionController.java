package cl.llavero.controller;

import cl.llavero.dto.HabitacionResponse;
import cl.llavero.dto.HabitacionUpdateRequest;
import cl.llavero.service.HabitacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/habitaciones")
public class HabitacionController {

    private final HabitacionService habitacionService;

    public HabitacionController(HabitacionService habitacionService) {
        this.habitacionService = habitacionService;
    }

    @GetMapping
    public ResponseEntity<List<HabitacionResponse>> listar() {
        return ResponseEntity.ok(habitacionService.listar());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> actualizar(@PathVariable String id,
                                        @RequestBody HabitacionUpdateRequest request) {
        try {
            return ResponseEntity.ok(habitacionService.actualizar(id, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Liberar directo — solo jefe (sin clave)
    @PutMapping("/{id}/liberar")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> liberar(@PathVariable String id) {
        try {
            return ResponseEntity.ok(habitacionService.liberar(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Cambiar estado con clave 1331 — disponible para cualquier rol autenticado
    @PutMapping("/{id}/operar")
    public ResponseEntity<?> operar(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(
                habitacionService.cambiarEstadoClave(id, body.get("estado"), body.get("clave"))
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
