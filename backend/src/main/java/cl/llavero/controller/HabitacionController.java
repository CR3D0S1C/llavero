package cl.llavero.controller;

import cl.llavero.dto.HabitacionCreateRequest;
import cl.llavero.dto.HabitacionLogResponse;
import cl.llavero.dto.HabitacionResponse;
import cl.llavero.dto.HabitacionUpdateRequest;
import cl.llavero.dto.TarifaTemporadaRequest;
import cl.llavero.dto.TipoHabitacionRequest;
import cl.llavero.entity.HabitacionFoto;
import cl.llavero.entity.TipoHabitacion;
import cl.llavero.service.FotoService;
import cl.llavero.service.HabitacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/habitaciones")
public class HabitacionController {

    private final HabitacionService habitacionService;
    private final FotoService fotoService;

    public HabitacionController(HabitacionService habitacionService, FotoService fotoService) {
        this.habitacionService = habitacionService;
        this.fotoService = fotoService;
    }

    @GetMapping
    public ResponseEntity<List<HabitacionResponse>> listar() {
        return ResponseEntity.ok(habitacionService.listar());
    }

    @GetMapping("/tipos")
    public ResponseEntity<List<TipoHabitacion>> listarTipos() {
        return ResponseEntity.ok(habitacionService.listarTipos());
    }

    @PostMapping("/tipos")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> crearTipo(@RequestBody TipoHabitacionRequest req) {
        try {
            return ResponseEntity.ok(habitacionService.crearTipo(req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/tipos/{id}")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> actualizarTipo(@PathVariable String id,
                                            @RequestBody TipoHabitacionRequest req) {
        try {
            return ResponseEntity.ok(habitacionService.actualizarTipo(id, req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/tipos/{id}")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> eliminarTipo(@PathVariable String id) {
        try {
            habitacionService.eliminarTipo(id);
            return ResponseEntity.ok(Map.of("mensaje", "Tipo eliminado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/tipos/{tipoId}/tarifas")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> crearTarifa(@PathVariable String tipoId,
                                         @RequestBody TarifaTemporadaRequest req) {
        try {
            return ResponseEntity.ok(habitacionService.crearTarifa(tipoId, req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/tipos/{tipoId}/tarifas/{tarifaId}")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> actualizarTarifa(@PathVariable String tipoId,
                                              @PathVariable UUID tarifaId,
                                              @RequestBody TarifaTemporadaRequest req) {
        try {
            return ResponseEntity.ok(habitacionService.actualizarTarifa(tipoId, tarifaId, req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/tipos/{tipoId}/tarifas/{tarifaId}")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> eliminarTarifa(@PathVariable String tipoId,
                                            @PathVariable UUID tarifaId) {
        try {
            habitacionService.eliminarTarifa(tipoId, tarifaId);
            return ResponseEntity.ok(Map.of("mensaje", "Tarifa eliminada"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Endpoint público: tarifa vigente para un tipo y rango de fechas
    @GetMapping("/tipos/{tipoId}/tarifa-vigente")
    public ResponseEntity<?> getTarifaVigente(@PathVariable String tipoId,
                                              @RequestParam String fechaEntrada,
                                              @RequestParam String fechaSalida) {
        try {
            LocalDate desde = LocalDate.parse(fechaEntrada);
            LocalDate hasta = LocalDate.parse(fechaSalida);
            return habitacionService.getTarifaVigente(tipoId, desde, hasta)
                .map(t -> ResponseEntity.ok(Map.of(
                    "aplicaTarifa", true,
                    "id", t.getId().toString(),
                    "label", t.getLabel(),
                    "precio", t.getPrecio(),
                    "fechaDesde", t.getFechaDesde().toString(),
                    "fechaHasta", t.getFechaHasta().toString()
                )))
                .orElse(ResponseEntity.ok(Map.of("aplicaTarifa", false)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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

    @PostMapping("/{id}/fotos")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> subirFoto(@PathVariable UUID id,
                                       @RequestParam("file") MultipartFile file,
                                       @RequestParam(defaultValue = "false") boolean esPortada) {
        try {
            HabitacionFoto foto = fotoService.guardar(id, file, esPortada);
            return ResponseEntity.ok(Map.of(
                "id", foto.getId(),
                "url", foto.getUrl(),
                "esPortada", foto.getEsPortada(),
                "orden", foto.getOrden()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/fotos/{fotoId}/portada")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> setPortada(@PathVariable UUID id, @PathVariable UUID fotoId) {
        try {
            var foto = fotoService.setPortada(fotoId);
            return ResponseEntity.ok(Map.of("id", foto.getId(), "esPortada", foto.getEsPortada()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/fotos/{fotoId}")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> eliminarFoto(@PathVariable UUID id, @PathVariable UUID fotoId) {
        try {
            fotoService.eliminar(fotoId);
            return ResponseEntity.ok(Map.of("mensaje", "Foto eliminada"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
