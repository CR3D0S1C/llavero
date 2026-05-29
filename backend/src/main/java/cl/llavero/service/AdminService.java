package cl.llavero.service;

import cl.llavero.dto.EstadoActualResponse;
import cl.llavero.dto.MetricasResponse;
import cl.llavero.dto.OcupacionResponse;
import cl.llavero.dto.UsuarioRequest;
import cl.llavero.dto.UsuarioResponse;
import cl.llavero.entity.*;
import cl.llavero.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final VentaRepository ventaRepository;
    private final HabitacionRepository habitacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final TurnoRepository turnoRepository;
    private final DteQueueRepository dteQueueRepository;
    private final ProductoRepository productoRepository;

    public AdminService(VentaRepository ventaRepository,
                        HabitacionRepository habitacionRepository,
                        UsuarioRepository usuarioRepository,
                        TurnoRepository turnoRepository,
                        DteQueueRepository dteQueueRepository,
                        ProductoRepository productoRepository) {
        this.ventaRepository = ventaRepository;
        this.habitacionRepository = habitacionRepository;
        this.usuarioRepository = usuarioRepository;
        this.turnoRepository = turnoRepository;
        this.dteQueueRepository = dteQueueRepository;
        this.productoRepository = productoRepository;
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

        List<MetricasResponse.ProductoBajoStock> bajoStock = productoRepository
            .findByActivoTrueOrderByCategoria().stream()
            .filter(p -> p.getStock() != null && p.getStock() <= p.getStockMinimo())
            .sorted(Comparator.comparingInt(cl.llavero.entity.Producto::getStock))
            .map(p -> {
                MetricasResponse.ProductoBajoStock dto = new MetricasResponse.ProductoBajoStock();
                dto.setNombre(p.getNombre());
                dto.setIcono(p.getIcono());
                dto.setStock(p.getStock());
                dto.setStockMinimo(p.getStockMinimo() != null ? p.getStockMinimo() : 0);
                return dto;
            })
            .toList();
        r.setProductosBajoStock(bajoStock);

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
                .filter(u -> Boolean.TRUE.equals(u.getActivo()))
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

    public OcupacionResponse getOcupacion() {
        LocalDate hoy = LocalDate.now();
        LocalDate desde = hoy.withDayOfMonth(1).minusMonths(5); // 6 meses incluyendo el actual
        int totalHabitaciones = habitacionRepository.findByActivaTrueOrderByNumero().size();

        List<Venta> ventas = ventaRepository.findHostalBetween(desde, hoy);

        // ── Por mes ──────────────────────────────────────────────────────
        List<OcupacionResponse.MesStats> meses = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.from(hoy).minusMonths(i);
            List<Venta> delMes = ventas.stream()
                .filter(v -> YearMonth.from(v.getFecha()).equals(ym))
                .toList();

            int noches = delMes.stream().mapToInt(v -> {
                if (v.getSalidaEstimada() == null) return 1;
                long n = ChronoUnit.DAYS.between(v.getFecha(), v.getSalidaEstimada().toLocalDate());
                return (int) Math.max(1, n);
            }).sum();

            int capacidad = totalHabitaciones * ym.lengthOfMonth();
            double tasa = capacidad > 0 ? (noches * 100.0) / capacidad : 0;

            OcupacionResponse.MesStats ms = new OcupacionResponse.MesStats();
            ms.setMes(ym.getMonth().getDisplayName(TextStyle.FULL, new Locale("es", "CL")));
            ms.setAnio(ym.getYear());
            ms.setNumeroMes(ym.getMonthValue());
            ms.setVentas(delMes.size());
            ms.setIngresos(sumar(delMes));
            ms.setNochesVendidas(noches);
            ms.setCapacidadTotal(capacidad);
            ms.setTasaOcupacion(Math.round(tasa * 10.0) / 10.0);
            meses.add(ms);
        }

        // ── Por tipo de habitación ───────────────────────────────────────
        Map<String, List<Venta>> porTipo = ventas.stream()
            .filter(v -> v.getHabitacion() != null && v.getHabitacion().getTipo() != null)
            .collect(Collectors.groupingBy(v -> v.getHabitacion().getTipo().getLabel()));

        List<OcupacionResponse.TipoStats> tipoStats = porTipo.entrySet().stream()
            .map(e -> {
                OcupacionResponse.TipoStats ts = new OcupacionResponse.TipoStats();
                ts.setTipo(e.getKey());
                ts.setTotal(sumar(e.getValue()));
                ts.setVentas(e.getValue().size());
                return ts;
            })
            .sorted(Comparator.comparing(OcupacionResponse.TipoStats::getTotal).reversed())
            .toList();

        // ── Por día de semana ────────────────────────────────────────────
        String[] diasEs = {"Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"};
        List<OcupacionResponse.DiaStats> diasStats = new ArrayList<>();
        for (DayOfWeek dow : DayOfWeek.values()) {
            List<Venta> delDia = ventas.stream()
                .filter(v -> v.getFecha().getDayOfWeek() == dow)
                .toList();
            OcupacionResponse.DiaStats ds = new OcupacionResponse.DiaStats();
            ds.setDia(diasEs[dow.getValue() - 1]);
            ds.setVentas(delDia.size());
            ds.setTotal(sumar(delDia));
            diasStats.add(ds);
        }

        // ── Comparativo mes actual vs anterior ───────────────────────────
        YearMonth mesActualYm = YearMonth.from(hoy);
        YearMonth mesAnteriorYm = mesActualYm.minusMonths(1);

        List<Venta> mesActualV = ventas.stream()
            .filter(v -> YearMonth.from(v.getFecha()).equals(mesActualYm)).toList();
        List<Venta> mesAnteriorV = ventas.stream()
            .filter(v -> YearMonth.from(v.getFecha()).equals(mesAnteriorYm)).toList();

        BigDecimal ingresoActual = sumar(mesActualV);
        BigDecimal ingresoAnterior = sumar(mesAnteriorV);
        double variacion = 0;
        if (ingresoAnterior.compareTo(BigDecimal.ZERO) != 0) {
            variacion = ingresoActual.subtract(ingresoAnterior)
                .multiply(BigDecimal.valueOf(100))
                .divide(ingresoAnterior, 1, RoundingMode.HALF_UP)
                .doubleValue();
        }

        OcupacionResponse.ComparativoMes comp = new OcupacionResponse.ComparativoMes();
        comp.setLabelMesActual(mesActualYm.getMonth().getDisplayName(TextStyle.FULL, new Locale("es", "CL")));
        comp.setLabelMesAnterior(mesAnteriorYm.getMonth().getDisplayName(TextStyle.FULL, new Locale("es", "CL")));
        comp.setIngresosMesActual(ingresoActual);
        comp.setIngresosMesAnterior(ingresoAnterior);
        comp.setVentasMesActual(mesActualV.size());
        comp.setVentasMesAnterior(mesAnteriorV.size());
        comp.setVariacionPct(variacion);

        OcupacionResponse r = new OcupacionResponse();
        r.setMeses(meses);
        r.setPorTipo(tipoStats);
        r.setPorDiaSemana(diasStats);
        r.setComparativo(comp);
        return r;
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
