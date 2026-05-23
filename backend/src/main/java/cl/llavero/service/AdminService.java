package cl.llavero.service;

import cl.llavero.dto.MetricasResponse;
import cl.llavero.entity.EstadoHabitacion;
import cl.llavero.entity.Habitacion;
import cl.llavero.entity.Venta;
import cl.llavero.repository.HabitacionRepository;
import cl.llavero.repository.VentaRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final VentaRepository ventaRepository;
    private final HabitacionRepository habitacionRepository;

    public AdminService(VentaRepository ventaRepository, HabitacionRepository habitacionRepository) {
        this.ventaRepository = ventaRepository;
        this.habitacionRepository = habitacionRepository;
    }

    public MetricasResponse getMetricas() {
        List<Venta> todas = ventaRepository.findAllOrderByCreatedAtDesc();
        List<Venta> hoy = ventaRepository.findByFecha(LocalDate.now());
        List<Venta> semana = ventaRepository.findByFechaDesde(LocalDate.now().minusDays(7));
        List<Habitacion> habitaciones = habitacionRepository.findByActivaTrueOrderByNumero();

        MetricasResponse r = new MetricasResponse();
        r.setTotalHoy(sumar(hoy));
        r.setTotalSemana(sumar(semana));
        r.setTotalGeneral(sumar(todas));
        r.setVentasHoy((long) hoy.size());
        r.setVentasSemana((long) semana.size());
        r.setVentasTotal((long) todas.size());

        Map<String, Long> porEstado = habitaciones.stream()
                .collect(Collectors.groupingBy(h -> h.getEstado().name(), Collectors.counting()));
        for (EstadoHabitacion e : EstadoHabitacion.values()) {
            porEstado.putIfAbsent(e.name(), 0L);
        }
        r.setHabitacionesPorEstado(porEstado);

        return r;
    }

    private BigDecimal sumar(List<Venta> ventas) {
        return ventas.stream()
                .map(Venta::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
