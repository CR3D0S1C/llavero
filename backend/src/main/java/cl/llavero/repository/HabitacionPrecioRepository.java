package cl.llavero.repository;

import cl.llavero.entity.HabitacionPrecio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface HabitacionPrecioRepository extends JpaRepository<HabitacionPrecio, UUID> {
    List<HabitacionPrecio> findByHabitacionId(UUID habitacionId);
    void deleteByHabitacionId(UUID habitacionId);
}
