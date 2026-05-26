package cl.llavero.service;

import cl.llavero.dto.HuespedLoginRequest;
import cl.llavero.dto.HuespedLoginResponse;
import cl.llavero.dto.HuespedRegisterRequest;
import cl.llavero.entity.Huesped;
import cl.llavero.repository.HuespedRepository;
import cl.llavero.security.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class HuespedService {

    private final HuespedRepository huespedRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public HuespedService(HuespedRepository huespedRepository, JwtUtil jwtUtil) {
        this.huespedRepository = huespedRepository;
        this.jwtUtil = jwtUtil;
    }

    public HuespedLoginResponse registrar(HuespedRegisterRequest req) {
        if (req.nombre() == null || req.nombre().isBlank())
            throw new IllegalArgumentException("El nombre es requerido");
        if (req.email() == null || req.email().isBlank())
            throw new IllegalArgumentException("El email es requerido");
        if (req.password() == null || req.password().length() < 6)
            throw new IllegalArgumentException("La contraseña debe tener al menos 6 caracteres");

        if (huespedRepository.existsByEmailIgnoreCase(req.email()))
            throw new IllegalArgumentException("Ya existe una cuenta con ese email");

        Huesped h = new Huesped();
        h.setNombre(req.nombre().trim());
        h.setEmail(req.email().toLowerCase().trim());
        h.setPasswordHash(encoder.encode(req.password()));
        h.setTelefono(req.telefono());
        huespedRepository.save(h);

        String token = jwtUtil.generarTokenHuesped(h.getId().toString(), h.getNombre(), h.getEmail());
        return new HuespedLoginResponse(token, h.getId(), h.getNombre(), h.getEmail());
    }

    public HuespedLoginResponse login(HuespedLoginRequest req) {
        Huesped h = huespedRepository.findByEmailIgnoreCase(req.email())
            .orElseThrow(() -> new IllegalArgumentException("Email o contraseña incorrectos"));

        if (!h.getActivo())
            throw new IllegalArgumentException("Cuenta desactivada");

        if (!encoder.matches(req.password(), h.getPasswordHash()))
            throw new IllegalArgumentException("Email o contraseña incorrectos");

        String token = jwtUtil.generarTokenHuesped(h.getId().toString(), h.getNombre(), h.getEmail());
        return new HuespedLoginResponse(token, h.getId(), h.getNombre(), h.getEmail());
    }

    public Huesped getById(UUID id) {
        return huespedRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Huésped no encontrado"));
    }
}
