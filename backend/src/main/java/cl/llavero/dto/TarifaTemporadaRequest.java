package cl.llavero.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TarifaTemporadaRequest(
    String label,
    LocalDate fechaDesde,
    LocalDate fechaHasta,
    BigDecimal precio
) {}
