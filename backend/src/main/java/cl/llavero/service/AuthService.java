package cl.llavero.service;

import cl.llavero.dto.LoginRequest;
import cl.llavero.dto.LoginResponse;
import cl.llavero.entity.Turno;
import cl.llavero.entity.Usuario;
import cl.llavero.repository.TurnoRepository;
import cl.llavero.repository.UsuarioRepository;
import cl.llavero.security.JwtUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final TurnoRepository turnoRepository;
    private final JwtUtil jwtUtil;

    public AuthService(UsuarioRepository usuarioRepository,
                       TurnoRepository turnoRepository,
                       JwtUtil jwtUtil) {
        this.usuarioRepository = usuarioRepository;
        this.turnoRepository = turnoRepository;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository
                .findByNombreIgnoreCaseAndActivoTrue(request.getNombre())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String pinHash = sha256(request.getPin());
        if (!pinHash.equals(usuario.getPinHash())) {
            throw new RuntimeException("PIN incorrecto");
        }

        // Buscar turno activo o crear uno nuevo
        Turno turno = turnoRepository
                .findByUsuarioIdAndCerradoFalse(usuario.getId())
                .orElseGet(() -> {
                    Turno nuevo = new Turno();
                    nuevo.setUsuario(usuario);
                    return turnoRepository.save(nuevo);
                });

        String sessionId = java.util.UUID.randomUUID().toString();
        usuario.setSessionId(sessionId);
        usuarioRepository.save(usuario);

        String token = jwtUtil.generarToken(
                usuario.getId().toString(),
                usuario.getNombre(),
                usuario.getRol().name(),
                turno.getId().toString(),
                sessionId
        );

        return new LoginResponse(
                token,
                usuario.getId().toString(),
                usuario.getNombre(),
                usuario.getRol().name(),
                turno.getId().toString()
        );
    }

    public static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
