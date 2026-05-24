package cl.llavero.controller;

import cl.llavero.dto.HabitacionCreateRequest;
import cl.llavero.dto.HabitacionLogResponse;
import cl.llavero.dto.HabitacionResponse;
import cl.llavero.dto.HabitacionUpdateRequest;
import cl.llavero.entity.TipoHabitacion;
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

    @GetMapping("/tipos")
    public ResponseEntity<List<TipoHabitacion>> listarTipos() {
        return ResponseEntity.ok(habitacionService.listarTipos());
    }

    @GetMapping("/buscar/{codigo}")
    public ResponseEntity<?> buscarPorCodigo(@PathVariable String codigo) {
        try {
            return ResponseEntity.ok(habitacionService.buscarPorCodigo(codigo));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> crear(@RequestBody HabitacionCreateRequest req) {
        try {
            return ResponseEntity.ok(habitacionService.crear(req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> eliminar(@PathVariable String id) {
        try {
            habitacionService.eliminar(id);
            return ResponseEntity.ok(Map.of("mensaje", "Habitación desactivada"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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

    // Cambiar estado con clave — disponible para cualquier rol autenticado
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

    // Cambio de estado directo para jefe — sin clave
    @PutMapping("/{id}/estado")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> cambiarEstado(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(habitacionService.cambiarEstadoJefe(id, body.get("estado")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Log de cambios de estado — solo jefe
    @GetMapping("/log")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<List<HabitacionLogResponse>> log() {
        return ResponseEntity.ok(habitacionService.getLogs());
    }
}
