package cl.llavero.controller;

import cl.llavero.dto.ReservaRequest;
import cl.llavero.dto.ReservaResponse;
import cl.llavero.service.ReservaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/booking")
public class BookingController {

    private final ReservaService reservaService;

    public BookingController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    @PostMapping("/reservas")
    public ResponseEntity<?> crear(@RequestBody ReservaRequest req,
                                   @AuthenticationPrincipal String huespedId) {
        try {
            ReservaResponse resp = reservaService.crear(req, UUID.fromString(huespedId));
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/reservas")
    public ResponseEntity<List<ReservaResponse>> misReservas(
        @AuthenticationPrincipal String huespedId
    ) {
        return ResponseEntity.ok(reservaService.misReservas(UUID.fromString(huespedId)));
    }

    @DeleteMapping("/reservas/{id}")
    public ResponseEntity<?> cancelar(@PathVariable UUID id,
                                      @AuthenticationPrincipal String huespedId) {
        try {
            reservaService.cancelar(id, UUID.fromString(huespedId));
            return ResponseEntity.ok(Map.of("mensaje", "Reserva cancelada"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
