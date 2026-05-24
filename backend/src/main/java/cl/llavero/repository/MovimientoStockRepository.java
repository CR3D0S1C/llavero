package cl.llavero.repository;

import cl.llavero.entity.MovimientoStock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MovimientoStockRepository extends JpaRepository<MovimientoStock, UUID> {
    List<MovimientoStock> findTop100ByProductoIdOrderByCreatedAtDesc(UUID productoId);
    List<MovimientoStock> findTop200ByOrderByCreatedAtDesc();
}
