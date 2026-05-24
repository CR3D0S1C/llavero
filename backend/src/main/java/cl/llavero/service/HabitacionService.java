package cl.llavero.service;

import cl.llavero.dto.HabitacionCreateRequest;
import cl.llavero.dto.HabitacionLogResponse;
import cl.llavero.dto.HabitacionPrecioDto;
import cl.llavero.dto.HabitacionResponse;
import cl.llavero.dto.HabitacionUpdateRequest;
import cl.llavero.entity.EstadoHabitacion;
import cl.llavero.entity.Habitacion;
import cl.llavero.entity.HabitacionLog;
import cl.llavero.entity.HabitacionPrecio;
import cl.llavero.entity.TipoHabitacion;
import cl.llavero.repository.HabitacionLogRepository;
import cl.llavero.repository.HabitacionPrecioRepository;
import cl.llavero.repository.HabitacionRepository;
import cl.llavero.repository.TipoHabitacionRepository;
import cl.llavero.repository.UsuarioRepository;
import cl.llavero.repository.VentaRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
    private final HabitacionLogRepository logRepository;
    private final UsuarioRepository usuarioRepository;
    private final TipoHabitacionRepository tipoRepository;

    public HabitacionService(HabitacionRepository habitacionRepository,
                             HabitacionPrecioRepository precioRepository,
                             VentaRepository ventaRepository,
                             HabitacionLogRepository logRepository,
                             UsuarioRepository usuarioRepository,
                             TipoHabitacionRepository tipoRepository) {
        this.habitacionRepository = habitacionRepository;
        this.precioRepository = precioRepository;
        this.ventaRepository = ventaRepository;
        this.logRepository = logRepository;
        this.usuarioRepository = usuarioRepository;
        this.tipoRepository = tipoRepository;
    }

    private void registrarLog(Habitacion h, String anterior, String nuevo) {
        String nombre = "Sistema";
        try {
            String principal = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            nombre = usuarioRepository.findById(UUID.fromString(principal))
                    .map(u -> u.getNombre()).orElse("Sistema");
        } catch (Exception ignored) {}
        HabitacionLog log = new HabitacionLog();
        log.setHabitacion(h);
        log.setEstadoAnterior(anterior);
        log.setEstadoNuevo(nuevo);
        log.setUsuarioNombre(nombre);
        logRepository.save(log);
    }

    public List<HabitacionResponse> listar() {
        return habitacionRepository.findByActivaTrueOrderByNumero()
                .stream()
                .map(this::mapear)
                .collect(Collectors.toList());
    }

    public List<TipoHabitacion> listarTipos() {
        return tipoRepository.findAll();
    }

    @Transactional
    public HabitacionResponse crear(HabitacionCreateRequest req) {
        if (req.getNumero() == null || req.getNumero().isBlank()) {
            throw new RuntimeException("El número es obligatorio");
        }
        TipoHabitacion tipo = null;
        if (req.getTipoId() != null && !req.getTipoId().isBlank()) {
            tipo = tipoRepository.findById(req.getTipoId())
                    .orElseThrow(() -> new RuntimeException("Tipo de habitación no encontrado"));
        }
        Habitacion h = new Habitacion();
        h.setNumero(req.getNumero().trim());
        h.setTipo(tipo);
        h.setDescripcion(req.getDescripcion());
        h.setEstado(EstadoHabitacion.libre);
        h.setActiva(true);
        h = habitacionRepository.save(h);

        if (req.getPrecios() != null) {
            for (HabitacionPrecioDto dto : req.getPrecios()) {
                HabitacionPrecio precio = new HabitacionPrecio();
                precio.setHabitacion(h);
                precio.setPersonas(dto.getPersonas());
                precio.setDuracion(dto.getDuracion());
                precio.setPrecio(dto.getPrecio());
                precioRepository.save(precio);
            }
        }
        registrarLog(h, "—", "creada");
        return mapear(habitacionRepository.findById(h.getId()).orElseThrow());
    }

    @Transactional
    public void eliminar(String id) {
        Habitacion h = habitacionRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Habitación no encontrada"));
        if (h.getEstado() == EstadoHabitacion.ocupado) {
            throw new RuntimeException("No se puede eliminar una habitación ocupada");
        }
        h.setActiva(false);
        habitacionRepository.save(h);
        registrarLog(h, h.getEstado().name(), "eliminada");
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
        String anterior = habitacion.getEstado().name();
        habitacion.setEstado(EstadoHabitacion.libre);
        habitacion.setNota(null);
        habitacionRepository.save(habitacion);
        registrarLog(habitacion, anterior, "libre");
        return mapear(habitacion);
    }

    // Cambio de estado directo para jefe — sin clave, cualquier transición
    @Transactional
    public HabitacionResponse cambiarEstadoJefe(String id, String nuevoEstado) {
        Habitacion h = habitacionRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Habitación no encontrada"));
        String anterior = h.getEstado().name();
        EstadoHabitacion destino = EstadoHabitacion.valueOf(nuevoEstado);
        h.setEstado(destino);
        if (destino == EstadoHabitacion.libre)        h.setNota(null);
        if (destino == EstadoHabitacion.aseo)         h.setNota("En aseo");
        if (destino == EstadoHabitacion.deshabilitada) h.setNota(null);
        habitacionRepository.save(h);
        registrarLog(h, anterior, nuevoEstado);
        return mapear(h);
    }

    public List<HabitacionLogResponse> getLogs() {
        DateTimeFormatter fFecha = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter fHora  = DateTimeFormatter.ofPattern("HH:mm");
        return logRepository.findTop100ByOrderByCreatedAtDesc().stream().map(l -> {
            HabitacionLogResponse r = new HabitacionLogResponse();
            r.setHabitacionNumero(l.getHabitacion() != null ? l.getHabitacion().getNumero() : "—");
            r.setHabitacionTipo(l.getHabitacion() != null && l.getHabitacion().getTipo() != null
                    ? l.getHabitacion().getTipo().getLabel() : "");
            r.setEstadoAnterior(l.getEstadoAnterior());
            r.setEstadoNuevo(l.getEstadoNuevo());
            r.setUsuarioNombre(l.getUsuarioNombre());
            r.setFecha(l.getCreatedAt().format(fFecha));
            r.setHora(l.getCreatedAt().format(fHora));
            return r;
        }).collect(Collectors.toList());
    }

    // Cambio de estado con clave — cualquier rol autenticado
    @Transactional
    public HabitacionResponse cambiarEstadoClave(String id, String estadoDestino, String clave) {
        Habitacion h = habitacionRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Habitación no encontrada"));

        String estadoAnterior = h.getEstado().name();
        EstadoHabitacion destino = EstadoHabitacion.valueOf(estadoDestino);
        boolean transicionValida = false;

        if (claveOperaciones.equals(clave)) {
            // 1331: ocupado→aseo, aseo→libre, deshabilitada→libre
            // ocupado→libre NO está permitido: debe pasar por aseo primero (o anular la venta)
            transicionValida =
                (h.getEstado() == EstadoHabitacion.ocupado && destino == EstadoHabitacion.aseo)
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
        registrarLog(h, estadoAnterior, estadoDestino);
        return mapear(h);
    }

    // Llamado por el scheduler: pasa a aseo toda habitación ocupada cuya salida
    // estimada superó hace más de 30 minutos
    @Transactional
    public void autoAseoVencidas() {
        LocalDateTime limite = LocalDateTime.now().minusMinutes(30);
        habitacionRepository.findByEstadoAndActivaTrue(EstadoHabitacion.ocupado).forEach(h ->
            ventaRepository.findTopByHabitacionIdOrderByCreatedAtDesc(h.getId()).ifPresent(v -> {
                if (v.getSalidaEstimada() != null && v.getSalidaEstimada().isBefore(limite)) {
                    h.setEstado(EstadoHabitacion.aseo);
                    h.setNota("Aseo automático — tiempo de uso vencido");
                    habitacionRepository.save(h);
                    registrarLog(h, "ocupado", "aseo");
                }
            })
        );
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
