package cl.llavero.controller;

import cl.llavero.dto.HabitacionPublicaResponse;
import cl.llavero.dto.HuespedLoginRequest;
import cl.llavero.dto.HuespedLoginResponse;
import cl.llavero.dto.HuespedRegisterRequest;
import cl.llavero.dto.ReservaInvitadoRequest;
import cl.llavero.dto.ReservaResponse;
import cl.llavero.entity.Habitacion;
import cl.llavero.entity.EstadoHabitacion;
import cl.llavero.repository.HabitacionRepository;
import cl.llavero.repository.ReservaRepository;
import cl.llavero.service.HuespedService;
import cl.llavero.service.ReservaService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private static final int ESTACIONAMIENTOS_TOTALES = 4;

    private final HabitacionRepository habitacionRepository;
    private final ReservaRepository reservaRepository;
    private final HuespedService huespedService;
    private final ReservaService reservaService;

    @Value("${app.registro.habilitado:true}")
    private boolean registroHabilitado;

    public PublicController(HabitacionRepository habitacionRepository,
                            ReservaRepository reservaRepository,
                            HuespedService huespedService,
                            ReservaService reservaService) {
        this.habitacionRepository = habitacionRepository;
        this.reservaRepository = reservaRepository;
        this.huespedService = huespedService;
        this.reservaService = reservaService;
    }

    @GetMapping("/habitaciones")
    public ResponseEntity<List<HabitacionPublicaResponse>> listarHabitaciones(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaEntrada,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaSalida,
        @RequestParam(required = false) Integer personas
    ) {
        boolean filtrarFechas = fechaEntrada != null && fechaSalida != null && fechaEntrada.isBefore(fechaSalida);

        List<UUID> ocupadas = filtrarFechas
            ? reservaRepository.findHabitacionIdsOcupadas(fechaEntrada, fechaSalida)
            : List.of();

        List<HabitacionPublicaResponse> habitaciones = habitacionRepository
            .findByActivaTrueOrderByNumero()
            .stream()
            .filter(h -> h.getEstado() != EstadoHabitacion.deshabilitada)
            .filter(h -> !filtrarFechas || !ocupadas.contains(h.getId()))
            .filter(h -> personas == null || h.getCapacidadMax() == null || h.getCapacidadMax() >= personas)
            .map(HabitacionPublicaResponse::from)
            .toList();
        return ResponseEntity.ok(habitaciones);
    }

    @GetMapping("/estacionamiento")
    public ResponseEntity<Map<String, Object>> estacionamiento(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaEntrada,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaSalida
    ) {
        long reservados = 0;
        if (fechaEntrada.isBefore(fechaSalida)) {
            reservados = reservaRepository.countEstacionamientoSolapadas(fechaEntrada, fechaSalida);
        }
        long disponibles = Math.max(0L, ESTACIONAMIENTOS_TOTALES - reservados);
        return ResponseEntity.ok(Map.of(
            "total", ESTACIONAMIENTOS_TOTALES,
            "reservados", reservados,
            "disponibles", disponibles
        ));
    }

    @GetMapping("/habitaciones/{id}")
    public ResponseEntity<?> getHabitacion(@PathVariable UUID id) {
        return habitacionRepository.findById(id)
            .filter(Habitacion::getActiva)
            .map(h -> ResponseEntity.ok(HabitacionPublicaResponse.from(h)))
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/disponibilidad")
    public ResponseEntity<Map<String, Object>> verificarDisponibilidad(
        @RequestParam UUID habitacionId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaEntrada,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaSalida
    ) {
        boolean disponible = reservaService.estaDisponible(habitacionId, fechaEntrada, fechaSalida);
        return ResponseEntity.ok(Map.of("disponible", disponible));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registrar(@RequestBody HuespedRegisterRequest req) {
        if (!registroHabilitado)
            return ResponseEntity.status(503).body(Map.of("error", "El registro está temporalmente deshabilitado. Contáctanos directamente."));
        try {
            HuespedLoginResponse resp = huespedService.registrar(req);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody HuespedLoginRequest req) {
        try {
            HuespedLoginResponse resp = huespedService.login(req);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reservas")
    public ResponseEntity<?> crearReservaInvitado(@RequestBody ReservaInvitadoRequest req) {
        try {
            ReservaResponse resp = reservaService.crearComoInvitado(req);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
