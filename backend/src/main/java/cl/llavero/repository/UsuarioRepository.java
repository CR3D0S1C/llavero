package cl.llavero.repository;

import cl.llavero.entity.Rol;
import cl.llavero.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    Optional<Usuario> findByNombreIgnoreCaseAndActivoTrue(String nombre);
    List<Usuario> findByRolAndActivoTrueOrderByNombre(Rol rol);
    List<Usuario> findByRolInAndActivoTrueOrderByNombre(List<Rol> roles);
}
