package cl.llavero.repository;

import cl.llavero.entity.TarifaTemporada;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TarifaTemporadaRepository extends JpaRepository<TarifaTemporada, UUID> {

    List<TarifaTemporada> findByTipoIdOrderByFechaDesdeAsc(String tipoId);

    // Tarifas cuyo rango solapa con [fechaDesde, fechaHasta]
    @Query("SELECT t FROM TarifaTemporada t WHERE t.tipo.id = :tipoId AND t.fechaDesde <= :hasta AND t.fechaHasta >= :desde")
    List<TarifaTemporada> findSolapadas(
        @Param("tipoId") String tipoId,
        @Param("desde") LocalDate desde,
        @Param("hasta") LocalDate hasta
    );
}
