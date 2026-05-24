package cl.llavero.controller;

import cl.llavero.dto.AjusteStockRequest;
import cl.llavero.dto.IngresoStockRequest;
import cl.llavero.dto.MovimientoStockResponse;
import cl.llavero.dto.ProductoRequest;
import cl.llavero.entity.Producto;
import cl.llavero.service.ProductoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping
    public ResponseEntity<List<Producto>> listar() {
        return ResponseEntity.ok(productoService.listar());
    }

    @GetMapping("/buscar/{codigo}")
    public ResponseEntity<?> buscarPorCodigo(@PathVariable String codigo) {
        try {
            return ResponseEntity.ok(productoService.buscarPorCodigo(codigo));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> crear(@RequestBody ProductoRequest request) {
        try {
            return ResponseEntity.ok(productoService.crear(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> actualizar(@PathVariable String id, @RequestBody ProductoRequest request) {
        try {
            return ResponseEntity.ok(productoService.actualizar(id, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> eliminar(@PathVariable String id) {
        try {
            productoService.eliminar(id);
            return ResponseEntity.ok(Map.of("mensaje", "Producto desactivado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ───────── Stock ─────────

    @PostMapping("/{id}/stock/entrada")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> ingresoStock(@PathVariable String id, @RequestBody IngresoStockRequest req) {
        try {
            return ResponseEntity.ok(productoService.ingresoStock(id, req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/stock/ajuste")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<?> ajusteStock(@PathVariable String id, @RequestBody AjusteStockRequest req) {
        try {
            return ResponseEntity.ok(productoService.ajustarStock(id, req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/movimientos")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<List<MovimientoStockResponse>> movimientos(@PathVariable String id) {
        return ResponseEntity.ok(productoService.getMovimientos(id));
    }

    @GetMapping("/movimientos")
    @PreAuthorize("hasRole('JEFE')")
    public ResponseEntity<List<MovimientoStockResponse>> movimientosRecientes() {
        return ResponseEntity.ok(productoService.getMovimientosRecientes());
    }
}
