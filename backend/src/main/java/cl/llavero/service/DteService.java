package cl.llavero.service;

import cl.llavero.dto.DteQueueResponse;
import cl.llavero.entity.DteQueue;
import cl.llavero.entity.EstadoDte;
import cl.llavero.entity.Venta;
import cl.llavero.repository.DteQueueRepository;
import cl.llavero.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DteService {

    private final DteQueueRepository dteQueueRepository;
    private final VentaRepository ventaRepository;

    public DteService(DteQueueRepository dteQueueRepository, VentaRepository ventaRepository) {
        this.dteQueueRepository = dteQueueRepository;
        this.ventaRepository = ventaRepository;
    }

    public List<DteQueueResponse> listarPendientes() {
        return dteQueueRepository.findByEstadoOrderByCreatedAtDesc(EstadoDte.pendiente)
                .stream()
                .map(this::mapear)
                .collect(Collectors.toList());
    }

    public List<DteQueueResponse> listarTodos() {
        return dteQueueRepository.findAll().stream()
                .map(this::mapear)
                .collect(Collectors.toList());
    }

    @Transactional
    public DteQueueResponse marcarEmitido(String dteId) {
        DteQueue dte = dteQueueRepository.findById(UUID.fromString(dteId))
                .orElseThrow(() -> new RuntimeException("DTE no encontrado"));
        dte.setEstado(EstadoDte.emitido);
        dte.setEmitidoAt(LocalDateTime.now());
        return mapear(dteQueueRepository.save(dte));
    }

    @Transactional
    public DteQueueResponse marcarError(String dteId, String mensaje) {
        DteQueue dte = dteQueueRepository.findById(UUID.fromString(dteId))
                .orElseThrow(() -> new RuntimeException("DTE no encontrado"));
        dte.setEstado(EstadoDte.error);
        dte.setErrorMsg(mensaje);
        return mapear(dteQueueRepository.save(dte));
    }

    private DteQueueResponse mapear(DteQueue d) {
        DteQueueResponse r = new DteQueueResponse();
        r.setId(d.getId().toString());
        r.setTipoDte(d.getTipoDte());
        r.setEstado(d.getEstado().name());
        r.setCreatedAt(d.getCreatedAt());
        r.setEmitidoAt(d.getEmitidoAt());

        if (d.getVenta() != null) {
            Venta v = d.getVenta();
            r.setVentaId(v.getId().toString());
            r.setTotal(v.getTotal());
            if (v.getHabitacion() != null) {
                r.setHabitacion(v.getHabitacion().getNumero() + " - " +
                        (v.getHabitacion().getTipo() != null ? v.getHabitacion().getTipo().getLabel() : ""));
            }
            if (v.getUsuario() != null) r.setCajero(v.getUsuario().getNombre());
            r.setReceptorRut(v.getReceptorRut());
            r.setReceptorRazon(v.getReceptorRazon());
            r.setReceptorGiro(v.getReceptorGiro());
            r.setReceptorDireccion(v.getReceptorDireccion());
            r.setReceptorComuna(v.getReceptorComuna());
            r.setReceptorCiudad(v.getReceptorCiudad());
            r.setReceptorEmail(v.getReceptorEmail());
        }

        return r;
    }
}
