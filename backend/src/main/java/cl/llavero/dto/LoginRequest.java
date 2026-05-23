package cl.llavero.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String nombre;
    private String pin;
}
