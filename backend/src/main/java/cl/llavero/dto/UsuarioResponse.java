package cl.llavero.dto;

import cl.llavero.entity.Usuario;
import lombok.Getter;

import java.util.UUID;

@Getter
public class UsuarioResponse {
    private final UUID id;
    private final String nombre;
    private final String rol;
    private final Boolean activo;

    public UsuarioResponse(Usuario u) {
        this.id     = u.getId();
        this.nombre = u.getNombre();
        this.rol    = u.getRol().name();
        this.activo = u.getActivo();
    }
}
