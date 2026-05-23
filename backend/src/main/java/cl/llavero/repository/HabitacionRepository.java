package cl.llavero.repository;

import cl.llavero.entity.Habitacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface HabitacionRepository extends JpaRepository<Habitacion, UUID> {
    List<Habitacion> findByActivaTrueOrderByNumero();
}
