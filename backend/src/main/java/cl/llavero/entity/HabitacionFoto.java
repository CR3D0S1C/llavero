package cl.llavero.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "habitacion_fotos")
@Getter @Setter @NoArgsConstructor
public class HabitacionFoto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habitacion_id", nullable = false)
    private Habitacion habitacion;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(nullable = false)
    private Integer orden = 0;

    @Column(nullable = false)
    private Boolean esPortada = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
