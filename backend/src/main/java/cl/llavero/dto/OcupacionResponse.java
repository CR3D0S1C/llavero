package cl.llavero.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
public class OcupacionResponse {

    private List<MesStats> meses;
    private List<TipoStats> porTipo;
    private List<DiaStats> porDiaSemana;
    private ComparativoMes comparativo;

    @Getter @Setter
    public static class MesStats {
        private String mes;
        private int anio;
        private int numeroMes;
        private int ventas;
        private BigDecimal ingresos;
        private double tasaOcupacion;
        private int nochesVendidas;
        private int capacidadTotal;
    }

    @Getter @Setter
    public static class TipoStats {
        private String tipo;
        private BigDecimal total;
        private int ventas;
    }

    @Getter @Setter
    public static class DiaStats {
        private String dia;
        private int ventas;
        private BigDecimal total;
    }

    @Getter @Setter
    public static class ComparativoMes {
        private String labelMesActual;
        private String labelMesAnterior;
        private BigDecimal ingresosMesActual;
        private BigDecimal ingresosMesAnterior;
        private int ventasMesActual;
        private int ventasMesAnterior;
        private double variacionPct;
    }
}
