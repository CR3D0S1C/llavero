package cl.llavero.dto;

import java.math.BigDecimal;

public record AgregarCargoRequest(
    String tipo,
    String descripcion,
    Integer cantidad,
    BigDecimal precioUnitario
) {}
