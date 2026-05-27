package cl.llavero.controller;

import cl.llavero.dto.HabitacionPublicaResponse;
import cl.llavero.dto.HuespedLoginRequest;
import cl.llavero.dto.HuespedLoginResponse;
import cl.llavero.dto.HuespedRegisterRequest;
import cl.llavero.entity.Habitacion;
import cl.llavero.entity.EstadoHabitacion;
import cl.llavero.repository.HabitacionRepository;
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

    private final HabitacionRepository habitacionRepository;
    private final HuespedService huespedService;
    private final ReservaService reservaService;

    @Value("${app.registro.habilitado:true}")
    private boolean registroHabilitado;

    public PublicController(HabitacionRepository habitacionRepository,
                            HuespedService huespedService,
                            ReservaService reservaService) {
        this.habitacionRepository = habitacionRepository;
        this.huespedService = huespedService;
        this.reservaService = reservaService;
    }

    @GetMapping("/habitaciones")
    public ResponseEntity<List<HabitacionPublicaResponse>> listarHabitaciones() {
        List<HabitacionPublicaResponse> habitaciones = habitacionRepository
            .findByActivaTrueOrderByNumero()
            .stream()
            .filter(h -> h.getEstado() != EstadoHabitacion.deshabilitada)
            .map(HabitacionPublicaResponse::from)
            .toList();
        return ResponseEntity.ok(habitaciones);
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
}
