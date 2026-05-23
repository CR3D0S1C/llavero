package cl.llavero.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TurnoResponse {
    private String id;
    private String usuarioId;
    private String cajero;
    private LocalDateTime inicio;
    private LocalDateTime fin;
    private Boolean cerrado;
    private BigDecimal totalTurno;
    private List<VentaResponse> ventas;
}
