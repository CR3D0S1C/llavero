package cl.llavero.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class IngresoStockRequest {
    private Integer cantidad;
    private String motivo;
}
