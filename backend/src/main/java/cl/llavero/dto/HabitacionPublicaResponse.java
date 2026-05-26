package cl.llavero.dto;

import cl.llavero.entity.Habitacion;
import cl.llavero.entity.HabitacionFoto;
import cl.llavero.entity.HabitacionPrecio;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record HabitacionPublicaResponse(
    UUID id,
    String numero,
    String tipoLabel,
    String bano,
    String color,
    String amenidades,
    String descripcionWeb,
    Integer capacidadMax,
    String estadoPublico,
    List<PrecioDto> precios,
    List<FotoDto> fotos
) {

    public record PrecioDto(Integer personas, String duracion, BigDecimal precio) {}
    public record FotoDto(UUID id, String url, Boolean esPortada, Integer orden) {}

    public static HabitacionPublicaResponse from(Habitacion h) {
        List<PrecioDto> precios = h.getPrecios().stream()
            .map(p -> new PrecioDto(p.getPersonas(), p.getDuracion(), p.getPrecio()))
            .toList();

        List<FotoDto> fotos = h.getFotos().stream()
            .map(f -> new FotoDto(f.getId(), f.getUrl(), f.getEsPortada(), f.getOrden()))
            .toList();

        String estadoPublico = switch (h.getEstado()) {
            case libre -> "disponible";
            case reservado -> "reservado";
            case ocupado, aseo -> "ocupado";
            case mantenimiento, deshabilitada -> "no_disponible";
        };

        return new HabitacionPublicaResponse(
            h.getId(),
            h.getNumero(),
            h.getTipo() != null ? h.getTipo().getLabel() : "",
            h.getTipo() != null ? h.getTipo().getBano() : "",
            h.getTipo() != null ? h.getTipo().getColor() : "",
            h.getTipo() != null ? h.getTipo().getAmenidades() : null,
            h.getDescripcionWeb(),
            h.getCapacidadMax(),
            estadoPublico,
            precios,
            fotos
        );
    }
}
