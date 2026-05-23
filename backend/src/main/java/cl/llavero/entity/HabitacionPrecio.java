package cl.llavero.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "habitacion_precios")
@Getter @Setter @NoArgsConstructor
public class HabitacionPrecio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habitacion_id")
    private Habitacion habitacion;

    @Column(nullable = false)
    private Integer personas;

    @Column(nullable = false, length = 10)
    private String duracion;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;
}
