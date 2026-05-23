package cl.llavero.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter
public class ArqueoRequest {
    // Desglose por método de pago (declarado por el cajero)
    private BigDecimal efectivo;
    private BigDecimal transferencia;
    private BigDecimal tarjetaDebito;
    private BigDecimal tarjetaCredito;
    private BigDecimal otro;

    // Conteo de billetes y monedas
    private Integer b20000;
    private Integer b10000;
    private Integer b5000;
    private Integer b2000;
    private Integer b1000;
    private Integer m500;
    private Integer m100;
    private Integer m50;
    private Integer m10;

    private String observacion;
    private String pin;
}
