package cl.llavero.config;

import cl.llavero.entity.*;
import cl.llavero.repository.*;
import cl.llavero.service.AuthService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;

    public DataInitializer(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // Desactiva todos los usuarios existentes
        usuarioRepository.findAll().forEach(u -> {
            u.setActivo(false);
            usuarioRepository.save(u);
        });

        // Garantiza los 3 usuarios base con PIN conocido
        upsert("admin",  Rol.jefe,   "1271");
        upsert("cajero", Rol.cajero, "1891");
        upsert("mucama", Rol.aseo,   "1441");
    }

    private void upsert(String nombre, Rol rol, String pin) {
        String hash = AuthService.sha256(pin);
        usuarioRepository.findByNombreIgnoreCaseAndActivoTrue(nombre)
            .ifPresentOrElse(u -> {
                u.setPinHash(hash);
                u.setRol(rol);
                u.setActivo(true);
                usuarioRepository.save(u);
            }, () -> {
                // Buscar también entre los inactivos
                usuarioRepository.findAll().stream()
                    .filter(u -> u.getNombre().equalsIgnoreCase(nombre))
                    .findFirst()
                    .ifPresentOrElse(u -> {
                        u.setPinHash(hash);
                        u.setRol(rol);
                        u.setActivo(true);
                        usuarioRepository.save(u);
                    }, () -> {
                        Usuario u = new Usuario();
                        u.setNombre(nombre);
                        u.setRol(rol);
                        u.setPinHash(hash);
                        u.setActivo(true);
                        usuarioRepository.save(u);
                    });
            });
    }
}
