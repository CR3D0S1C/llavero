package cl.llavero.repository;

import cl.llavero.entity.EstadoHabitacion;
import cl.llavero.entity.Habitacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HabitacionRepository extends JpaRepository<Habitacion, UUID> {
    @Query("SELECT h FROM Habitacion h WHERE h.activa = true ORDER BY CAST(h.numero AS integer)")
    List<Habitacion> findByActivaTrueOrderByNumero();
    List<Habitacion> findByEstadoAndActivaTrue(EstadoHabitacion estado);
    Optional<Habitacion> findByCodigoBarrasAndActivaTrue(String codigoBarras);
    long countByTipoId(String tipoId);
}
