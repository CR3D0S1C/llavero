package cl.llavero.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class AjusteStockRequest {
    private Integer stockNuevo;
    private String motivo;
}
