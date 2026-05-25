package cl.llavero.config;

import cl.llavero.service.AdminService;
import cl.llavero.service.EmailService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ResumenDiarioScheduler {

    private final AdminService adminService;
    private final EmailService emailService;

    public ResumenDiarioScheduler(AdminService adminService, EmailService emailService) {
        this.adminService = adminService;
        this.emailService = emailService;
    }

    // Envía el resumen cada día a las 23:30
    @Scheduled(cron = "0 30 23 * * *")
    public void enviarResumenDiario() {
        System.out.println("[Scheduler] Enviando resumen diario...");
        emailService.enviarResumenDiarioAsync(adminService.getEstadoActual());
    }
}
