package cl.llavero.service;

import cl.llavero.dto.TurnoResponse;
import cl.llavero.dto.VentaResponse;
import cl.llavero.entity.Turno;
import cl.llavero.repository.TurnoRepository;
import cl.llavero.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TurnoService {

    private final TurnoRepository turnoRepository;
    private final VentaService ventaService;
    private final VentaRepository ventaRepository;

    public TurnoService(TurnoRepository turnoRepository,
                        VentaService ventaService,
                        VentaRepository ventaRepository) {
        this.turnoRepository = turnoRepository;
        this.ventaService = ventaService;
        this.ventaRepository = ventaRepository;
    }

    public TurnoResponse getActivo(String usuarioId) {
        Turno turno = turnoRepository.findByUsuarioIdAndCerradoFalse(UUID.fromString(usuarioId))
                .orElseThrow(() -> new RuntimeException("No hay turno activo"));
        return mapear(turno, true);
    }

    @Transactional
    public TurnoResponse cerrar(String usuarioId) {
        Turno turno = turnoRepository.findByUsuarioIdAndCerradoFalse(UUID.fromString(usuarioId))
                .orElseThrow(() -> new RuntimeException("No hay turno activo"));
        turno.setCerrado(true);
        turno.setFin(LocalDateTime.now());
        turnoRepository.save(turno);
        return mapear(turno, true);
    }

    public List<TurnoResponse> getTurnosHoy() {
        LocalDateTime inicio = LocalDate.now().atStartOfDay();
        return turnoRepository.findTurnosDesde(inicio)
                .stream()
                .map(t -> mapear(t, false))
                .collect(Collectors.toList());
    }

    private TurnoResponse mapear(Turno t, boolean incluirVentas) {
        TurnoResponse r = new TurnoResponse();
        r.setId(t.getId().toString());
        r.setInicio(t.getInicio());
        r.setFin(t.getFin());
        r.setCerrado(t.getCerrado());
        r.setTotalTurno(t.getTotalTurno());
        if (t.getUsuario() != null) {
            r.setUsuarioId(t.getUsuario().getId().toString());
            r.setCajero(t.getUsuario().getNombre());
        }
        if (incluirVentas) {
            List<VentaResponse> ventas = ventaRepository.findByTurnoIdOrderByCreatedAtDesc(t.getId())
                    .stream()
                    .map(ventaService::mapear)
                    .collect(Collectors.toList());
            r.setVentas(ventas);
        }
        return r;
    }
}
