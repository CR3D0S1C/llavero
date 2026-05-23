package cl.llavero.service;

import cl.llavero.dto.HabitacionPrecioDto;
import cl.llavero.dto.HabitacionResponse;
import cl.llavero.dto.HabitacionUpdateRequest;
import cl.llavero.entity.EstadoHabitacion;
import cl.llavero.entity.Habitacion;
import cl.llavero.entity.HabitacionPrecio;
import cl.llavero.repository.HabitacionPrecioRepository;
import cl.llavero.repository.HabitacionRepository;
import cl.llavero.repository.VentaRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class HabitacionService {

    @Value("${llavero.clave.operaciones}")
    private String claveOperaciones;

    @Value("${llavero.clave.deshabilitar}")
    private String claveDeshabilitacion;

    private final HabitacionRepository habitacionRepository;
    private final HabitacionPrecioRepository precioRepository;
    private final VentaRepository ventaRepository;

    public HabitacionService(HabitacionRepository habitacionRepository,
                             HabitacionPrecioRepository precioRepository,
                             VentaRepository ventaRepository) {
        this.habitacionRepository = habitacionRepository;
        this.precioRepository = precioRepository;
        this.ventaRepository = ventaRepository;
    }

    public List<HabitacionResponse> listar() {
        return habitacionRepository.findByActivaTrueOrderByNumero()
                .stream()
                .map(this::mapear)
                .collect(Collectors.toList());
    }

    @Transactional
    public HabitacionResponse actualizar(String id, HabitacionUpdateRequest request) {
        Habitacion habitacion = habitacionRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Habitación no encontrada"));

        if (request.getEstado() != null) {
            habitacion.setEstado(EstadoHabitacion.valueOf(request.getEstado()));
        }
        if (request.getNota() != null) {
            habitacion.setNota(request.getNota());
        }
        if (request.getDescripcion() != null) {
            habitacion.setDescripcion(request.getDescripcion());
        }

        habitacionRepository.save(habitacion);

        if (request.getPrecios() != null && !request.getPrecios().isEmpty()) {
            precioRepository.deleteByHabitacionId(habitacion.getId());
            for (HabitacionPrecioDto dto : request.getPrecios()) {
                HabitacionPrecio precio = new HabitacionPrecio();
                precio.setHabitacion(habitacion);
                precio.setPersonas(dto.getPersonas());
                precio.setDuracion(dto.getDuracion());
                precio.setPrecio(dto.getPrecio());
                precioRepository.save(precio);
            }
        }

        return mapear(habitacionRepository.findById(habitacion.getId()).orElseThrow());
    }

    // Liberar directamente sin clave — solo jefe vía endpoint PUT /{id}
    @Transactional
    public HabitacionResponse liberar(String id) {
        Habitacion habitacion = habitacionRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Habitación no encontrada"));
        if (habitacion.getEstado() != EstadoHabitacion.ocupado) {
            throw new RuntimeException("La habitación no está ocupada");
        }
        habitacion.setEstado(EstadoHabitacion.libre);
        habitacion.setNota(null);
        habitacionRepository.save(habitacion);
        return mapear(habitacion);
    }

    // Cambio de estado con clave — cualquier rol autenticado
    @Transactional
    public HabitacionResponse cambiarEstadoClave(String id, String estadoDestino, String clave) {
        Habitacion h = habitacionRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Habitación no encontrada"));

        EstadoHabitacion destino = EstadoHabitacion.valueOf(estadoDestino);
        boolean transicionValida = false;

        if (claveOperaciones.equals(clave)) {
            // 1331: ocupado→libre, ocupado→aseo, aseo→libre, deshabilitada→libre
            transicionValida =
                (h.getEstado() == EstadoHabitacion.ocupado &&
                    (destino == EstadoHabitacion.libre || destino == EstadoHabitacion.aseo))
                || (h.getEstado() == EstadoHabitacion.aseo && destino == EstadoHabitacion.libre)
                || (h.getEstado() == EstadoHabitacion.deshabilitada && destino == EstadoHabitacion.libre);
        } else if (claveDeshabilitacion.equals(clave)) {
            // 1221: cualquier estado → deshabilitada
            transicionValida = destino == EstadoHabitacion.deshabilitada
                    && h.getEstado() != EstadoHabitacion.deshabilitada;
        } else {
            throw new RuntimeException("Clave incorrecta");
        }

        if (!transicionValida) {
            throw new RuntimeException("Transición no permitida: " + h.getEstado() + " → " + destino);
        }

        h.setEstado(destino);
        if (destino == EstadoHabitacion.libre) h.setNota(null);
        if (destino == EstadoHabitacion.aseo) h.setNota("En aseo");
        if (destino == EstadoHabitacion.deshabilitada) h.setNota(null);

        habitacionRepository.save(h);
        return mapear(h);
    }

    public HabitacionResponse mapear(Habitacion h) {
        HabitacionResponse r = new HabitacionResponse();
        r.setId(h.getId().toString());
        r.setNumero(h.getNumero());
        r.setEstado(h.getEstado().name());
        r.setNota(h.getNota());
        r.setDescripcion(h.getDescripcion());
        r.setActiva(h.getActiva());
        if (h.getTipo() != null) {
            r.setTipoId(h.getTipo().getId());
            r.setTipoLabel(h.getTipo().getLabel());
            r.setBano(h.getTipo().getBano());
            r.setColor(h.getTipo().getColor());
        }
        r.setPrecios(h.getPrecios().stream().map(p -> {
            HabitacionPrecioDto dto = new HabitacionPrecioDto();
            dto.setPersonas(p.getPersonas());
            dto.setDuracion(p.getDuracion());
            dto.setPrecio(p.getPrecio());
            return dto;
        }).collect(Collectors.toList()));

        // Incluir salida estimada para rooms ocupadas
        if (h.getEstado() == EstadoHabitacion.ocupado) {
            ventaRepository.findTopByHabitacionIdOrderByCreatedAtDesc(h.getId())
                    .ifPresent(v -> r.setSalidaEstimada(v.getSalidaEstimada()));
        }

        return r;
    }
}
