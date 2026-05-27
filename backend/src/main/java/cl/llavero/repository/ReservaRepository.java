package cl.llavero.repository;

import cl.llavero.entity.EstadoReserva;
import cl.llavero.entity.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ReservaRepository extends JpaRepository<Reserva, UUID> {

    List<Reserva> findByHuespedIdOrderByCreatedAtDesc(UUID huespedId);

    List<Reserva> findAllByOrderByCreatedAtDesc();

    List<Reserva> findByEstado(EstadoReserva estado);

    @Query("""
        SELECT r FROM Reserva r
        WHERE r.habitacion.id = :habitacionId
          AND r.estado IN ('pendiente', 'confirmada')
          AND r.fechaEntrada < :fechaSalida
          AND r.fechaSalida > :fechaEntrada
    """)
    List<Reserva> findSolapadas(
        @Param("habitacionId") UUID habitacionId,
        @Param("fechaEntrada") LocalDate fechaEntrada,
        @Param("fechaSalida") LocalDate fechaSalida
    );

    @Query("""
        SELECT r FROM Reserva r
        WHERE r.estado IN ('pendiente', 'confirmada')
          AND (r.fechaEntrada BETWEEN :desde AND :hasta
               OR r.fechaSalida = :desde)
        ORDER BY r.fechaEntrada ASC, r.createdAt ASC
    """)
    List<Reserva> findProximas(
        @Param("desde") LocalDate desde,
        @Param("hasta") LocalDate hasta
    );

    @Query("""
        SELECT DISTINCT r.habitacion.id FROM Reserva r
        WHERE r.estado IN ('pendiente', 'confirmada')
          AND r.fechaEntrada < :fechaSalida
          AND r.fechaSalida > :fechaEntrada
    """)
    List<UUID> findHabitacionIdsOcupadas(
        @Param("fechaEntrada") LocalDate fechaEntrada,
        @Param("fechaSalida") LocalDate fechaSalida
    );

    @Query("""
        SELECT COUNT(r) FROM Reserva r
        WHERE r.conEstacionamiento = true
          AND r.estado IN ('pendiente', 'confirmada')
          AND r.fechaEntrada < :fechaSalida
          AND r.fechaSalida > :fechaEntrada
    """)
    long countEstacionamientoSolapadas(
        @Param("fechaEntrada") LocalDate fechaEntrada,
        @Param("fechaSalida") LocalDate fechaSalida
    );
}
