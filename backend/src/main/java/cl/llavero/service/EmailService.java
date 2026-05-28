package cl.llavero.service;

import cl.llavero.dto.EstadoActualResponse;
import cl.llavero.dto.ResumenTurnoResponse;
import cl.llavero.entity.ArqueoTurno;
import cl.llavero.entity.Reserva;
import cl.llavero.entity.Venta;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    @Value("${llavero.transferencia.banco:Banco Santander}")
    private String transfBanco;

    @Value("${llavero.transferencia.tipo:Cuenta Corriente}")
    private String transfTipo;

    @Value("${llavero.transferencia.cuenta:}")
    private String transfCuenta;

    @Value("${llavero.transferencia.rut:}")
    private String transfRut;

    @Value("${llavero.transferencia.titular:}")
    private String transfTitular;

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

    // ── Resumen diario ──────────────────────────────────────────────────────────

    @Async
    public void enviarResumenDiarioAsync(EstadoActualResponse estado) {
        try {
            enviarResumenDiario(estado);
        } catch (Exception e) {
            System.err.println("[EmailService] Error enviando resumen diario: " + e.getMessage());
        }
    }

    public void enviarResumenDiario(EstadoActualResponse estado) {
        if (!emailConfigurado()) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(remitente);
            helper.setTo(destino);
            String fecha = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            helper.setSubject("Resumen del día — " + fecha + " · Llavero");
            helper.setText(construirResumenHtml(estado, fecha), true);
            mailSender.send(message);
            System.out.println("[EmailService] Resumen diario enviado.");
        } catch (Exception e) {
            throw new RuntimeException("Error enviando resumen diario: " + e.getMessage(), e);
        }
    }

    private String construirResumenHtml(EstadoActualResponse e, String fecha) {
        String turnosHtml = e.getTurnosActivos().isEmpty() ? "<p style='color:#888'>Sin turnos abiertos</p>" :
            e.getTurnosActivos().stream().map(t ->
                "<tr><td>" + esc(t.getCajeroNombre()) + "</td>" +
                "<td style='text-align:right'>" + t.getCantidadVentas() + " ventas</td>" +
                "<td style='text-align:right;font-weight:bold'>$" + fmt(t.getTotalTurno()) + "</td></tr>"
            ).collect(java.util.stream.Collectors.joining());

        String habsHtml = e.getHabitacionesOcupadas().isEmpty() ? "<p style='color:#888'>Ninguna</p>" :
            e.getHabitacionesOcupadas().stream().map(h ->
                "<li><strong>Hab. " + esc(h.getNumero()) + "</strong> — " + esc(h.getTipo()) +
                (h.getSalidaEstimada() != null ? " · Sale: " + h.getSalidaEstimada().format(DateTimeFormatter.ofPattern("HH:mm")) : "") +
                (h.isVencida() ? " <span style='color:#dc2626'>⚠ VENCIDA</span>" : "") + "</li>"
            ).collect(java.util.stream.Collectors.joining());

        return """
            <div style='font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:auto;color:#1a1a1a'>
              <h2 style='margin:0 0 4px 0'>🔑 Resumen del día — Llavero</h2>
              <p style='color:#666;margin:0 0 20px 0'>%s</p>

              <div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px'>
                <div style='font-size:13pt;color:#888;margin-bottom:4px'>TOTAL DEL DÍA</div>
                <div style='font-size:26pt;font-weight:bold;color:#059669'>$%s</div>
                <div style='color:#666;font-size:10pt'>%d ventas realizadas</div>
              </div>

              <h3 style='margin:0 0 8px 0'>Turnos del día</h3>
              <table style='width:100%%;border-collapse:collapse;margin-bottom:20px'>
                <tr style='background:#f5f5f5'><th style='text-align:left;padding:6px'>Cajero</th><th style='padding:6px'>Ventas</th><th style='padding:6px'>Recaudado</th></tr>
                %s
              </table>

              <h3 style='margin:0 0 8px 0'>Habitaciones aún ocupadas</h3>
              <ul style='margin:0 0 20px 0;padding-left:20px'>%s</ul>

              %s

              <p style='color:#888;font-size:11pt;margin-top:20px;border-top:1px solid #eee;padding-top:12px'>
                Llavero · Sistema de gestión de hospedaje
              </p>
            </div>
            """.formatted(
                fecha,
                fmt(e.getTotalDia()), e.getVentasDia(),
                turnosHtml,
                habsHtml,
                e.getDtePendientes() > 0
                    ? "<div style='background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;margin-bottom:16px'>" +
                      "⚠ <strong>" + e.getDtePendientes() + " DTE(s) pendiente(s)</strong> de emitir en SII MiPyme.</div>"
                    : ""
            );
    }

    // ── Alertas ─────────────────────────────────────────────────────────────────

    @Async
    public void alertaVentaAnulada(String cajeroNombre, BigDecimal monto, String detalle) {
        if (!emailConfigurado()) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(remitente);
            helper.setTo(destino);
            helper.setSubject("⚠ Venta anulada — $" + fmt(monto) + " · Llavero");
            String html = """
                <div style='font-family:Helvetica,Arial,sans-serif;max-width:500px;margin:auto'>
                  <h2 style='color:#dc2626'>⚠ Venta Anulada</h2>
                  <p><strong>Cajero:</strong> %s</p>
                  <p><strong>Monto anulado:</strong> <span style='font-size:16pt;font-weight:bold'>$%s</span></p>
                  <p><strong>Detalle:</strong> %s</p>
                  <p><strong>Hora:</strong> %s</p>
                  <p style='color:#888;font-size:11pt;margin-top:20px'>Llavero · Sistema de gestión de hospedaje</p>
                </div>
                """.formatted(esc(cajeroNombre), fmt(monto), esc(detalle),
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            helper.setText(html, true);
            mailSender.send(message);
        } catch (Exception ex) {
            System.err.println("[EmailService] Error enviando alerta anulación: " + ex.getMessage());
        }
    }

    @Async
    public void alertaDiferenciaArqueo(String cajeroNombre, BigDecimal diferencia) {
        if (!emailConfigurado() || diferencia.abs().compareTo(BigDecimal.valueOf(5000)) < 0) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(remitente);
            helper.setTo(destino);
            helper.setSubject("⚠ Diferencia de caja — " + cajeroNombre + " · Llavero");
            String signo = diferencia.signum() > 0 ? "Sobraron" : "Faltaron";
            String html = """
                <div style='font-family:Helvetica,Arial,sans-serif;max-width:500px;margin:auto'>
                  <h2 style='color:#d97706'>⚠ Diferencia en Arqueo de Caja</h2>
                  <p><strong>Cajero:</strong> %s</p>
                  <p><strong>Diferencia:</strong> <span style='font-size:16pt;font-weight:bold;color:#dc2626'>%s $%s</span></p>
                  <p><strong>Hora del cierre:</strong> %s</p>
                  <p style='color:#888;font-size:11pt;margin-top:20px'>Revisa el arqueo completo en el PDF adjunto al email de cierre.</p>
                </div>
                """.formatted(esc(cajeroNombre), signo, fmt(diferencia.abs()),
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            helper.setText(html, true);
            mailSender.send(message);
        } catch (Exception ex) {
            System.err.println("[EmailService] Error enviando alerta diferencia: " + ex.getMessage());
        }
    }

    // ── Confirmación de reserva ─────────────────────────────────────────────────

    @Async
    public void enviarConfirmacionReservaAsync(Reserva reserva) {
        try {
            enviarConfirmacionReserva(reserva);
        } catch (Exception e) {
            System.err.println("[EmailService] Error enviando confirmación de reserva: " + e.getMessage());
        }
    }

    public void enviarConfirmacionReserva(Reserva reserva) {
        if (mailSender == null || mailUsername == null || mailUsername.isBlank()) {
            System.out.println("[EmailService] Email no configurado, saltando confirmación de reserva.");
            return;
        }

        String emailHuesped = reserva.getHuesped().getEmail();
        if (emailHuesped.endsWith("@llavero.internal")) return;

        long noches = java.time.temporal.ChronoUnit.DAYS.between(reserva.getFechaEntrada(), reserva.getFechaSalida());

        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, false, "UTF-8");
            h.setFrom(remitente);
            h.setTo(emailHuesped);
            h.setSubject("Reserva solicitada · Hostal Mi Maravilla");
            h.setText(construirEmailConfirmacionHtml(reserva, noches), true);
            mailSender.send(msg);

            if (destino != null && !destino.isBlank()) {
                MimeMessage notif = mailSender.createMimeMessage();
                MimeMessageHelper nh = new MimeMessageHelper(notif, false, "UTF-8");
                nh.setFrom(remitente);
                nh.setTo(destino);
                nh.setSubject("Nueva reserva web · " + reserva.getHuesped().getNombre() + " · Hab. " + reserva.getHabitacion().getNumero());
                nh.setText(construirEmailNotifHostalHtml(reserva, noches), true);
                mailSender.send(notif);
            }

            System.out.println("[EmailService] Confirmación de reserva enviada a " + emailHuesped);
        } catch (Exception e) {
            throw new RuntimeException("Error enviando confirmación de reserva: " + e.getMessage(), e);
        }
    }

    private String construirEmailConfirmacionHtml(Reserva r, long noches) {
        java.time.format.DateTimeFormatter fmtFecha =
            java.time.format.DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy", new java.util.Locale("es", "CL"));
        String montoStr = r.getMontoEstimado() != null ? "$" + fmt(r.getMontoEstimado()) : "A confirmar";
        String emailContacto = (destino != null && !destino.isBlank()) ? destino : mailUsername;

        String transfHtml = (transfCuenta == null || transfCuenta.isBlank()) ? "" : """
            <table style='width:100%%;border-collapse:collapse;background:#fff;border:1px solid #DDD0C0;margin-bottom:10px'>
              <tr><td style='padding:9px 14px;font-size:13px;color:#6B6057;border-bottom:1px solid #DDD0C0'>Banco</td>
                  <td style='padding:9px 14px;font-size:13px;font-weight:500;border-bottom:1px solid #DDD0C0;text-align:right'>%s</td></tr>
              <tr><td style='padding:9px 14px;font-size:13px;color:#6B6057;border-bottom:1px solid #DDD0C0'>Tipo</td>
                  <td style='padding:9px 14px;font-size:13px;font-weight:500;border-bottom:1px solid #DDD0C0;text-align:right'>%s</td></tr>
              <tr><td style='padding:9px 14px;font-size:13px;color:#6B6057;border-bottom:1px solid #DDD0C0'>N° de cuenta</td>
                  <td style='padding:9px 14px;font-size:13px;font-weight:500;border-bottom:1px solid #DDD0C0;text-align:right'>%s</td></tr>
              <tr><td style='padding:9px 14px;font-size:13px;color:#6B6057;border-bottom:1px solid #DDD0C0'>RUT titular</td>
                  <td style='padding:9px 14px;font-size:13px;font-weight:500;border-bottom:1px solid #DDD0C0;text-align:right'>%s</td></tr>
              <tr><td style='padding:9px 14px;font-size:13px;color:#6B6057'>Titular</td>
                  <td style='padding:9px 14px;font-size:13px;font-weight:500;text-align:right'>%s</td></tr>
            </table>
            """.formatted(esc(transfBanco), esc(transfTipo), esc(transfCuenta), esc(transfRut), esc(transfTitular));

        return """
            <div style='font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:auto;color:#1a1a1a'>
              <div style='background:#1C4A5A;padding:28px 24px;text-align:center'>
                <p style='color:#C9943A;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 6px'>Hostal Mi Maravilla</p>
                <h1 style='color:#fff;font-weight:300;font-size:22px;margin:0 0 4px'>¡Reserva recibida!</h1>
                <p style='color:rgba(255,255,255,0.6);font-size:13px;margin:0'>Tu solicitud fue enviada correctamente</p>
              </div>

              <div style='padding:20px 24px;background:#F5EFE6;border-bottom:3px solid #C9943A'>
                <p style='font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6B6057;margin:0 0 4px'>Habitación</p>
                <p style='font-size:18px;font-weight:500;color:#1C4A5A;margin:0'>
                  Hab. %s · %s
                </p>
              </div>

              <div style='padding:24px;background:#fff'>
                <table style='width:100%%;border-collapse:collapse'>
                  <tr>
                    <td style='padding:10px 0;border-bottom:1px solid #DDD0C0;color:#6B6057;font-size:13px'>Check-in</td>
                    <td style='padding:10px 0;border-bottom:1px solid #DDD0C0;text-align:right;font-weight:500'>%s</td>
                  </tr>
                  <tr>
                    <td style='padding:10px 0;border-bottom:1px solid #DDD0C0;color:#6B6057;font-size:13px'>Check-out</td>
                    <td style='padding:10px 0;border-bottom:1px solid #DDD0C0;text-align:right;font-weight:500'>%s</td>
                  </tr>
                  <tr>
                    <td style='padding:10px 0;border-bottom:1px solid #DDD0C0;color:#6B6057;font-size:13px'>Noches</td>
                    <td style='padding:10px 0;border-bottom:1px solid #DDD0C0;text-align:right;font-weight:500'>%d noche%s</td>
                  </tr>
                  <tr>
                    <td style='padding:10px 0;color:#6B6057;font-size:13px'>Total estimado</td>
                    <td style='padding:10px 0;text-align:right;font-weight:700;color:#1C4A5A;font-size:16px'>%s</td>
                  </tr>
                </table>
              </div>

              <div style='padding:22px 24px;background:#fffbeb;border-left:4px solid #C9943A'>
                <p style='font-weight:600;color:#1a1a1a;margin:0 0 6px;font-size:14px'>Depósito para confirmar tu reserva</p>
                <p style='color:#6B6057;font-size:13px;margin:0 0 14px;line-height:1.55'>
                  Nos contactaremos contigo a la brevedad para coordinar el monto y el depósito.
                  Si prefieres hacerlo de inmediato, puedes transferir a la siguiente cuenta:
                </p>
                %s
                <p style='font-size:12px;color:#6B6057;margin:0;line-height:1.5'>
                  Envía el comprobante a
                  <a href='mailto:%s' style='color:#1C4A5A;font-weight:500'>%s</a>
                  indicando tu nombre y las fechas de reserva.
                </p>
              </div>

              <div style='padding:20px 24px;background:#fff;border-top:1px solid #DDD0C0'>
                <p style='font-size:13px;color:#6B6057;line-height:1.6;margin:0'>
                  Una vez confirmado el depósito recibirás la <strong>confirmación oficial</strong> de tu reserva.
                  Ante cualquier consulta escríbenos a
                  <a href='mailto:%s' style='color:#1C4A5A'>%s</a>.
                </p>
              </div>

              <p style='font-size:11px;color:#aaa;text-align:center;padding:16px;margin:0'>
                Hostal Mi Maravilla · Este correo fue generado automáticamente.
              </p>
            </div>
            """.formatted(
                esc(r.getHabitacion().getNumero()),
                r.getHabitacion().getTipo() != null ? esc(r.getHabitacion().getTipo().getLabel()) : "",
                r.getFechaEntrada().format(fmtFecha),
                r.getFechaSalida().format(fmtFecha),
                noches, noches == 1 ? "" : "s",
                montoStr,
                transfHtml,
                esc(emailContacto), esc(emailContacto),
                esc(emailContacto), esc(emailContacto)
            );
    }

    private String construirEmailNotifHostalHtml(Reserva r, long noches) {
        java.time.format.DateTimeFormatter fmtCorto = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String montoStr = r.getMontoEstimado() != null ? "$" + fmt(r.getMontoEstimado()) : "—";
        String telefono = r.getHuesped().getTelefono() != null ? r.getHuesped().getTelefono() : "—";
        return """
            <div style='font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:auto;color:#1a1a1a'>
              <h2 style='margin:0 0 6px 0'>🔑 Nueva reserva web · Llavero</h2>
              <p style='color:#666;margin:0 0 18px 0'>Se recibió una solicitud desde el sitio público.</p>
              <table style='width:100%%;border-collapse:collapse;margin-bottom:18px'>
                <tr><td style='padding:8px 0;color:#666;border-bottom:1px solid #eee'>Huésped</td>
                    <td style='padding:8px 0;text-align:right;font-weight:bold;border-bottom:1px solid #eee'>%s</td></tr>
                <tr><td style='padding:8px 0;color:#666;border-bottom:1px solid #eee'>Email</td>
                    <td style='padding:8px 0;text-align:right;border-bottom:1px solid #eee'>%s</td></tr>
                <tr><td style='padding:8px 0;color:#666;border-bottom:1px solid #eee'>Teléfono</td>
                    <td style='padding:8px 0;text-align:right;border-bottom:1px solid #eee'>%s</td></tr>
                <tr><td style='padding:8px 0;color:#666;border-bottom:1px solid #eee'>Habitación</td>
                    <td style='padding:8px 0;text-align:right;font-weight:bold;border-bottom:1px solid #eee'>Hab. %s</td></tr>
                <tr><td style='padding:8px 0;color:#666;border-bottom:1px solid #eee'>Check-in</td>
                    <td style='padding:8px 0;text-align:right;border-bottom:1px solid #eee'>%s</td></tr>
                <tr><td style='padding:8px 0;color:#666;border-bottom:1px solid #eee'>Check-out</td>
                    <td style='padding:8px 0;text-align:right;border-bottom:1px solid #eee'>%s</td></tr>
                <tr><td style='padding:8px 0;color:#666;border-bottom:1px solid #eee'>Noches</td>
                    <td style='padding:8px 0;text-align:right;border-bottom:1px solid #eee'>%d</td></tr>
                <tr><td style='padding:8px 0;color:#666'>Total estimado</td>
                    <td style='padding:8px 0;text-align:right;font-weight:bold;font-size:15px'>%s</td></tr>
              </table>
              %s
              <p style='color:#888;font-size:12px'>Confirma o rechaza esta reserva desde el panel administrativo.</p>
            </div>
            """.formatted(
                esc(r.getHuesped().getNombre()),
                esc(r.getHuesped().getEmail()),
                esc(telefono),
                esc(r.getHabitacion().getNumero()),
                r.getFechaEntrada().format(fmtCorto),
                r.getFechaSalida().format(fmtCorto),
                noches,
                montoStr,
                r.getNotas() != null && !r.getNotas().isBlank()
                    ? "<div style='padding:10px 12px;background:#f5f5f5;border-left:3px solid #ddd;margin-bottom:14px'><strong>Notas:</strong><br/>" + esc(r.getNotas()) + "</div>"
                    : ""
            );
    }

    // ── Comprobante de check-out ────────────────────────────────────────────────

    @Async
    public void enviarComprobanteCheckoutAsync(Venta venta) {
        try {
            String emailDestino = resolverEmailHuesped(venta);
            if (emailDestino == null || emailDestino.isBlank() || emailDestino.endsWith("@llavero.internal")) return;
            if (mailSender == null || mailUsername == null || mailUsername.isBlank()) return;

            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, false, "UTF-8");
            h.setFrom(remitente);
            h.setTo(emailDestino);
            h.setSubject("Comprobante de estadía · Hostal Mi Maravilla");
            h.setText(construirComprobanteHtml(venta), true);
            mailSender.send(msg);
            System.out.println("[EmailService] Comprobante de checkout enviado a " + emailDestino);
        } catch (Exception e) {
            System.err.println("[EmailService] Error enviando comprobante checkout: " + e.getMessage());
        }
    }

    private String resolverEmailHuesped(Venta v) {
        if (v.getReceptorEmail() != null && !v.getReceptorEmail().isBlank()) return v.getReceptorEmail();
        if (v.getReserva() != null) return v.getReserva().getHuesped().getEmail();
        return null;
    }

    private String construirComprobanteHtml(Venta v) {
        java.time.format.DateTimeFormatter fmtFecha =
            java.time.format.DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy", new java.util.Locale("es", "CL"));

        String nombreHuesped = v.getReserva() != null
            ? v.getReserva().getHuesped().getNombre()
            : (v.getReceptorRazon() != null ? v.getReceptorRazon() : "Estimado huésped");

        String habInfo = v.getHabitacion() != null
            ? "Hab. " + esc(v.getHabitacion().getNumero())
              + (v.getHabitacion().getTipo() != null ? " · " + esc(v.getHabitacion().getTipo().getLabel()) : "")
            : "—";

        String itemsHtml = v.getItems().stream().map(i ->
            "<tr>" +
            "<td style='padding:9px 14px;font-size:13px;border-bottom:1px solid #EEE8E0'>" + esc(i.getDescripcion()) + "</td>" +
            "<td style='padding:9px 14px;font-size:13px;text-align:center;border-bottom:1px solid #EEE8E0;color:#666'>" + i.getCantidad() + "</td>" +
            "<td style='padding:9px 14px;font-size:13px;text-align:right;border-bottom:1px solid #EEE8E0;font-weight:500'>$" + fmt(i.getSubtotal()) + "</td>" +
            "</tr>"
        ).collect(java.util.stream.Collectors.joining());

        String pagoStr = v.getMetodoPago() != null ? switch (v.getMetodoPago().name()) {
            case "efectivo" -> "Efectivo";
            case "debito" -> "Débito";
            case "credito" -> "Crédito";
            case "transferencia" -> "Transferencia";
            default -> v.getMetodoPago().name();
        } : "—";

        String fechaCheckout = LocalDateTime.now().format(fmtFecha);

        return """
            <div style='font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:auto;color:#1a1a1a'>
              <div style='background:#1C4A5A;padding:28px 24px;text-align:center'>
                <p style='color:#C9943A;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 6px'>Hostal Mi Maravilla</p>
                <h1 style='color:#fff;font-weight:300;font-size:22px;margin:0 0 4px'>¡Gracias por tu visita!</h1>
                <p style='color:rgba(255,255,255,0.6);font-size:13px;margin:0'>Esperamos verte pronto</p>
              </div>

              <div style='padding:20px 24px;background:#F5EFE6;border-bottom:3px solid #C9943A'>
                <p style='font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#6B6057;margin:0 0 4px'>Comprobante de estadía</p>
                <p style='font-size:18px;font-weight:500;color:#1C4A5A;margin:0'>%s</p>
                <p style='font-size:13px;color:#6B6057;margin:4px 0 0'>%s · Check-out %s</p>
              </div>

              <div style='padding:16px 24px 0;background:#fff'>
                <table style='width:100%%;border-collapse:collapse'>
                  <thead>
                    <tr style='background:#F5EFE6'>
                      <th style='padding:9px 14px;text-align:left;font-size:12px;color:#6B6057;font-weight:600'>Descripción</th>
                      <th style='padding:9px 14px;text-align:center;font-size:12px;color:#6B6057;font-weight:600'>Cant.</th>
                      <th style='padding:9px 14px;text-align:right;font-size:12px;color:#6B6057;font-weight:600'>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>%s</tbody>
                </table>
              </div>

              <div style='padding:16px 24px;background:#fff;border-top:2px solid #1C4A5A'>
                <table style='width:100%%;border-collapse:collapse'>
                  <tr>
                    <td style='padding:6px 0;color:#6B6057;font-size:13px'>Método de pago</td>
                    <td style='padding:6px 0;text-align:right;font-size:13px'>%s</td>
                  </tr>
                  <tr>
                    <td style='padding:6px 0;font-weight:700;font-size:15px'>TOTAL</td>
                    <td style='padding:6px 0;text-align:right;font-weight:700;font-size:18px;color:#1C4A5A'>$%s</td>
                  </tr>
                </table>
              </div>

              <p style='font-size:11px;color:#aaa;text-align:center;padding:16px;margin:0'>
                Hostal Mi Maravilla · Este correo fue generado automáticamente.
              </p>
            </div>
            """.formatted(
                esc(nombreHuesped),
                habInfo,
                fechaCheckout,
                itemsHtml,
                pagoStr,
                fmt(v.getTotal())
            );
    }

    private boolean emailConfigurado() {
        return mailSender != null
                && mailHost != null && !mailHost.isBlank()
                && mailUsername != null && !mailUsername.isBlank()
                && destino != null && !destino.isBlank();
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
