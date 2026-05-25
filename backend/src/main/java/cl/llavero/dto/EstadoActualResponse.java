package cl.llavero.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
public class EstadoActualResponse {

    private BigDecimal totalDia;
    private int ventasDia;
    private List<TurnoActivoDto> turnosActivos;
    private List<HabitacionOcupadaDto> habitacionesOcupadas;
    private List<String> cajerosSinTurno;
    private int dtePendientes;

    @Getter @Setter
    public static class TurnoActivoDto {
        private String cajeroNombre;
        private LocalDateTime inicio;
        private BigDecimal totalTurno;
        private int cantidadVentas;
    }

    @Getter @Setter
    public static class HabitacionOcupadaDto {
        private String numero;
        private String tipo;
        private LocalDateTime salidaEstimada;
        private boolean vencida;
    }
}
