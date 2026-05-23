package cl.llavero.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductoRequest {
    private String nombre;
    private BigDecimal precio;
    private String icono;
    private String categoria;
}
