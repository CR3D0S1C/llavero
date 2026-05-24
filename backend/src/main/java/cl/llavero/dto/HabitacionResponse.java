package cl.llavero.dto;

import lombok.Data;

import java.util.List;

@Data
public class HabitacionResponse {
    private String id;
    private String numero;
    private String codigoBarras;
    private String tipoId;
    private String tipoLabel;
    private String bano;
    private String color;
    private String descripcion;
    private String estado;
    private String nota;
    private Boolean activa;
    private List<HabitacionPrecioDto> precios;
    private java.time.LocalDateTime salidaEstimada;
}
