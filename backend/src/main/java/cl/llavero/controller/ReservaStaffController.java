package cl.llavero.controller;

import cl.llavero.dto.ReservaResponse;
import cl.llavero.service.ReservaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@PreAuthorize("hasAnyRole('JEFE', 'CAJERO')")
public class ReservaStaffController {

    private final ReservaService reservaService;

    public ReservaStaffController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    @GetMapping("/reservas/proximas")
    public ResponseEntity<List<ReservaResponse>> getProximas() {
        return ResponseEntity.ok(reservaService.getProximas());
    }
}
