package cl.llavero.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "tarifas_temporada")
@Getter @Setter @NoArgsConstructor
public class TarifaTemporada {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_id", nullable = false)
    @JsonIgnoreProperties({"tarifas", "hibernateLazyInitializer"})
    private TipoHabitacion tipo;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(name = "fecha_desde", nullable = false)
    private LocalDate fechaDesde;

    @Column(name = "fecha_hasta", nullable = false)
    private LocalDate fechaHasta;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precio;
}
