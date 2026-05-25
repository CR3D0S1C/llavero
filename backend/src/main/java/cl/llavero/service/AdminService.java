package cl.llavero.service;

import cl.llavero.dto.EstadoActualResponse;
import cl.llavero.dto.MetricasResponse;
import cl.llavero.dto.UsuarioRequest;
import cl.llavero.dto.UsuarioResponse;
import cl.llavero.entity.*;
import cl.llavero.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final VentaRepository ventaRepository;
    private final HabitacionRepository habitacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final TurnoRepository turnoRepository;
    private final DteQueueRepository dteQueueRepository;

    public AdminService(VentaRepository ventaRepository,
                        HabitacionRepository habitacionRepository,
                        UsuarioRepository usuarioRepository,
                        TurnoRepository turnoRepository,
                        DteQueueRepository dteQueueRepository) {
        this.ventaRepository = ventaRepository;
        this.habitacionRepository = habitacionRepository;
        this.usuarioRepository = usuarioRepository;
        this.turnoRepository = turnoRepository;
        this.dteQueueRepository = dteQueueRepository;
    }

    public MetricasResponse getMetricas() {
        List<Venta> todas = ventaRepository.findAllOrderByCreatedAtDesc();
        List<Venta> hoy = ventaRepository.findByFecha(LocalDate.now());
        List<Venta> semana = ventaRepository.findByFechaDesde(LocalDate.now().minusDays(7));
        List<Habitacion> habitaciones = habitacionRepository.findByActivaTrueOrderByNumero();

        MetricasResponse r = new MetricasResponse();
        r.setTotalHoy(sumar(hoy));
        r.setTotalSemana(sumar(semana));
        r.setTotalGeneral(sumar(todas));
        r.setVentasHoy((long) hoy.size());
        r.setVentasSemana((long) semana.size());
        r.setVentasTotal((long) todas.size());

        Map<String, Long> porEstado = habitaciones.stream()
                .collect(Collectors.groupingBy(h -> h.getEstado().name(), Collectors.counting()));
        for (EstadoHabitacion e : EstadoHabitacion.values()) {
            porEstado.putIfAbsent(e.name(), 0L);
        }
        r.setHabitacionesPorEstado(porEstado);
        return r;
    }

    public EstadoActualResponse getEstadoActual() {
        LocalDateTime inicioDia = LocalDate.now().atStartOfDay();

        // Turnos activos ahora
        List<Turno> turnosActivos = turnoRepository.findTurnosDesde(inicioDia)
                .stream().filter(t -> !t.getCerrado()).toList();

        List<EstadoActualResponse.TurnoActivoDto> turnosDtos = turnosActivos.stream().map(t -> {
            List<Venta> ventas = ventaRepository.findByTurnoIdOrderByCreatedAtDesc(t.getId());
            var dto = new EstadoActualResponse.TurnoActivoDto();
            dto.setCajeroNombre(t.getUsuario() != null ? t.getUsuario().getNombre() : "—");
            dto.setInicio(t.getInicio());
            dto.setTotalTurno(t.getTotalTurno() != null ? t.getTotalTurno() : BigDecimal.ZERO);
            dto.setCantidadVentas(ventas.size());
            return dto;
        }).toList();

        // Total del día (todos los turnos, abiertos y cerrados)
        List<Venta> ventasHoy = ventaRepository.findByFecha(LocalDate.now());
        BigDecimal totalDia = sumar(ventasHoy);

        // Habitaciones ocupadas ahora
        List<Habitacion> ocupadas = habitacionRepository.findByEstadoAndActivaTrue(EstadoHabitacion.ocupado);
        List<EstadoActualResponse.HabitacionOcupadaDto> habsDtos = ocupadas.stream().map(h -> {
            var dto = new EstadoActualResponse.HabitacionOcupadaDto();
            dto.setNumero(h.getNumero());
            dto.setTipo(h.getTipo() != null ? h.getTipo().getLabel() : "Habitación");
            // Buscar la venta activa para obtener salida estimada
            ventaRepository.findTopByHabitacionIdOrderByCreatedAtDesc(h.getId()).ifPresent(v -> {
                dto.setSalidaEstimada(v.getSalidaEstimada());
                dto.setVencida(v.getSalidaEstimada() != null && v.getSalidaEstimada().isBefore(LocalDateTime.now()));
            });
            return dto;
        }).toList();

        // Cajeros sin turno activo hoy
        Set<UUID> conTurno = turnosActivos.stream()
                .filter(t -> t.getUsuario() != null)
                .map(t -> t.getUsuario().getId())
                .collect(Collectors.toSet());
        List<String> sinTurno = usuarioRepository.findAll().stream()
                .filter(u -> u.getActivo() && !conTurno.contains(u.getId()))
                .map(Usuario::getNombre)
                .sorted()
                .toList();

        // DTEs pendientes
        int dtePendientes = dteQueueRepository.findByEstadoOrderByCreatedAtDesc(EstadoDte.pendiente).size();

        EstadoActualResponse r = new EstadoActualResponse();
        r.setTotalDia(totalDia);
        r.setVentasDia(ventasHoy.size());
        r.setTurnosActivos(turnosDtos);
        r.setHabitacionesOcupadas(habsDtos);
        r.setCajerosSinTurno(sinTurno);
        r.setDtePendientes(dtePendientes);
        return r;
    }

    public List<UsuarioResponse> getUsuarios() {
        return usuarioRepository.findAll().stream()
                .sorted((a, b) -> a.getNombre().compareToIgnoreCase(b.getNombre()))
                .map(UsuarioResponse::new)
                .toList();
    }

    public UsuarioResponse crearUsuario(UsuarioRequest req) {
        if (req.getPin() == null || req.getPin().isBlank())
            throw new RuntimeException("El PIN es obligatorio al crear un usuario");
        Usuario u = new Usuario();
        u.setNombre(req.getNombre().trim());
        u.setRol(Rol.valueOf(req.getRol().toLowerCase()));
        u.setPinHash(AuthService.sha256(req.getPin()));
        return new UsuarioResponse(usuarioRepository.save(u));
    }

    public UsuarioResponse editarUsuario(UUID id, UsuarioRequest req) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (req.getNombre() != null && !req.getNombre().isBlank())
            u.setNombre(req.getNombre().trim());
        if (req.getRol() != null && !req.getRol().isBlank())
            u.setRol(Rol.valueOf(req.getRol().toLowerCase()));
        if (req.getPin() != null && !req.getPin().isBlank())
            u.setPinHash(AuthService.sha256(req.getPin()));
        return new UsuarioResponse(usuarioRepository.save(u));
    }

    public void desactivarUsuario(UUID id) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        u.setActivo(false);
        usuarioRepository.save(u);
    }

    // Usado por el scheduler y el endpoint manual
    public EstadoActualResponse getEstadoParaResumen() {
        return getEstadoActual();
    }

    private BigDecimal sumar(List<Venta> ventas) {
        return ventas.stream()
                .map(Venta::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
