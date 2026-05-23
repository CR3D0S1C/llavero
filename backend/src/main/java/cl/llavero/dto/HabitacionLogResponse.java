package cl.llavero.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class HabitacionLogResponse {
    private String habitacionNumero;
    private String habitacionTipo;
    private String estadoAnterior;
    private String estadoNuevo;
    private String usuarioNombre;
    private String fecha;
    private String hora;
}
