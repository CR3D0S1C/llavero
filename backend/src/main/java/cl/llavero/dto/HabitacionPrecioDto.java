package cl.llavero.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class HabitacionPrecioDto {
    private Integer personas;
    private String duracion;
    private BigDecimal precio;
}
