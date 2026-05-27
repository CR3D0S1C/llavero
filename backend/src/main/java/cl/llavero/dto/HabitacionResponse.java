package cl.llavero.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class HabitacionResponse {
    private String id;
    private String numero;
    private String codigoBarras;
    private String tipoId;
    private String tipoLabel;
    private String bano;
    private String color;
    private String amenidades;
    private String descripcion;
    private String descripcionWeb;
    private Integer capacidadMax;
    private String estado;
    private String nota;
    private Boolean activa;
    private List<HabitacionPrecioDto> precios;
    private List<FotoDto> fotos;
    private java.time.LocalDateTime salidaEstimada;

    @Data
    public static class FotoDto {
        private UUID id;
        private String url;
        private Boolean esPortada;
        private Integer orden;
    }
}
