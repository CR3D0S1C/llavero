package cl.llavero.repository;

import cl.llavero.entity.HabitacionFoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface HabitacionFotoRepository extends JpaRepository<HabitacionFoto, UUID> {
    List<HabitacionFoto> findByHabitacionIdOrderByOrden(UUID habitacionId);
    void deleteByHabitacionId(UUID habitacionId);
}
