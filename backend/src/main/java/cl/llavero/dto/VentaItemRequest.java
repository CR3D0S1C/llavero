package cl.llavero.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class VentaItemRequest {
    private String tipo;
    private String descripcion;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private Boolean esLibre;
}
