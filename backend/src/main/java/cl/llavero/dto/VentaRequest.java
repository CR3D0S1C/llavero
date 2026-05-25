package cl.llavero.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class VentaRequest {
    private String habitacionId;        // null si tipoVenta = minimarket
    private String tipoVenta;           // "hostal" (default) o "minimarket"
    private String tipoDte;
    private String observacion;
    private String duracion;
    private String earlyCheckin; // "sin_costo", "con_costo", "hoy" — solo para noche entre 00-12
    private List<VentaItemRequest> items;

    // Receptor (solo para factura)
    private String receptorRut;
    private String receptorRazon;
    private String receptorGiro;
    private String receptorDireccion;
    private String receptorComuna;
    private String receptorCiudad;
    private String receptorEmail;

    // Método de pago
    private String metodoPago;          // "efectivo" | "transferencia" | "debito" | "credito" | "otro"
    private BigDecimal montoPagado;     // solo para efectivo (puede ser >= total para calcular vuelto)
    private String codigoTransaccion;   // para transferencia / débito / crédito / otro
}
