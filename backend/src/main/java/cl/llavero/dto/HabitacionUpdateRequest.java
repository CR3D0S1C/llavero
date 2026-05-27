package cl.llavero.dto;

import lombok.Data;

import java.util.List;

@Data
public class HabitacionUpdateRequest {
    private String estado;
    private String nota;
    private String descripcion;
    private String descripcionWeb;
    private Integer capacidadMax;
    private String codigoBarras;
    private List<HabitacionPrecioDto> precios;
}
