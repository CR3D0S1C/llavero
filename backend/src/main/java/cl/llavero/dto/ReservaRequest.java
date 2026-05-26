package cl.llavero.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ReservaRequest(
    UUID habitacionId,
    LocalDate fechaEntrada,
    LocalDate fechaSalida,
    String notas
) {}
