package cl.llavero.dto;

import java.util.UUID;

public record HuespedLoginResponse(
    String token,
    UUID huespedId,
    String nombre,
    String email
) {}
