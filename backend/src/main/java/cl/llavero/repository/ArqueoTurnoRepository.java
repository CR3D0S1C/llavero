package cl.llavero.repository;

import cl.llavero.entity.ArqueoTurno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ArqueoTurnoRepository extends JpaRepository<ArqueoTurno, UUID> {
    Optional<ArqueoTurno> findByTurnoId(UUID turnoId);
}
