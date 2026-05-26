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

    @Column(name = "codigo_barras", length = 50, unique = true)
    private String codigoBarras;

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

    @Column(columnDefinition = "TEXT")
    private String descripcionWeb;

    @Column
    private Integer capacidadMax;

    @OneToMany(mappedBy = "habitacion", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private List<HabitacionPrecio> precios = new ArrayList<>();

    @OneToMany(mappedBy = "habitacion", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orden ASC")
    private List<HabitacionFoto> fotos = new ArrayList<>();
}
