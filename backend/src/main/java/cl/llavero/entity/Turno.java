package cl.llavero.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "turnos")
@Getter @Setter @NoArgsConstructor
public class Turno {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false)
    private LocalDateTime inicio = LocalDateTime.now();

    private LocalDateTime fin;

    @Column(nullable = false)
    private Boolean cerrado = false;

    @Column(columnDefinition = "TEXT")
    private String observacion;

    @Column(name = "total_turno", precision = 12, scale = 2)
    private BigDecimal totalTurno = BigDecimal.ZERO;
}
