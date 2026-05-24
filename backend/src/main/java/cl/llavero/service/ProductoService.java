package cl.llavero.service;

import cl.llavero.dto.AjusteStockRequest;
import cl.llavero.dto.IngresoStockRequest;
import cl.llavero.dto.MovimientoStockResponse;
import cl.llavero.dto.ProductoRequest;
import cl.llavero.entity.MovimientoStock;
import cl.llavero.entity.Producto;
import cl.llavero.entity.TipoMovimiento;
import cl.llavero.repository.MovimientoStockRepository;
import cl.llavero.repository.ProductoRepository;
import cl.llavero.repository.UsuarioRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final MovimientoStockRepository movimientoRepository;
    private final UsuarioRepository usuarioRepository;

    public ProductoService(ProductoRepository productoRepository,
                           MovimientoStockRepository movimientoRepository,
                           UsuarioRepository usuarioRepository) {
        this.productoRepository = productoRepository;
        this.movimientoRepository = movimientoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<Producto> listar() {
        return productoRepository.findByActivoTrueOrderByCategoria();
    }

    public Producto buscarPorCodigo(String codigo) {
        return productoRepository.findByCodigoBarrasAndActivoTrue(codigo)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con código " + codigo));
    }

    @Transactional
    public Producto crear(ProductoRequest request) {
        Producto p = new Producto();
        aplicarCampos(p, request);
        Producto guardado = productoRepository.save(p);
        // Si arranca con stock, registrar como entrada inicial
        if (request.getStock() != null && request.getStock() > 0) {
            registrarMovimiento(guardado, TipoMovimiento.entrada, request.getStock(),
                    0, request.getStock(), "Stock inicial", null);
        }
        return guardado;
    }

    @Transactional
    public Producto actualizar(String id, ProductoRequest request) {
        Producto p = productoRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        aplicarCampos(p, request);
        return productoRepository.save(p);
    }

    private void aplicarCampos(Producto p, ProductoRequest r) {
        p.setNombre(r.getNombre());
        p.setPrecio(r.getPrecio());
        p.setIcono(r.getIcono());
        p.setCategoria(r.getCategoria());
        // codigoBarras: si viene vacío, lo dejamos null para no chocar con el unique constraint
        String cb = r.getCodigoBarras();
        p.setCodigoBarras(cb != null && !cb.isBlank() ? cb.trim() : null);
        p.setStock(r.getStock());
        p.setStockMinimo(r.getStockMinimo() != null ? r.getStockMinimo() : 0);
        p.setCosto(r.getCosto());
    }

    public void eliminar(String id) {
        Producto p = productoRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        p.setActivo(false);
        productoRepository.save(p);
    }

    // ───────── Stock ─────────

    @Transactional
    public Producto ingresoStock(String id, IngresoStockRequest req) {
        if (req.getCantidad() == null || req.getCantidad() <= 0) {
            throw new RuntimeException("La cantidad debe ser mayor a 0");
        }
        Producto p = productoRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        int anterior = p.getStock() != null ? p.getStock() : 0;
        int nuevo = anterior + req.getCantidad();
        p.setStock(nuevo);
        productoRepository.save(p);
        registrarMovimiento(p, TipoMovimiento.entrada, req.getCantidad(), anterior, nuevo,
                req.getMotivo() != null ? req.getMotivo() : "Ingreso de mercadería", null);
        return p;
    }

    @Transactional
    public Producto ajustarStock(String id, AjusteStockRequest req) {
        if (req.getStockNuevo() == null || req.getStockNuevo() < 0) {
            throw new RuntimeException("El stock no puede ser negativo");
        }
        Producto p = productoRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        int anterior = p.getStock() != null ? p.getStock() : 0;
        int diff = Math.abs(req.getStockNuevo() - anterior);
        p.setStock(req.getStockNuevo());
        productoRepository.save(p);
        registrarMovimiento(p, TipoMovimiento.ajuste, diff, anterior, req.getStockNuevo(),
                req.getMotivo() != null ? req.getMotivo() : "Ajuste manual de inventario", null);
        return p;
    }

    public List<MovimientoStockResponse> getMovimientos(String productoId) {
        DateTimeFormatter fFecha = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter fHora  = DateTimeFormatter.ofPattern("HH:mm");
        return movimientoRepository.findTop100ByProductoIdOrderByCreatedAtDesc(UUID.fromString(productoId))
                .stream().map(m -> mapearMovimiento(m, fFecha, fHora))
                .collect(Collectors.toList());
    }

    public List<MovimientoStockResponse> getMovimientosRecientes() {
        DateTimeFormatter fFecha = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter fHora  = DateTimeFormatter.ofPattern("HH:mm");
        return movimientoRepository.findTop200ByOrderByCreatedAtDesc()
                .stream().map(m -> mapearMovimiento(m, fFecha, fHora))
                .collect(Collectors.toList());
    }

    private MovimientoStockResponse mapearMovimiento(MovimientoStock m, DateTimeFormatter f, DateTimeFormatter h) {
        MovimientoStockResponse r = new MovimientoStockResponse();
        r.setId(m.getId().toString());
        r.setProductoNombre(m.getProducto() != null ? m.getProducto().getNombre() : "—");
        r.setTipo(m.getTipo().name());
        r.setCantidad(m.getCantidad());
        r.setStockAnterior(m.getStockAnterior());
        r.setStockNuevo(m.getStockNuevo());
        r.setMotivo(m.getMotivo());
        r.setUsuarioNombre(m.getUsuarioNombre());
        r.setFecha(m.getCreatedAt().format(f));
        r.setHora(m.getCreatedAt().format(h));
        return r;
    }

    // Llamado por VentaService al crear o anular ventas
    @Transactional
    public void registrarMovimiento(Producto p, TipoMovimiento tipo, int cantidad,
                                    int stockAnterior, int stockNuevo, String motivo,
                                    cl.llavero.entity.Venta venta) {
        String nombre = "Sistema";
        try {
            String principal = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            nombre = usuarioRepository.findById(UUID.fromString(principal))
                    .map(u -> u.getNombre()).orElse("Sistema");
        } catch (Exception ignored) {}
        MovimientoStock m = new MovimientoStock();
        m.setProducto(p);
        m.setTipo(tipo);
        m.setCantidad(cantidad);
        m.setStockAnterior(stockAnterior);
        m.setStockNuevo(stockNuevo);
        m.setMotivo(motivo);
        m.setUsuarioNombre(nombre);
        m.setVenta(venta);
        movimientoRepository.save(m);
    }
}
