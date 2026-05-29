package cl.llavero.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "asignaciones_aseo")
@Getter @Setter @NoArgsConstructor
public class AsignacionAseo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "habitacion_id", nullable = false)
    private Habitacion habitacion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mucama_id", nullable = false)
    private Usuario mucama;

    @Column(nullable = false)
    private LocalDate fecha;

    // "completo" (sala+baño+cama) | "general" (tendido, sin cambio de sábanas)
    @Column(name = "tipo_aseo", nullable = false, length = 20)
    private String tipoAseo = "completo";

    // "pendiente" | "en_proceso" | "completado"
    @Column(nullable = false, length = 20)
    private String estado = "pendiente";

    @Column(columnDefinition = "TEXT")
    private String notas;

    @Column(name = "creado_at")
    private LocalDateTime creadoAt = LocalDateTime.now();

    @Column(name = "iniciado_at")
    private LocalDateTime iniciadoAt;

    @Column(name = "completado_at")
    private LocalDateTime completadoAt;
}
