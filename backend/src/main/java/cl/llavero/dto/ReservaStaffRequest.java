package cl.llavero.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ReservaStaffRequest(
    UUID habitacionId,
    LocalDate fechaEntrada,
    LocalDate fechaSalida,
    String notas,
    String nombreHuesped,
    String emailHuesped,
    String telefonoHuesped
) {}
