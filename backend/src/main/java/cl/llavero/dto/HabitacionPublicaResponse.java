package cl.llavero.dto;

import cl.llavero.entity.Habitacion;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record HabitacionPublicaResponse(
    UUID id,
    String numero,
    String tipoId,
    String tipoLabel,
    String bano,
    String color,
    String amenidades,
    String descripcionWeb,
    Integer capacidadMax,
    String estadoPublico,
    List<PrecioDto> precios,
    List<FotoDto> fotos,
    List<TarifaDto> tarifasTemporada
) {

    public record PrecioDto(Integer personas, String duracion, BigDecimal precio) {}
    public record FotoDto(UUID id, String url, Boolean esPortada, Integer orden) {}
    public record TarifaDto(UUID id, String label, LocalDate fechaDesde, LocalDate fechaHasta, BigDecimal precio) {}

    public static HabitacionPublicaResponse from(Habitacion h) {
        List<PrecioDto> precios = h.getPrecios().stream()
            .map(p -> new PrecioDto(p.getPersonas(), p.getDuracion(), p.getPrecio()))
            .toList();

        List<FotoDto> fotos = h.getFotos().stream()
            .map(f -> new FotoDto(f.getId(), f.getUrl(), f.getEsPortada(), f.getOrden()))
            .toList();

        List<TarifaDto> tarifas = h.getTipo() != null
            ? h.getTipo().getTarifas().stream()
                .map(t -> new TarifaDto(t.getId(), t.getLabel(), t.getFechaDesde(), t.getFechaHasta(), t.getPrecio()))
                .toList()
            : List.of();

        String estadoPublico = switch (h.getEstado()) {
            case libre -> "disponible";
            case reservado -> "reservado";
            case ocupado, aseo -> "ocupado";
            case mantenimiento, deshabilitada -> "no_disponible";
        };

        return new HabitacionPublicaResponse(
            h.getId(),
            h.getNumero(),
            h.getTipo() != null ? h.getTipo().getId() : null,
            h.getTipo() != null ? h.getTipo().getLabel() : "",
            h.getTipo() != null ? h.getTipo().getBano() : "",
            h.getTipo() != null ? h.getTipo().getColor() : "",
            h.getTipo() != null ? h.getTipo().getAmenidades() : null,
            h.getDescripcionWeb(),
            h.getCapacidadMax(),
            estadoPublico,
            precios,
            fotos,
            tarifas
        );
    }
}
