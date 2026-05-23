package cl.llavero.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class VentaItemResponse {
    private String tipo;
    private String descripcion;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
    private Boolean esLibre;
}
