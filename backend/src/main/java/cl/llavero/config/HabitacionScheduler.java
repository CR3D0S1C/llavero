package cl.llavero.config;

import cl.llavero.entity.EstadoHabitacion;
import cl.llavero.repository.HabitacionRepository;
import cl.llavero.repository.ReservaRepository;
import cl.llavero.service.HabitacionService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
public class HabitacionScheduler {

    private final HabitacionService habitacionService;
    private final ReservaRepository reservaRepository;
    private final HabitacionRepository habitacionRepository;

    public HabitacionScheduler(HabitacionService habitacionService,
                                ReservaRepository reservaRepository,
                                HabitacionRepository habitacionRepository) {
        this.habitacionService = habitacionService;
        this.reservaRepository = reservaRepository;
        this.habitacionRepository = habitacionRepository;
    }

    // Cada minuto verifica habitaciones vencidas hace más de 30 min → aseo automático
    @Scheduled(fixedDelay = 60000)
    public void verificarSalidas() {
        habitacionService.autoAseoVencidas();
    }

    // Cada día a las 00:05 marca como 'reservado' las habitaciones con check-in hoy
    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void marcarHabitacionesReservadas() {
        reservaRepository.findConfirmadasParaHoy(LocalDate.now()).forEach(r -> {
            var hab = r.getHabitacion();
            if (hab.getEstado() == EstadoHabitacion.libre) {
                hab.setEstado(EstadoHabitacion.reservado);
                habitacionRepository.save(hab);
            }
        });
    }
}
