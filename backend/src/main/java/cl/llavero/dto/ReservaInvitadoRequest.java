package cl.llavero.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ReservaInvitadoRequest(
    String nombre,
    String email,
    String telefono,
    UUID habitacionId,
    LocalDate fechaEntrada,
    LocalDate fechaSalida,
    String notas,
    Integer personas,
    Boolean conEstacionamiento,
    BigDecimal montoEstimado
) {}
