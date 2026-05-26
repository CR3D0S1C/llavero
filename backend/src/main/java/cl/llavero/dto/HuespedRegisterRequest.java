package cl.llavero.dto;

public record HuespedRegisterRequest(
    String nombre,
    String email,
    String password,
    String telefono
) {}
