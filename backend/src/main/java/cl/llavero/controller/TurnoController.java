package cl.llavero.controller;

import cl.llavero.dto.ArqueoRequest;
import cl.llavero.dto.ResumenTurnoResponse;
import cl.llavero.dto.TurnoResponse;
import cl.llavero.service.TurnoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/turnos")
public class TurnoController {

    private final TurnoService turnoService;

    public TurnoController(TurnoService turnoService) {
        this.turnoService = turnoService;
    }

    @GetMapping("/activo")
    public ResponseEntity<?> getActivo(Authentication auth) {
        try {
            return ResponseEntity.ok(turnoService.getActivo(auth.getName()));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("sin_turno", true));
        }
    }

    @GetMapping("/activo/resumen")
    public ResponseEntity<?> getResumen(Authentication auth) {
        try {
            ResumenTurnoResponse r = turnoService.getResumenActivo(auth.getName());
            return ResponseEntity.ok(r);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // El cierre ahora exige arqueo firmado con PIN
    @PostMapping("/cerrar")
    public ResponseEntity<?> cerrar(Authentication auth, @RequestBody ArqueoRequest arqueo) {
        try {
            TurnoResponse response = turnoService.cerrarConArqueo(auth.getName(), arqueo);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/hoy")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<List<TurnoResponse>> getTurnosHoy() {
        return ResponseEntity.ok(turnoService.getTurnosHoy());
    }
}
