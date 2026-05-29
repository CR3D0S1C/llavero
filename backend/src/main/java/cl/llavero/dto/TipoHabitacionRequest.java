package cl.llavero.dto;

public record TipoHabitacionRequest(
    String id,
    String label,
    String bano,
    String color,
    String amenidades
) {}
