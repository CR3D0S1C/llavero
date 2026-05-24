package cl.llavero.service;

import cl.llavero.dto.ResumenTurnoResponse;
import cl.llavero.entity.ArqueoTurno;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final PdfService pdfService;

    @Value("${llavero.arqueo.email.destino:}")
    private String destino;

    @Value("${llavero.arqueo.email.remitente:Llavero <noreply@llavero.cl>}")
    private String remitente;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender,
                        PdfService pdfService) {
        this.mailSender = mailSender;
        this.pdfService = pdfService;
    }

    @Async
    public void enviarArqueoAsync(ArqueoTurno arqueo, ResumenTurnoResponse resumen) {
        // No bloquear el cierre de turno si el email falla
        try {
            enviarArqueo(arqueo, resumen);
        } catch (Exception e) {
            System.err.println("[EmailService] Error enviando arqueo: " + e.getMessage());
        }
    }

    public void enviarArqueo(ArqueoTurno arqueo, ResumenTurnoResponse resumen) {
        if (mailSender == null
                || mailHost == null || mailHost.isBlank()
                || mailUsername == null || mailUsername.isBlank()
                || destino == null || destino.isBlank()) {
            System.out.println("[EmailService] Email no configurado, saltando envío del arqueo.");
            return;
        }

        try {
            byte[] pdf = pdfService.generarPdfArqueo(arqueo, resumen);
            String fechaCierre = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(remitente);
            helper.setTo(destino);
            helper.setSubject("Cierre de turno — " + arqueo.getCajeroNombre() + " (" + fechaCierre + ")");

            String htmlBody = construirEmailHtml(arqueo, resumen, fechaCierre);
            helper.setText(htmlBody, true);

            String nombreArchivo = "cierre-" + arqueo.getCajeroNombre().replaceAll("\\s+", "-").toLowerCase()
                    + "-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmm")) + ".pdf";
            helper.addAttachment(nombreArchivo, new ByteArrayResource(pdf));

            mailSender.send(message);
            System.out.println("[EmailService] Arqueo enviado a " + destino);
        } catch (Exception e) {
            throw new RuntimeException("Error enviando email del arqueo: " + e.getMessage(), e);
        }
    }

    private String construirEmailHtml(ArqueoTurno a, ResumenTurnoResponse r, String fechaCierre) {
        String diffColor = a.getDiferencia().signum() == 0 ? "#059669"
                : a.getDiferencia().abs().intValue() < 1000 ? "#d97706" : "#dc2626";
        String diffTexto = a.getDiferencia().signum() == 0
                ? "Cuadra exacto"
                : (a.getDiferencia().signum() > 0 ? "Sobran $" : "Faltan $") + fmt(a.getDiferencia().abs());

        return """
            <div style='font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:auto;color:#1a1a1a'>
              <h2 style='margin:0 0 6px 0'>🔑 Cierre de Turno — Llavero</h2>
              <p style='color:#666;margin:0 0 18px 0'>%s · %s</p>

              <table style='width:100%%;border-collapse:collapse;margin-bottom:18px'>
                <tr><td style='padding:6px 0;color:#666'>Total recaudado</td><td style='padding:6px 0;text-align:right;font-weight:bold;font-size:16px'>$%s</td></tr>
                <tr><td style='padding:6px 0;color:#666'>Total declarado</td><td style='padding:6px 0;text-align:right;font-weight:bold'>$%s</td></tr>
                <tr><td style='padding:6px 0;color:#666'>Diferencia</td><td style='padding:6px 0;text-align:right;font-weight:bold;color:%s'>%s</td></tr>
                <tr><td style='padding:6px 0;color:#666'>Ventas / Boletas / Facturas</td><td style='padding:6px 0;text-align:right'>%d / %d / %d</td></tr>
              </table>

              %s

              <p style='color:#888;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:12px'>
                El detalle completo del arqueo (desglose por método, conteo de billetes y movimientos)
                está adjunto en PDF. Documento firmado con PIN del cajero.
              </p>
            </div>
            """.formatted(
                esc(a.getCajeroNombre()), fechaCierre,
                fmt(r.getTotalSistema()),
                fmt(a.getTotalDeclarado()),
                diffColor, diffTexto,
                r.getCantidadVentas(), r.getCantidadBoletas(), r.getCantidadFacturas(),
                a.getObservacion() != null && !a.getObservacion().isBlank()
                    ? "<div style='padding:10px 12px;background:#fffbeb;border-left:3px solid #d97706;margin-bottom:18px'><strong>Observación:</strong><br/>" + esc(a.getObservacion()) + "</div>"
                    : ""
            );
    }

    private String fmt(BigDecimal n) {
        if (n == null) return "0";
        return String.format("%,d", n.longValue()).replace(',', '.');
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
