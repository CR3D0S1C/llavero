package cl.llavero.service;

import cl.llavero.dto.ArqueoRequest;
import cl.llavero.dto.ResumenTurnoResponse;
import cl.llavero.dto.TurnoResponse;
import cl.llavero.dto.VentaResponse;
import cl.llavero.entity.*;
import cl.llavero.repository.ArqueoTurnoRepository;
import cl.llavero.repository.HabitacionLogRepository;
import cl.llavero.repository.TurnoRepository;
import cl.llavero.repository.UsuarioRepository;
import cl.llavero.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TurnoService {

    private final TurnoRepository turnoRepository;
    private final VentaService ventaService;
    private final VentaRepository ventaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ArqueoTurnoRepository arqueoRepository;
    private final HabitacionLogRepository habitacionLogRepository;
    private final EmailService emailService;
    private final PdfService pdfService;

    public TurnoService(TurnoRepository turnoRepository,
                        VentaService ventaService,
                        VentaRepository ventaRepository,
                        UsuarioRepository usuarioRepository,
                        ArqueoTurnoRepository arqueoRepository,
                        HabitacionLogRepository habitacionLogRepository,
                        EmailService emailService,
                        PdfService pdfService) {
        this.turnoRepository = turnoRepository;
        this.ventaService = ventaService;
        this.ventaRepository = ventaRepository;
        this.usuarioRepository = usuarioRepository;
        this.arqueoRepository = arqueoRepository;
        this.habitacionLogRepository = habitacionLogRepository;
        this.emailService = emailService;
        this.pdfService = pdfService;
    }

    public TurnoResponse getActivo(String usuarioId) {
        Turno turno = turnoRepository.findByUsuarioIdAndCerradoFalse(UUID.fromString(usuarioId))
                .orElseThrow(() -> new RuntimeException("No hay turno activo"));
        return mapear(turno, true);
    }

    // === Resumen para el wizard de cierre ===
    public ResumenTurnoResponse getResumenActivo(String usuarioId) {
        Turno turno = turnoRepository.findByUsuarioIdAndCerradoFalse(UUID.fromString(usuarioId))
                .orElseThrow(() -> new RuntimeException("No hay turno activo"));

        List<Venta> ventas = ventaRepository.findByTurnoIdOrderByCreatedAtDesc(turno.getId());

        int boletas  = (int) ventas.stream().filter(v -> v.getTipoDte() == TipoDte.boleta).count();
        int facturas = (int) ventas.stream().filter(v -> v.getTipoDte() == TipoDte.factura).count();

        // Totales por método de pago
        BigDecimal totEfectivo = BigDecimal.ZERO, totTransferencia = BigDecimal.ZERO,
                   totDebito = BigDecimal.ZERO,   totCredito = BigDecimal.ZERO,
                   totOtro = BigDecimal.ZERO;
        for (Venta v : ventas) {
            BigDecimal monto = v.getTotal() != null ? v.getTotal() : BigDecimal.ZERO;
            if (v.getMetodoPago() == null) { totOtro = totOtro.add(monto); continue; }
            switch (v.getMetodoPago()) {
                case efectivo      -> totEfectivo      = totEfectivo.add(monto);
                case transferencia -> totTransferencia = totTransferencia.add(monto);
                case debito        -> totDebito        = totDebito.add(monto);
                case credito       -> totCredito       = totCredito.add(monto);
                case otro          -> totOtro          = totOtro.add(monto);
            }
        }

        // Top productos vendidos
        Map<String, ResumenTurnoResponse.ProductoVendidoDto> prods = new LinkedHashMap<>();
        Map<String, ResumenTurnoResponse.HabitacionVendidaDto> habs = new LinkedHashMap<>();
        for (Venta v : ventas) {
            for (VentaItem it : v.getItems()) {
                if (it.getTipo() == TipoItem.producto) {
                    var dto = prods.computeIfAbsent(it.getDescripcion(),
                        k -> new ResumenTurnoResponse.ProductoVendidoDto(k, 0, BigDecimal.ZERO));
                    dto.setCantidad(dto.getCantidad() + it.getCantidad());
                    dto.setTotal(dto.getTotal().add(it.getSubtotal()));
                } else if (it.getTipo() == TipoItem.habitacion) {
                    String tipo = v.getHabitacion() != null && v.getHabitacion().getTipo() != null
                            ? v.getHabitacion().getTipo().getLabel() : "Habitación";
                    var dto = habs.computeIfAbsent(tipo,
                        k -> new ResumenTurnoResponse.HabitacionVendidaDto(k, 0, BigDecimal.ZERO));
                    dto.setCantidad(dto.getCantidad() + it.getCantidad());
                    dto.setTotal(dto.getTotal().add(it.getSubtotal()));
                }
            }
        }

        // Movimientos de habitaciones hechos por este cajero durante el turno
        String nombre = turno.getUsuario() != null ? turno.getUsuario().getNombre() : "";
        List<HabitacionLog> movs = habitacionLogRepository
                .findByUsuarioNombreAndCreatedAtAfter(nombre, turno.getInicio());
        int limpiezas = (int) movs.stream().filter(l -> "libre".equals(l.getEstadoNuevo())
                && "aseo".equals(l.getEstadoAnterior())).count();

        ResumenTurnoResponse r = new ResumenTurnoResponse();
        r.setTurnoId(turno.getId().toString());
        r.setCajeroNombre(nombre);
        r.setInicio(turno.getInicio());
        r.setDuracionMinutos(Duration.between(turno.getInicio(), LocalDateTime.now()).toMinutes());
        r.setTotalSistema(turno.getTotalTurno() != null ? turno.getTotalTurno() : BigDecimal.ZERO);
        r.setCantidadVentas(ventas.size());
        r.setCantidadBoletas(boletas);
        r.setCantidadFacturas(facturas);
        r.setMovimientosHabitaciones(movs.size());
        r.setLimpiezasRealizadas(limpiezas);
        r.setProductosTop(prods.values().stream()
                .sorted((a, b) -> b.getCantidad().compareTo(a.getCantidad()))
                .limit(10).collect(Collectors.toList()));
        r.setHabitacionesTop(new ArrayList<>(habs.values()));
        r.setTotalEfectivo(totEfectivo);
        r.setTotalTransferencia(totTransferencia);
        r.setTotalDebito(totDebito);
        r.setTotalCredito(totCredito);
        r.setTotalOtro(totOtro);
        return r;
    }

    // === Cierre con arqueo obligatorio ===
    @Transactional
    public TurnoResponse cerrarConArqueo(String usuarioId, ArqueoRequest req) {
        Usuario usuario = usuarioRepository.findById(UUID.fromString(usuarioId))
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Turno turno = turnoRepository.findByUsuarioIdAndCerradoFalse(usuario.getId())
                .orElseThrow(() -> new RuntimeException("No hay turno activo"));

        // Verificar PIN como firma
        if (req.getPin() == null || !AuthService.sha256(req.getPin()).equals(usuario.getPinHash())) {
            throw new RuntimeException("PIN incorrecto — el cierre debe firmarse con tu PIN");
        }

        BigDecimal efectivo       = nz(req.getEfectivo());
        BigDecimal transferencia  = nz(req.getTransferencia());
        BigDecimal tarjetaDebito  = nz(req.getTarjetaDebito());
        BigDecimal tarjetaCredito = nz(req.getTarjetaCredito());
        BigDecimal otro           = nz(req.getOtro());
        BigDecimal totalDeclarado = efectivo.add(transferencia).add(tarjetaDebito).add(tarjetaCredito).add(otro);
        BigDecimal totalSistema   = turno.getTotalTurno() != null ? turno.getTotalTurno() : BigDecimal.ZERO;
        BigDecimal diferencia     = totalDeclarado.subtract(totalSistema);

        // Si hay diferencia, la observación es obligatoria
        if (diferencia.signum() != 0 && (req.getObservacion() == null || req.getObservacion().trim().isEmpty())) {
            throw new RuntimeException("Hay diferencia entre lo declarado y el sistema. Debes ingresar una observación.");
        }

        // Conteo efectivo
        BigDecimal totalConteo = BigDecimal.ZERO
                .add(BigDecimal.valueOf(20000L * nzi(req.getB20000())))
                .add(BigDecimal.valueOf(10000L * nzi(req.getB10000())))
                .add(BigDecimal.valueOf(5000L  * nzi(req.getB5000())))
                .add(BigDecimal.valueOf(2000L  * nzi(req.getB2000())))
                .add(BigDecimal.valueOf(1000L  * nzi(req.getB1000())))
                .add(BigDecimal.valueOf(500L   * nzi(req.getM500())))
                .add(BigDecimal.valueOf(100L   * nzi(req.getM100())))
                .add(BigDecimal.valueOf(50L    * nzi(req.getM50())))
                .add(BigDecimal.valueOf(10L    * nzi(req.getM10())));

        // Capturamos el resumen ANTES de cerrar para incluirlo en el email
        ResumenTurnoResponse resumen = getResumenActivo(usuarioId);

        ArqueoTurno arqueo = new ArqueoTurno();
        arqueo.setTurno(turno);
        arqueo.setCajeroNombre(usuario.getNombre());
        arqueo.setTotalSistema(totalSistema);
        arqueo.setEfectivo(efectivo);
        arqueo.setTransferencia(transferencia);
        arqueo.setTarjetaDebito(tarjetaDebito);
        arqueo.setTarjetaCredito(tarjetaCredito);
        arqueo.setOtro(otro);
        arqueo.setTotalDeclarado(totalDeclarado);
        arqueo.setDiferencia(diferencia);
        arqueo.setB20000(nzi(req.getB20000()));
        arqueo.setB10000(nzi(req.getB10000()));
        arqueo.setB5000(nzi(req.getB5000()));
        arqueo.setB2000(nzi(req.getB2000()));
        arqueo.setB1000(nzi(req.getB1000()));
        arqueo.setM500(nzi(req.getM500()));
        arqueo.setM100(nzi(req.getM100()));
        arqueo.setM50(nzi(req.getM50()));
        arqueo.setM10(nzi(req.getM10()));
        arqueo.setTotalConteoEfectivo(totalConteo);
        arqueo.setObservacion(req.getObservacion());
        arqueoRepository.save(arqueo);

        turno.setCerrado(true);
        turno.setFin(LocalDateTime.now());
        turnoRepository.save(turno);

        // Email con PDF del arqueo
        emailService.enviarArqueoAsync(arqueo, resumen);

        // Alerta separada si la diferencia supera $5.000
        if (diferencia.abs().compareTo(java.math.BigDecimal.valueOf(5000)) >= 0) {
            emailService.alertaDiferenciaArqueo(usuario.getNombre(), diferencia);
        }

        return mapear(turno, true);
    }

    // Descarga del PDF del arqueo (admin)
    public byte[] getArqueoPdf(String turnoId) {
        ArqueoTurno arqueo = arqueoRepository.findByTurnoId(UUID.fromString(turnoId))
                .orElseThrow(() -> new RuntimeException("Arqueo no encontrado para este turno"));
        Turno t = arqueo.getTurno();
        // Reconstruir un resumen "histórico" desde ventas del turno
        ResumenTurnoResponse r = new ResumenTurnoResponse();
        r.setCajeroNombre(arqueo.getCajeroNombre());
        r.setTotalSistema(arqueo.getTotalSistema());
        r.setInicio(t.getInicio());
        r.setDuracionMinutos(t.getFin() != null
                ? java.time.Duration.between(t.getInicio(), t.getFin()).toMinutes()
                : 0L);
        List<Venta> ventas = ventaRepository.findByTurnoIdOrderByCreatedAtDesc(t.getId());
        r.setCantidadVentas(ventas.size());
        r.setCantidadBoletas((int) ventas.stream().filter(v -> v.getTipoDte() == TipoDte.boleta).count());
        r.setCantidadFacturas((int) ventas.stream().filter(v -> v.getTipoDte() == TipoDte.factura).count());
        r.setMovimientosHabitaciones(0);
        r.setLimpiezasRealizadas(0);
        return pdfService.generarPdfArqueo(arqueo, r);
    }

    public List<TurnoResponse> getTurnosHoy() {
        LocalDateTime inicio = LocalDate.now().atStartOfDay();
        return turnoRepository.findTurnosDesde(inicio)
                .stream()
                .map(t -> mapear(t, false))
                .collect(Collectors.toList());
    }

    private static BigDecimal nz(BigDecimal v) { return v != null ? v : BigDecimal.ZERO; }
    private static int nzi(Integer v) { return v != null ? v : 0; }

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
