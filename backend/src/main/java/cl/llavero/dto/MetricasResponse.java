package cl.llavero.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class MetricasResponse {
    private BigDecimal totalHoy;
    private BigDecimal totalSemana;
    private BigDecimal totalGeneral;
    private Long ventasHoy;
    private Long ventasSemana;
    private Long ventasTotal;
    private Map<String, Long> habitacionesPorEstado;
    private List<ProductoBajoStock> productosBajoStock;

    @Data
    public static class ProductoBajoStock {
        private String nombre;
        private String icono;
        private int stock;
        private int stockMinimo;
    }
}
