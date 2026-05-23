package cl.llavero.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "arqueos_turno")
@Getter @Setter @NoArgsConstructor
public class ArqueoTurno {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "turno_id", unique = true)
    private Turno turno;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalSistema = BigDecimal.ZERO;

    // Desglose declarado por método de pago
    @Column(precision = 12, scale = 2) private BigDecimal efectivo        = BigDecimal.ZERO;
    @Column(precision = 12, scale = 2) private BigDecimal transferencia   = BigDecimal.ZERO;
    @Column(name = "tarjeta_debito", precision = 12, scale = 2)  private BigDecimal tarjetaDebito  = BigDecimal.ZERO;
    @Column(name = "tarjeta_credito", precision = 12, scale = 2) private BigDecimal tarjetaCredito = BigDecimal.ZERO;
    @Column(precision = 12, scale = 2) private BigDecimal otro             = BigDecimal.ZERO;

    @Column(name = "total_declarado", precision = 12, scale = 2)
    private BigDecimal totalDeclarado = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal diferencia = BigDecimal.ZERO;

    // Conteo de billetes y monedas (cantidad de cada denominación)
    private Integer b20000 = 0;
    private Integer b10000 = 0;
    private Integer b5000  = 0;
    private Integer b2000  = 0;
    private Integer b1000  = 0;
    private Integer m500   = 0;
    private Integer m100   = 0;
    private Integer m50    = 0;
    private Integer m10    = 0;

    @Column(name = "total_conteo_efectivo", precision = 12, scale = 2)
    private BigDecimal totalConteoEfectivo = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String observacion;

    @Column(name = "cajero_nombre", length = 100)
    private String cajeroNombre;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
