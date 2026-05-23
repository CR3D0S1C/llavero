package cl.llavero.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
public class ResumenTurnoResponse {

    private String turnoId;
    private String cajeroNombre;
    private LocalDateTime inicio;
    private Long duracionMinutos;

    private BigDecimal totalSistema;
    private Integer cantidadVentas;
    private Integer cantidadBoletas;
    private Integer cantidadFacturas;
    private Integer movimientosHabitaciones;
    private Integer limpiezasRealizadas;

    private List<ProductoVendidoDto> productosTop;
    private List<HabitacionVendidaDto> habitacionesTop;

    @Getter @Setter
    public static class ProductoVendidoDto {
        private String nombre;
        private Integer cantidad;
        private BigDecimal total;
        public ProductoVendidoDto() {}
        public ProductoVendidoDto(String n, Integer c, BigDecimal t) {
            this.nombre = n; this.cantidad = c; this.total = t;
        }
    }

    @Getter @Setter
    public static class HabitacionVendidaDto {
        private String tipo;
        private Integer cantidad;
        private BigDecimal total;
        public HabitacionVendidaDto() {}
        public HabitacionVendidaDto(String t, Integer c, BigDecimal tot) {
            this.tipo = t; this.cantidad = c; this.total = tot;
        }
    }
}
