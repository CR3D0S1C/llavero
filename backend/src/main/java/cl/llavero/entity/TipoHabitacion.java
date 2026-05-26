package cl.llavero.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tipos_habitacion")
@Getter @Setter @NoArgsConstructor
public class TipoHabitacion {

    @Id
    private String id;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(nullable = false, length = 20)
    private String bano;

    @Column(length = 10)
    private String color;

    @Column(length = 500)
    private String amenidades;
}
