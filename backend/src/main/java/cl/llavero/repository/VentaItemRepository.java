package cl.llavero.repository;

import cl.llavero.entity.VentaItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VentaItemRepository extends JpaRepository<VentaItem, UUID> {
    List<VentaItem> findByVentaId(UUID ventaId);
}
