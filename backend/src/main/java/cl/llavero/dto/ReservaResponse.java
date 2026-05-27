package cl.llavero.dto;

import cl.llavero.entity.EstadoReserva;
import cl.llavero.entity.Reserva;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record ReservaResponse(
    UUID id,
    UUID huespedId,
    String huespedNombre,
    String huespedEmail,
    UUID habitacionId,
    String habitacionNumero,
    String habitacionTipo,
    LocalDate fechaEntrada,
    LocalDate fechaSalida,
    EstadoReserva estado,
    BigDecimal montoEstimado,
    String notas,
    Integer personas,
    Boolean conEstacionamiento,
    LocalDateTime createdAt
) {
    public static ReservaResponse from(Reserva r) {
        return new ReservaResponse(
            r.getId(),
            r.getHuesped().getId(),
            r.getHuesped().getNombre(),
            r.getHuesped().getEmail(),
            r.getHabitacion().getId(),
            r.getHabitacion().getNumero(),
            r.getHabitacion().getTipo() != null ? r.getHabitacion().getTipo().getLabel() : "",
            r.getFechaEntrada(),
            r.getFechaSalida(),
            r.getEstado(),
            r.getMontoEstimado(),
            r.getNotas(),
            r.getPersonas(),
            r.getConEstacionamiento(),
            r.getCreatedAt()
        );
    }
}
