package cl.llavero.dto;

import java.math.BigDecimal;

public record CheckoutRequest(
    String metodoPago,
    BigDecimal montoPagado,
    String codigoTransaccion,
    String tipoDte,
    String observacion,
    String receptorRut,
    String receptorRazon,
    String receptorGiro,
    String receptorDireccion,
    String receptorComuna,
    String receptorCiudad,
    String receptorEmail
) {}
