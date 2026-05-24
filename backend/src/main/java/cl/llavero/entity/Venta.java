package cl.llavero.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "ventas")
@Getter @Setter @NoArgsConstructor
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "turno_id")
    private Turno turno;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habitacion_id")
    private Habitacion habitacion;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private LocalTime hora;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "salida_estimada")
    private LocalDateTime salidaEstimada;

    @Column(length = 10)
    private String duracion;

    @Column(columnDefinition = "TEXT")
    private String observacion;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_dte", nullable = false, columnDefinition = "varchar(10)")
    private TipoDte tipoDte = TipoDte.boleta;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_venta", columnDefinition = "varchar(20)")
    private TipoVenta tipoVenta = TipoVenta.hostal;

    @Column(name = "receptor_rut", length = 15)
    private String receptorRut;

    @Column(name = "receptor_razon", length = 200)
    private String receptorRazon;

    @Column(name = "receptor_giro", length = 200)
    private String receptorGiro;

    @Column(name = "receptor_direccion", length = 300)
    private String receptorDireccion;

    @Column(name = "receptor_comuna", length = 100)
    private String receptorComuna;

    @Column(name = "receptor_ciudad", length = 100)
    private String receptorCiudad;

    @Column(name = "receptor_email", length = 150)
    private String receptorEmail;

    @OneToMany(mappedBy = "venta", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private List<VentaItem> items = new ArrayList<>();
}
