package cl.llavero.repository;

import cl.llavero.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductoRepository extends JpaRepository<Producto, UUID> {
    List<Producto> findByActivoTrueOrderByCategoria();
    Optional<Producto> findByCodigoBarrasAndActivoTrue(String codigoBarras);
}
