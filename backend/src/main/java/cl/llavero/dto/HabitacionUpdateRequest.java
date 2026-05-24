package cl.llavero.dto;

import lombok.Data;

import java.util.List;

@Data
public class HabitacionUpdateRequest {
    private String estado;
    private String nota;
    private String descripcion;
    private String codigoBarras;
    private List<HabitacionPrecioDto> precios;
}
