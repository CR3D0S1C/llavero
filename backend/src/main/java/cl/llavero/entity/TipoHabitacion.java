package cl.llavero.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

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

    @OneToMany(mappedBy = "tipo", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("fechaDesde ASC")
    @JsonIgnoreProperties("tipo")
    private List<TarifaTemporada> tarifas = new ArrayList<>();
}
