package cl.llavero.entity;

public enum TipoMovimiento {
    entrada,    // Ingreso de mercadería (compra)
    salida,     // Salida por venta
    ajuste,     // Corrección manual al hacer inventario físico
    devolucion  // Reverso por anulación de venta
}
