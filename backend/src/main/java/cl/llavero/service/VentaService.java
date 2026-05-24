package cl.llavero.service;

import cl.llavero.dto.VentaItemRequest;
import cl.llavero.dto.VentaItemResponse;
import cl.llavero.dto.VentaRequest;
import cl.llavero.dto.VentaResponse;
import cl.llavero.entity.*;
import cl.llavero.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VentaService {

    private static final BigDecimal COSTO_EARLY_CHECKIN = BigDecimal.valueOf(8000);

    @Value("${llavero.clave.anulacion}")
    private String claveAnulacion;

    private final VentaRepository ventaRepository;
    private final VentaItemRepository itemRepository;
    private final HabitacionRepository habitacionRepository;
    private final TurnoRepository turnoRepository;
    private final UsuarioRepository usuarioRepository;
    private final DteQueueRepository dteQueueRepository;
    private final ProductoRepository productoRepository;
    private final ProductoService productoService;

    public VentaService(VentaRepository ventaRepository,
                        VentaItemRepository itemRepository,
                        HabitacionRepository habitacionRepository,
                        TurnoRepository turnoRepository,
                        UsuarioRepository usuarioRepository,
                        DteQueueRepository dteQueueRepository,
                        ProductoRepository productoRepository,
                        ProductoService productoService) {
        this.ventaRepository = ventaRepository;
        this.itemRepository = itemRepository;
        this.habitacionRepository = habitacionRepository;
        this.turnoRepository = turnoRepository;
        this.usuarioRepository = usuarioRepository;
        this.dteQueueRepository = dteQueueRepository;
        this.productoRepository = productoRepository;
        this.productoService = productoService;
    }

    private LocalDateTime calcularSalida(String duracion, String earlyCheckin) {
        LocalDateTime ahora = LocalDateTime.now();
        return switch (duracion != null ? duracion : "1h") {
            case "2h" -> ahora.plusHours(2);
            case "3h" -> ahora.plusHours(3);
            case "noche" -> "hoy".equals(earlyCheckin)
                    ? LocalDate.now().atTime(12, 0)
                    : LocalDate.now().plusDays(1).atTime(12, 0);
            default -> ahora.plusHours(1);
        };
    }

    @Transactional
    public VentaResponse crear(VentaRequest request, String usuarioId) {
        Usuario usuario = usuarioRepository.findById(UUID.fromString(usuarioId))
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Turno turno = turnoRepository.findByUsuarioIdAndCerradoFalse(usuario.getId())
                .orElseThrow(() -> new RuntimeException("No hay turno activo. Inicia sesión nuevamente."));

        // Tipo de venta: hostal por default
        TipoVenta tipoVenta = request.getTipoVenta() != null
                ? TipoVenta.valueOf(request.getTipoVenta())
                : TipoVenta.hostal;

        // Habitación: solo obligatoria en modo hostal
        Habitacion habitacion = null;
        if (tipoVenta == TipoVenta.hostal) {
            if (request.getHabitacionId() == null || request.getHabitacionId().isBlank()) {
                throw new RuntimeException("Falta la habitación para una venta de hostal");
            }
            habitacion = habitacionRepository.findById(UUID.fromString(request.getHabitacionId()))
                    .orElseThrow(() -> new RuntimeException("Habitación no encontrada"));
            if (habitacion.getEstado() != EstadoHabitacion.libre) {
                throw new RuntimeException("La habitación no está disponible");
            }
        }

        Venta venta = new Venta();
        venta.setTurno(turno);
        venta.setUsuario(usuario);
        venta.setHabitacion(habitacion);
        venta.setTipoVenta(tipoVenta);
        venta.setFecha(LocalDate.now());
        venta.setHora(LocalTime.now());
        venta.setCreatedAt(LocalDateTime.now());
        venta.setObservacion(request.getObservacion());
        venta.setTipoDte(TipoDte.valueOf(request.getTipoDte()));
        venta.setDuracion(tipoVenta == TipoVenta.hostal ? request.getDuracion() : null);
        venta.setSalidaEstimada(tipoVenta == TipoVenta.hostal
                ? calcularSalida(request.getDuracion(), request.getEarlyCheckin())
                : null);

        if (TipoDte.factura.name().equals(request.getTipoDte())) {
            venta.setReceptorRut(request.getReceptorRut());
            venta.setReceptorRazon(request.getReceptorRazon());
            venta.setReceptorGiro(request.getReceptorGiro());
            venta.setReceptorDireccion(request.getReceptorDireccion());
            venta.setReceptorComuna(request.getReceptorComuna());
            venta.setReceptorCiudad(request.getReceptorCiudad());
            venta.setReceptorEmail(request.getReceptorEmail());
        }

        BigDecimal total = BigDecimal.ZERO;
        List<VentaItem> items = new ArrayList<>();

        for (VentaItemRequest ir : request.getItems()) {
            VentaItem item = new VentaItem();
            item.setVenta(venta);
            item.setTipo(TipoItem.valueOf(ir.getTipo()));
            item.setDescripcion(ir.getDescripcion());
            item.setCantidad(ir.getCantidad() != null ? ir.getCantidad() : 1);
            item.setPrecioUnitario(ir.getPrecioUnitario());
            item.setSubtotal(ir.getPrecioUnitario().multiply(BigDecimal.valueOf(item.getCantidad())));
            item.setEsLibre(Boolean.TRUE.equals(ir.getEsLibre()));
            total = total.add(item.getSubtotal());
            items.add(item);
        }

        // Early check-in con costo → agregar ítem automático de $8.000
        if ("con_costo".equals(request.getEarlyCheckin())) {
            VentaItem earlyItem = new VentaItem();
            earlyItem.setTipo(TipoItem.libre);
            earlyItem.setDescripcion("Early check-in");
            earlyItem.setCantidad(1);
            earlyItem.setPrecioUnitario(COSTO_EARLY_CHECKIN);
            earlyItem.setSubtotal(COSTO_EARLY_CHECKIN);
            earlyItem.setEsLibre(false);
            items.add(earlyItem);
            total = total.add(COSTO_EARLY_CHECKIN);
        }

        venta.setTotal(total);
        venta = ventaRepository.save(venta);

        for (VentaItem item : items) {
            item.setVenta(venta);
        }
        itemRepository.saveAll(items);

        // Descontar stock de productos trackeados
        for (VentaItemRequest ir : request.getItems()) {
            if (TipoItem.producto.name().equals(ir.getTipo())) {
                descontarStock(ir.getDescripcion(), ir.getCantidad() != null ? ir.getCantidad() : 1, venta);
            }
        }

        // Solo cambiar el estado de la habitación si es venta de hostal
        if (tipoVenta == TipoVenta.hostal && habitacion != null) {
            habitacion.setEstado(EstadoHabitacion.ocupado);
            habitacionRepository.save(habitacion);
        }

        turno.setTotalTurno(turno.getTotalTurno().add(total));
        turnoRepository.save(turno);

        DteQueue dte = new DteQueue();
        dte.setVenta(venta);
        dte.setTipoDte(request.getTipoDte());
        dte.setEstado(EstadoDte.pendiente);
        dteQueueRepository.save(dte);

        return mapear(ventaRepository.findById(venta.getId()).orElseThrow());
    }

    private void descontarStock(String descripcion, int cantidad, Venta venta) {
        productoRepository.findByActivoTrueOrderByCategoria().stream()
            .filter(p -> p.getNombre().equals(descripcion) && p.getStock() != null)
            .findFirst()
            .ifPresent(p -> {
                int anterior = p.getStock();
                int nuevo = Math.max(0, anterior - cantidad);
                p.setStock(nuevo);
                productoRepository.save(p);
                productoService.registrarMovimiento(p, TipoMovimiento.salida, cantidad,
                        anterior, nuevo, "Venta", venta);
            });
    }

    public List<VentaResponse> listar(String turnoId, String periodo, String usuarioId, String rol) {
        List<Venta> ventas;

        if ("JEFE".equals(rol.toUpperCase())) {
            if (turnoId != null && !turnoId.isBlank()) {
                ventas = ventaRepository.findByTurnoIdOrderByCreatedAtDesc(UUID.fromString(turnoId));
            } else if ("hoy".equals(periodo)) {
                ventas = ventaRepository.findByFecha(LocalDate.now());
            } else if ("semana".equals(periodo)) {
                ventas = ventaRepository.findByFechaDesde(LocalDate.now().minusDays(7));
            } else {
                ventas = ventaRepository.findAllOrderByCreatedAtDesc();
            }
        } else {
            // Cajero solo ve su turno actual
            Turno turnoActivo = turnoRepository.findByUsuarioIdAndCerradoFalse(UUID.fromString(usuarioId))
                    .orElse(null);
            if (turnoActivo == null) {
                return List.of();
            }
            ventas = ventaRepository.findByTurnoIdOrderByCreatedAtDesc(turnoActivo.getId());
        }

        return ventas.stream().map(this::mapear).collect(Collectors.toList());
    }

    @Transactional
    public void anular(String id, String clave) {
        if (!claveAnulacion.equals(clave)) {
            throw new RuntimeException("Clave de anulación incorrecta");
        }
        eliminar(id);
    }

    @Transactional
    public void eliminar(String id) {
        Venta venta = ventaRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));

        // Al anular, liberar la habitación sin importar si está ocupada o en aseo
        Habitacion h = venta.getHabitacion();
        if (h != null && (h.getEstado() == EstadoHabitacion.ocupado
                       || h.getEstado() == EstadoHabitacion.aseo)) {
            h.setEstado(EstadoHabitacion.libre);
            h.setNota(null);
            habitacionRepository.save(h);
        }

        // Devolver stock de productos vendidos
        for (VentaItem item : venta.getItems()) {
            if (item.getTipo() == TipoItem.producto) {
                productoRepository.findByActivoTrueOrderByCategoria().stream()
                    .filter(p -> p.getNombre().equals(item.getDescripcion()) && p.getStock() != null)
                    .findFirst()
                    .ifPresent(p -> {
                        int anterior = p.getStock();
                        int nuevo = anterior + item.getCantidad();
                        p.setStock(nuevo);
                        productoRepository.save(p);
                        productoService.registrarMovimiento(p, TipoMovimiento.devolucion,
                                item.getCantidad(), anterior, nuevo, "Anulación de venta", null);
                    });
            }
        }

        // Restar del turno
        Turno turno = venta.getTurno();
        if (turno != null) {
            turno.setTotalTurno(turno.getTotalTurno().subtract(venta.getTotal()));
            turnoRepository.save(turno);
        }

        dteQueueRepository.findByVentaId(venta.getId()).ifPresent(dteQueueRepository::delete);
        itemRepository.deleteAll(venta.getItems());
        ventaRepository.delete(venta);
    }

    public VentaResponse mapear(Venta v) {
        VentaResponse r = new VentaResponse();
        r.setId(v.getId().toString());
        r.setFecha(v.getFecha());
        r.setHora(v.getHora());
        r.setCreatedAt(v.getCreatedAt());
        r.setObservacion(v.getObservacion());
        r.setTotal(v.getTotal());
        r.setTipoDte(v.getTipoDte().name());
        r.setTipoVenta(v.getTipoVenta() != null ? v.getTipoVenta().name() : "hostal");
        r.setReceptorRut(v.getReceptorRut());
        r.setReceptorRazon(v.getReceptorRazon());
        r.setReceptorGiro(v.getReceptorGiro());
        r.setReceptorDireccion(v.getReceptorDireccion());
        r.setReceptorComuna(v.getReceptorComuna());
        r.setReceptorCiudad(v.getReceptorCiudad());
        r.setReceptorEmail(v.getReceptorEmail());

        if (v.getTurno() != null) r.setTurnoId(v.getTurno().getId().toString());
        if (v.getUsuario() != null) r.setCajero(v.getUsuario().getNombre());
        if (v.getHabitacion() != null) {
            r.setHabitacionNumero(v.getHabitacion().getNumero());
            r.setHabitacionTipo(v.getHabitacion().getTipo() != null
                    ? v.getHabitacion().getTipo().getLabel() : "");
        }

        r.setDuracion(v.getDuracion());
        r.setSalidaEstimada(v.getSalidaEstimada());

        dteQueueRepository.findByVentaId(v.getId())
                .ifPresent(dte -> r.setDteEstado(dte.getEstado().name()));

        r.setItems(v.getItems().stream().map(i -> {
            VentaItemResponse ir = new VentaItemResponse();
            ir.setTipo(i.getTipo().name());
            ir.setDescripcion(i.getDescripcion());
            ir.setCantidad(i.getCantidad());
            ir.setPrecioUnitario(i.getPrecioUnitario());
            ir.setSubtotal(i.getSubtotal());
            ir.setEsLibre(i.getEsLibre());
            return ir;
        }).collect(Collectors.toList()));

        return r;
    }
}
