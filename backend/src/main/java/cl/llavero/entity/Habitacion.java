package cl.llavero.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "habitaciones")
@Getter @Setter @NoArgsConstructor
public class Habitacion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 20)
    private String numero;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tipo_id")
    private TipoHabitacion tipo;

    @Column(length = 200)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(30)")
    private EstadoHabitacion estado = EstadoHabitacion.libre;

    @Column(length = 300)
    private String nota;

    @Column(nullable = false)
    private Boolean activa = true;

    @OneToMany(mappedBy = "habitacion", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private List<HabitacionPrecio> precios = new ArrayList<>();
}
