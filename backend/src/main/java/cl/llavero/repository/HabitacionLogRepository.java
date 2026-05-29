package cl.llavero.repository;

import cl.llavero.entity.HabitacionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface HabitacionLogRepository extends JpaRepository<HabitacionLog, UUID> {
    List<HabitacionLog> findTop100ByOrderByCreatedAtDesc();
    List<HabitacionLog> findByUsuarioNombreAndCreatedAtAfter(String nombre, LocalDateTime desde);

    @Query("SELECT l FROM HabitacionLog l JOIN FETCH l.habitacion h WHERE h.id IN :ids AND l.estadoNuevo = 'aseo' ORDER BY l.createdAt DESC")
    List<HabitacionLog> findUltimasEntradasAseo(@Param("ids") List<UUID> ids);

    @Query("SELECT l FROM HabitacionLog l JOIN FETCH l.habitacion WHERE l.estadoAnterior = 'aseo' AND l.estadoNuevo = 'libre' AND l.createdAt >= :desde ORDER BY l.createdAt DESC")
    List<HabitacionLog> findAseoCompletadosDesde(@Param("desde") LocalDateTime desde);
}
