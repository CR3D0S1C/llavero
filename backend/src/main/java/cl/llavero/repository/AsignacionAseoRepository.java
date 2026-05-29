package cl.llavero.repository;

import cl.llavero.entity.AsignacionAseo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AsignacionAseoRepository extends JpaRepository<AsignacionAseo, UUID> {

    List<AsignacionAseo> findByFechaOrderByMucamaNombreAsc(LocalDate fecha);

    List<AsignacionAseo> findByMucamaIdAndFechaOrderByCreadoAtAsc(UUID mucamaId, LocalDate fecha);

    // Verifica si una habitación ya tiene asignación activa (no completada) en esa fecha
    @Query("SELECT a FROM AsignacionAseo a WHERE a.habitacion.id = :habId AND a.fecha = :fecha AND a.estado <> 'completado'")
    Optional<AsignacionAseo> findActivaByHabitacionIdAndFecha(
        @Param("habId") UUID habId,
        @Param("fecha") LocalDate fecha
    );
}
