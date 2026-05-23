package cl.llavero.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String usuarioId;
    private String nombre;
    private String rol;
    private String turnoId;
}
