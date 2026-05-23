package cl.llavero.config;

import cl.llavero.service.HabitacionService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class HabitacionScheduler {

    private final HabitacionService habitacionService;

    public HabitacionScheduler(HabitacionService habitacionService) {
        this.habitacionService = habitacionService;
    }

    // Cada minuto verifica habitaciones vencidas hace más de 30 min → aseo automático
    @Scheduled(fixedDelay = 60000)
    public void verificarSalidas() {
        habitacionService.autoAseoVencidas();
    }
}
