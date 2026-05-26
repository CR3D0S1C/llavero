package cl.llavero.repository;

import cl.llavero.entity.Huesped;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface HuespedRepository extends JpaRepository<Huesped, UUID> {
    Optional<Huesped> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
}
