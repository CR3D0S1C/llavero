package cl.llavero.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
public class VentaResponse {
    private String id;
    private String turnoId;
    private String cajero;
    private String habitacionNumero;
    private String habitacionTipo;
    private LocalDate fecha;
    private LocalTime hora;
    private LocalDateTime createdAt;
    private String observacion;
    private BigDecimal total;
    private String tipoDte;
    private String tipoVenta;        // "hostal" o "minimarket"
    private String dteEstado;
    private String duracion;
    private java.time.LocalDateTime salidaEstimada;

    // Receptor factura
    private String receptorRut;
    private String receptorRazon;
    private String receptorGiro;
    private String receptorDireccion;
    private String receptorComuna;
    private String receptorCiudad;
    private String receptorEmail;

    // Método de pago
    private String metodoPago;
    private BigDecimal montoPagado;
    private BigDecimal vuelto;
    private String codigoTransaccion;

    private List<VentaItemResponse> items;
}
