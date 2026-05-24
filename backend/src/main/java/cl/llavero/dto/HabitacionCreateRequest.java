package cl.llavero.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter @Setter
public class HabitacionCreateRequest {
    private String numero;
    private String tipoId;        // referencia a TipoHabitacion (ej. "matrimonial", "individual")
    private String descripcion;
    private List<HabitacionPrecioDto> precios;
}
