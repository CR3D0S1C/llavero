package cl.llavero.repository;

import cl.llavero.entity.Turno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TurnoRepository extends JpaRepository<Turno, UUID> {
    Optional<Turno> findByUsuarioIdAndCerradoFalse(UUID usuarioId);

    @Query("SELECT t FROM Turno t WHERE t.inicio >= :desde ORDER BY t.inicio DESC")
    List<Turno> findTurnosDesde(LocalDateTime desde);
}
