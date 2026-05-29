package cl.llavero;

import cl.llavero.entity.Rol;
import cl.llavero.entity.Turno;
import cl.llavero.entity.Usuario;
import cl.llavero.repository.TurnoRepository;
import cl.llavero.repository.UsuarioRepository;
import cl.llavero.security.JwtUtil;
import cl.llavero.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public abstract class TestBase {

    @Autowired protected MockMvc mvc;
    @Autowired protected ObjectMapper json;
    @Autowired protected JwtUtil jwtUtil;
    @Autowired protected UsuarioRepository usuarioRepo;
    @Autowired protected TurnoRepository turnoRepo;

    protected Usuario crearUsuario(String nombre, Rol rol, String pin) {
        Usuario u = new Usuario();
        u.setNombre(nombre);
        u.setRol(rol);
        u.setPinHash(AuthService.sha256(pin));
        u.setActivo(true);
        String sid = UUID.randomUUID().toString();
        u.setSessionId(sid);
        return usuarioRepo.save(u);
    }

    protected String tokenPara(Usuario u) {
        Turno turno = turnoRepo.findByUsuarioIdAndCerradoFalse(u.getId()).orElseGet(() -> {
            Turno t = new Turno();
            t.setUsuario(u);
            t.setInicio(LocalDateTime.now());
            t.setCerrado(false);
            t.setTotalTurno(BigDecimal.ZERO);
            return turnoRepo.save(t);
        });
        return "Bearer " + jwtUtil.generarToken(
                u.getId().toString(),
                u.getNombre(),
                u.getRol().name(),
                turno.getId().toString(),
                u.getSessionId()
        );
    }

    protected String body(Object obj) throws Exception {
        return json.writeValueAsString(obj);
    }
}
