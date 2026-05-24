package cl.llavero.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class MovimientoStockResponse {
    private String id;
    private String productoNombre;
    private String tipo;
    private Integer cantidad;
    private Integer stockAnterior;
    private Integer stockNuevo;
    private String motivo;
    private String usuarioNombre;
    private String fecha;
    private String hora;
}
