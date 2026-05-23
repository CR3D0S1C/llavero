package cl.llavero.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class DteQueueResponse {
    private String id;
    private String ventaId;
    private String tipoDte;
    private String estado;
    private LocalDateTime createdAt;
    private LocalDateTime emitidoAt;

    // Datos de la venta para emitir manualmente en SII
    private String habitacion;
    private String cajero;
    private BigDecimal total;

    // Receptor (solo factura)
    private String receptorRut;
    private String receptorRazon;
    private String receptorGiro;
    private String receptorDireccion;
    private String receptorComuna;
    private String receptorCiudad;
    private String receptorEmail;
}
