package cl.llavero.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
public class ReporteResponse {
    private LocalDate desde;
    private LocalDate hasta;
    private int totalTransacciones;
    private BigDecimal totalGeneral;
    private Map<String, BigDecimal> porMetodoPago;
    private Map<String, Integer> cantidadPorMetodoPago;
    private BigDecimal totalHostal;
    private BigDecimal totalMinimarket;
    private int cantHostal;
    private int cantMinimarket;
    private List<VentaResponse> ventas;
}
