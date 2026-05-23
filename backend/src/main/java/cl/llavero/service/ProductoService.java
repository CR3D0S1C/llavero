package cl.llavero.service;

import cl.llavero.dto.ProductoRequest;
import cl.llavero.entity.Producto;
import cl.llavero.repository.ProductoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    public List<Producto> listar() {
        return productoRepository.findByActivoTrueOrderByCategoria();
    }

    public Producto crear(ProductoRequest request) {
        Producto p = new Producto();
        p.setNombre(request.getNombre());
        p.setPrecio(request.getPrecio());
        p.setIcono(request.getIcono());
        p.setCategoria(request.getCategoria());
        return productoRepository.save(p);
    }

    public Producto actualizar(String id, ProductoRequest request) {
        Producto p = productoRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        p.setNombre(request.getNombre());
        p.setPrecio(request.getPrecio());
        p.setIcono(request.getIcono());
        p.setCategoria(request.getCategoria());
        return productoRepository.save(p);
    }

    public void eliminar(String id) {
        Producto p = productoRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        p.setActivo(false);
        productoRepository.save(p);
    }
}
