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
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final TurnoRepository turnoRepository;
    private final JwtUtil jwtUtil;

    // Brute-force protection: username → [conteo_fallos, timestamp_primer_fallo]
    private final ConcurrentHashMap<String, long[]> intentosFallidos = new ConcurrentHashMap<>();
    private static final int MAX_INTENTOS = 5;
    private static final long BLOQUEO_MS = 30 * 60 * 1000L; // 30 minutos

    public AuthService(UsuarioRepository usuarioRepository,
                       TurnoRepository turnoRepository,
                       JwtUtil jwtUtil) {
        this.usuarioRepository = usuarioRepository;
        this.turnoRepository = turnoRepository;
        this.jwtUtil = jwtUtil;
    }

    private void verificarBloqueo(String nombre) {
        long[] data = intentosFallidos.get(nombre.toLowerCase());
        if (data == null) return;
        if (data[0] >= MAX_INTENTOS) {
            long restante = (data[1] + BLOQUEO_MS) - System.currentTimeMillis();
            if (restante > 0) {
                long min = (restante / 60000) + 1;
                throw new RuntimeException("Cuenta bloqueada por demasiados intentos. Intenta en " + min + " min.");
            }
            intentosFallidos.remove(nombre.toLowerCase());
        }
    }

    private void registrarFallo(String nombre) {
        intentosFallidos.compute(nombre.toLowerCase(), (k, data) -> {
            if (data == null) return new long[]{1, System.currentTimeMillis()};
            return new long[]{data[0] + 1, data[1]};
        });
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        verificarBloqueo(request.getNombre());

        Usuario usuario = usuarioRepository
                .findByNombreIgnoreCaseAndActivoTrue(request.getNombre())
                .orElseThrow(() -> new RuntimeException("Usuario o PIN incorrecto"));

        String pinHash = sha256(request.getPin());
        if (!pinHash.equals(usuario.getPinHash())) {
            registrarFallo(request.getNombre());
            throw new RuntimeException("Usuario o PIN incorrecto");
        }
        intentosFallidos.remove(request.getNombre().toLowerCase());

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
