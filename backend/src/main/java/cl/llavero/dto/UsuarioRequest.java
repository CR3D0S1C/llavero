package cl.llavero.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UsuarioRequest {
    private String nombre;
    private String rol;    // "jefe" o "cajero"
    private String pin;    // obligatorio al crear, opcional al editar
}
