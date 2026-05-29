package cl.llavero.controller;

import cl.llavero.entity.AsignacionAseo;
import cl.llavero.entity.EstadoHabitacion;
import cl.llavero.entity.Habitacion;
import cl.llavero.entity.Rol;
import cl.llavero.entity.Usuario;
import cl.llavero.repository.AsignacionAseoRepository;
import cl.llavero.repository.HabitacionRepository;
import cl.llavero.repository.UsuarioRepository;
import cl.llavero.service.HabitacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/aseo")
public class AseoController {

    private final AsignacionAseoRepository asignacionRepo;
    private final HabitacionRepository habitacionRepo;
    private final UsuarioRepository usuarioRepo;
    private final HabitacionService habitacionService;

    public AseoController(AsignacionAseoRepository asignacionRepo,
                          HabitacionRepository habitacionRepo,
                          UsuarioRepository usuarioRepo,
                          HabitacionService habitacionService) {
        this.asignacionRepo  = asignacionRepo;
        this.habitacionRepo  = habitacionRepo;
        this.usuarioRepo     = usuarioRepo;
        this.habitacionService = habitacionService;
    }

    private static final List<Rol> ROLES_ASEO = List.of(Rol.aseo, Rol.cajero, Rol.jefe);

    // ── Personal elegible para aseo (aseo + cajero + jefe) ──────────────────

    @GetMapping("/personal")
    @PreAuthorize("hasAnyRole('JEFE','ASEO')")
    public ResponseEntity<?> getPersonal() {
        List<Map<String, Object>> personal = usuarioRepo.findByRolInAndActivoTrueOrderByNombre(ROLES_ASEO)
            .stream().map(u -> Map.<String, Object>of(
                "id", u.getId().toString(),
                "nombre", u.getNombre(),
                "rol", u.getRol().name()
            )).collect(Collectors.toList());
        return ResponseEntity.ok(personal);
    }

    // ── Panel del jefe: todas las habitaciones relevantes + asignaciones ─────

    @GetMapping("/panel")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> getPanel(@RequestParam(defaultValue = "") String fecha) {
        LocalDate dia = fecha.isBlank() ? LocalDate.now() : LocalDate.parse(fecha);

        // Habitaciones activas en estado aseo u ocupado
        List<Habitacion> habitaciones = habitacionRepo.findByActivaTrueOrderByNumero()
            .stream()
            .filter(h -> h.getEstado() == EstadoHabitacion.aseo
                      || h.getEstado() == EstadoHabitacion.ocupado)
            .collect(Collectors.toList());

        // Asignaciones de ese día
        List<AsignacionAseo> asignaciones = asignacionRepo.findByFechaOrderByMucamaNombreAsc(dia);

        // Map: habitacionId → asignacion
        Map<UUID, AsignacionAseo> asigMap = asignaciones.stream()
            .collect(Collectors.toMap(a -> a.getHabitacion().getId(), a -> a, (a, b) -> a));

        // Añadir habitaciones que tienen asignación pero no están en aseo/ocupado
        Set<UUID> habIds = habitaciones.stream().map(Habitacion::getId).collect(Collectors.toSet());
        asignaciones.forEach(a -> {
            if (!habIds.contains(a.getHabitacion().getId())) {
                habitaciones.add(a.getHabitacion());
            }
        });

        // Personal de aseo con sus stats (aseo + cajero + jefe)
        List<Usuario> mucamas = usuarioRepo.findByRolInAndActivoTrueOrderByNombre(ROLES_ASEO);
        Map<UUID, List<AsignacionAseo>> porMucama = asignaciones.stream()
            .collect(Collectors.groupingBy(a -> a.getMucama().getId()));

        List<Map<String, Object>> personalStats = mucamas.stream().map(m -> {
            List<AsignacionAseo> suyas = porMucama.getOrDefault(m.getId(), List.of());
            long completadas = suyas.stream().filter(a -> "completado".equals(a.getEstado())).count();
            long enProceso   = suyas.stream().filter(a -> "en_proceso".equals(a.getEstado())).count();
            long pendientes  = suyas.stream().filter(a -> "pendiente".equals(a.getEstado())).count();
            Map<String, Object> r = new HashMap<>();
            r.put("id", m.getId().toString());
            r.put("nombre", m.getNombre());
            r.put("total", suyas.size());
            r.put("completadas", completadas);
            r.put("enProceso", enProceso);
            r.put("pendientes", pendientes);
            return r;
        }).collect(Collectors.toList());

        // Habitaciones serializadas
        List<Map<String, Object>> habsOut = habitaciones.stream().map(h -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", h.getId().toString());
            m.put("numero", h.getNumero());
            m.put("tipoLabel", h.getTipo() != null ? h.getTipo().getLabel() : "");
            m.put("color", h.getTipo() != null ? h.getTipo().getColor() : "#6B6057");
            m.put("estado", h.getEstado().name());
            AsignacionAseo asig = asigMap.get(h.getId());
            if (asig != null) {
                Map<String, Object> a = new HashMap<>();
                a.put("id", asig.getId().toString());
                a.put("mucamaId", asig.getMucama().getId().toString());
                a.put("mucamaNombre", asig.getMucama().getNombre());
                a.put("tipoAseo", asig.getTipoAseo());
                a.put("estado", asig.getEstado());
                a.put("notas", asig.getNotas());
                m.put("asignacion", a);
            } else {
                m.put("asignacion", null);
            }
            return m;
        }).sorted(Comparator.comparing(x -> (String) x.get("numero")))
          .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
            "fecha", dia.toString(),
            "personal", personalStats,
            "habitaciones", habsOut
        ));
    }

    // ── CRUD asignaciones (jefe) ─────────────────────────────────────────────

    @PostMapping("/asignaciones")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> crearAsignacion(@RequestBody Map<String, String> body) {
        try {
            UUID habId   = UUID.fromString(body.get("habitacionId"));
            UUID mucamaId = UUID.fromString(body.get("mucamaId"));
            LocalDate dia = body.containsKey("fecha") && !body.get("fecha").isBlank()
                ? LocalDate.parse(body.get("fecha")) : LocalDate.now();

            // Verifica que no haya una asignación activa para esa habitación ese día
            if (asignacionRepo.findActivaByHabitacionIdAndFecha(habId, dia).isPresent())
                return ResponseEntity.badRequest().body(Map.of("error", "La habitación ya tiene una asignación activa para ese día"));

            Habitacion hab = habitacionRepo.findById(habId)
                .orElseThrow(() -> new IllegalArgumentException("Habitación no encontrada"));
            Usuario mucama = usuarioRepo.findById(mucamaId)
                .orElseThrow(() -> new IllegalArgumentException("Personal no encontrado"));
            if (!ROLES_ASEO.contains(mucama.getRol()))
                return ResponseEntity.badRequest().body(Map.of("error", "El usuario no puede realizar aseo"));

            AsignacionAseo a = new AsignacionAseo();
            a.setHabitacion(hab);
            a.setMucama(mucama);
            a.setFecha(dia);
            a.setTipoAseo(body.getOrDefault("tipoAseo", "completo"));
            a.setNotas(body.get("notas"));
            asignacionRepo.save(a);

            return ResponseEntity.ok(Map.of(
                "id", a.getId().toString(),
                "mucamaNombre", mucama.getNombre(),
                "tipoAseo", a.getTipoAseo(),
                "estado", a.getEstado()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/asignaciones/{id}")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> actualizarAsignacion(@PathVariable UUID id,
                                                   @RequestBody Map<String, String> body) {
        try {
            AsignacionAseo a = asignacionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asignación no encontrada"));
            if ("completado".equals(a.getEstado()))
                return ResponseEntity.badRequest().body(Map.of("error", "No se puede modificar una asignación completada"));

            if (body.containsKey("mucamaId")) {
                Usuario mucama = usuarioRepo.findById(UUID.fromString(body.get("mucamaId")))
                    .orElseThrow(() -> new IllegalArgumentException("Mucama no encontrada"));
                a.setMucama(mucama);
            }
            if (body.containsKey("tipoAseo")) a.setTipoAseo(body.get("tipoAseo"));
            if (body.containsKey("notas"))    a.setNotas(body.get("notas"));
            asignacionRepo.save(a);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/asignaciones/{id}")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> eliminarAsignacion(@PathVariable UUID id) {
        try {
            AsignacionAseo a = asignacionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asignación no encontrada"));
            asignacionRepo.delete(a);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Endpoints de la mucama ───────────────────────────────────────────────

    @GetMapping("/mis-asignaciones")
    @PreAuthorize("hasAnyRole('ASEO','JEFE')")
    public ResponseEntity<?> getMisAsignaciones(@RequestParam(defaultValue = "") String fecha) {
        LocalDate dia = fecha.isBlank() ? LocalDate.now() : LocalDate.parse(fecha);
        String principalId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID mucamaId = UUID.fromString(principalId);

        List<Map<String, Object>> result = asignacionRepo
            .findByMucamaIdAndFechaOrderByCreadoAtAsc(mucamaId, dia)
            .stream().map(a -> {
                Habitacion h = a.getHabitacion();
                Map<String, Object> m = new HashMap<>();
                m.put("id", a.getId().toString());
                m.put("habitacionId", h.getId().toString());
                m.put("numero", h.getNumero());
                m.put("tipoLabel", h.getTipo() != null ? h.getTipo().getLabel() : "");
                m.put("color", h.getTipo() != null ? h.getTipo().getColor() : "#6B6057");
                m.put("estadoHabitacion", h.getEstado().name());
                m.put("tipoAseo", a.getTipoAseo());
                m.put("estado", a.getEstado());
                m.put("notas", a.getNotas());
                m.put("iniciadoAt", a.getIniciadoAt() != null ? a.getIniciadoAt().toString() : null);
                m.put("completadoAt", a.getCompletadoAt() != null ? a.getCompletadoAt().toString() : null);
                return m;
            }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PutMapping("/asignaciones/{id}/iniciar")
    @PreAuthorize("hasAnyRole('ASEO','JEFE')")
    public ResponseEntity<?> iniciar(@PathVariable UUID id) {
        try {
            AsignacionAseo a = asignacionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asignación no encontrada"));
            if (!"pendiente".equals(a.getEstado()))
                return ResponseEntity.badRequest().body(Map.of("error", "La asignación no está pendiente"));
            a.setEstado("en_proceso");
            a.setIniciadoAt(LocalDateTime.now());
            asignacionRepo.save(a);
            return ResponseEntity.ok(Map.of("estado", "en_proceso"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/asignaciones/{id}/completar")
    @PreAuthorize("hasAnyRole('ASEO','JEFE')")
    public ResponseEntity<?> completar(@PathVariable UUID id) {
        try {
            AsignacionAseo a = asignacionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Asignación no encontrada"));
            if ("completado".equals(a.getEstado()))
                return ResponseEntity.badRequest().body(Map.of("error", "Ya está completada"));

            a.setEstado("completado");
            a.setCompletadoAt(LocalDateTime.now());
            asignacionRepo.save(a);

            // Si es aseo completo y la habitación está en estado aseo → marcar libre
            if ("completo".equals(a.getTipoAseo())) {
                Habitacion h = a.getHabitacion();
                if (h.getEstado() == EstadoHabitacion.aseo) {
                    String operador = a.getMucama().getNombre();
                    habitacionService.completarAseo(h.getId(), operador);
                }
            }
            return ResponseEntity.ok(Map.of("estado", "completado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
