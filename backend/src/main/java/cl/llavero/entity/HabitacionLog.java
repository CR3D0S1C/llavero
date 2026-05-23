package cl.llavero.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "habitacion_logs")
@Getter @Setter @NoArgsConstructor
public class HabitacionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habitacion_id")
    private Habitacion habitacion;

    @Column(name = "usuario_nombre", length = 100)
    private String usuarioNombre;

    @Column(name = "estado_anterior", columnDefinition = "varchar(30)")
    private String estadoAnterior;

    @Column(name = "estado_nuevo", columnDefinition = "varchar(30)")
    private String estadoNuevo;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
