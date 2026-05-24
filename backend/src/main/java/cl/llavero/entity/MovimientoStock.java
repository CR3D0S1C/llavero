package cl.llavero.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "movimientos_stock")
@Getter @Setter @NoArgsConstructor
public class MovimientoStock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20)")
    private TipoMovimiento tipo;

    @Column(nullable = false)
    private Integer cantidad;             // magnitud del cambio (siempre positivo)

    @Column(name = "stock_anterior")
    private Integer stockAnterior;

    @Column(name = "stock_nuevo")
    private Integer stockNuevo;

    @Column(length = 200)
    private String motivo;

    @Column(name = "usuario_nombre", length = 100)
    private String usuarioNombre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venta_id")
    private Venta venta;                  // null si no es por venta

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
