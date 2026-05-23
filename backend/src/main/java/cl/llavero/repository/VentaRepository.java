package cl.llavero.repository;

import cl.llavero.entity.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VentaRepository extends JpaRepository<Venta, UUID> {

    List<Venta> findByTurnoIdOrderByCreatedAtDesc(UUID turnoId);

    @Query("SELECT v FROM Venta v WHERE v.fecha = :fecha ORDER BY v.createdAt DESC")
    List<Venta> findByFecha(LocalDate fecha);

    @Query("SELECT v FROM Venta v WHERE v.fecha >= :desde ORDER BY v.createdAt DESC")
    List<Venta> findByFechaDesde(LocalDate desde);

    @Query("SELECT v FROM Venta v ORDER BY v.createdAt DESC")
    List<Venta> findAllOrderByCreatedAtDesc();

    Optional<Venta> findTopByHabitacionIdOrderByCreatedAtDesc(UUID habitacionId);
}
