package cl.llavero.repository;

import cl.llavero.entity.DteQueue;
import cl.llavero.entity.EstadoDte;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DteQueueRepository extends JpaRepository<DteQueue, UUID> {
    List<DteQueue> findByEstadoOrderByCreatedAtDesc(EstadoDte estado);
    Optional<DteQueue> findByVentaId(UUID ventaId);
}
