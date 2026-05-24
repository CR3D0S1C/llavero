package cl.llavero.service;

import cl.llavero.dto.ResumenTurnoResponse;
import cl.llavero.entity.ArqueoTurno;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class PdfService {

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public byte[] generarPdfArqueo(ArqueoTurno a, ResumenTurnoResponse r) {
        String html = construirHtml(a, r);
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando PDF del arqueo", e);
        }
    }

    private String construirHtml(ArqueoTurno a, ResumenTurnoResponse r) {
        String fechaCierre = LocalDateTime.now().format(FMT);
        String fechaInicio = r.getInicio() != null ? r.getInicio().format(FMT) : "—";
        long horas = r.getDuracionMinutos() / 60;
        long mins = r.getDuracionMinutos() % 60;

        String diffStyle = a.getDiferencia().signum() == 0
                ? "color:#059669;"
                : a.getDiferencia().abs().intValue() < 1000 ? "color:#d97706;" : "color:#dc2626;";

        StringBuilder productos = new StringBuilder();
        if (r.getProductosTop() != null) {
            for (var p : r.getProductosTop()) {
                productos.append("<tr><td>").append(esc(p.getNombre()))
                        .append("</td><td style='text-align:right'>×").append(p.getCantidad())
                        .append("</td><td style='text-align:right'>").append(fmt(p.getTotal()))
                        .append("</td></tr>");
            }
        }
        StringBuilder habitaciones = new StringBuilder();
        if (r.getHabitacionesTop() != null) {
            for (var h : r.getHabitacionesTop()) {
                habitaciones.append("<tr><td>").append(esc(h.getTipo()))
                        .append("</td><td style='text-align:right'>×").append(h.getCantidad())
                        .append("</td><td style='text-align:right'>").append(fmt(h.getTotal()))
                        .append("</td></tr>");
            }
        }

        return """
            <!DOCTYPE html>
            <html><head><meta charset='UTF-8'><style>
              @page { size: A4; margin: 18mm; }
              body { font-family: 'Helvetica', sans-serif; color: #1a1a1a; font-size: 11pt; line-height: 1.4; }
              h1 { font-size: 22pt; margin: 0 0 4px 0; letter-spacing: -0.5px; }
              .meta { color: #666; font-size: 9pt; text-transform: uppercase; letter-spacing: 2px; }
              .header { border-bottom: 2px solid #1a1a1a; padding-bottom: 14px; margin-bottom: 22px; }
              .grid-2 { display: table; width: 100%%; margin-bottom: 8px; }
              .grid-2 > div { display: table-cell; width: 50%%; padding: 6px 0; }
              .label { color: #888; font-size: 9pt; text-transform: uppercase; letter-spacing: 1px; }
              .value { font-weight: bold; font-size: 12pt; margin-top: 2px; }
              table { width: 100%%; border-collapse: collapse; margin: 6px 0 16px 0; }
              th { text-align: left; padding: 6px 4px; border-bottom: 1px solid #1a1a1a; font-size: 9pt; text-transform: uppercase; letter-spacing: 1px; }
              td { padding: 6px 4px; border-bottom: 1px solid #eee; font-size: 11pt; }
              .section { margin-top: 22px; }
              .section h2 { font-size: 13pt; margin: 0 0 8px 0; padding-bottom: 6px; border-bottom: 1px solid #ddd; }
              .total-box { background: #f5f5f5; padding: 14px 16px; border-radius: 6px; margin-top: 12px; }
              .total-box .row { display: table; width: 100%%; margin: 4px 0; }
              .total-box .row > div { display: table-cell; }
              .total-box .row .v { text-align: right; font-weight: bold; }
              .diff { font-size: 14pt; padding: 10px 14px; border-radius: 6px; background: #fafafa; margin-top: 10px; }
              .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #ccc; color: #888; font-size: 9pt; text-align: center; }
            </style></head><body>
              <div class='header'>
                <div class='meta'>Llavero · Cierre de Turno</div>
                <h1>Arqueo de Caja</h1>
                <div style='color:#666;font-size:10pt;margin-top:4px;'>
                  Cajero: <strong>%s</strong> · Cerrado el %s
                </div>
              </div>

              <div class='grid-2'>
                <div><div class='label'>Inicio del turno</div><div class='value'>%s</div></div>
                <div><div class='label'>Duración</div><div class='value'>%dh %dm</div></div>
              </div>

              <div class='section'>
                <h2>Resumen del sistema</h2>
                <div class='grid-2'>
                  <div><div class='label'>Total recaudado</div><div class='value'>$%s</div></div>
                  <div><div class='label'>Ventas</div><div class='value'>%d</div></div>
                </div>
                <div class='grid-2'>
                  <div><div class='label'>Boletas</div><div class='value'>%d</div></div>
                  <div><div class='label'>Facturas</div><div class='value'>%d</div></div>
                </div>
                <div class='grid-2'>
                  <div><div class='label'>Mov. habitaciones</div><div class='value'>%d</div></div>
                  <div><div class='label'>Limpiezas</div><div class='value'>%d</div></div>
                </div>
              </div>

              %s

              %s

              <div class='section'>
                <h2>Desglose por método de pago</h2>
                <div class='total-box'>
                  <div class='row'><div>Efectivo</div><div class='v'>$%s</div></div>
                  <div class='row'><div>Transferencia</div><div class='v'>$%s</div></div>
                  <div class='row'><div>Tarjeta Débito</div><div class='v'>$%s</div></div>
                  <div class='row'><div>Tarjeta Crédito</div><div class='v'>$%s</div></div>
                  <div class='row'><div>Otro</div><div class='v'>$%s</div></div>
                  <div class='row' style='border-top:2px solid #1a1a1a;padding-top:8px;margin-top:8px;font-size:13pt;'>
                    <div>TOTAL DECLARADO</div><div class='v'>$%s</div>
                  </div>
                </div>
              </div>

              <div class='section'>
                <h2>Conteo de efectivo</h2>
                <table>
                  <tr><th>Denominación</th><th style='text-align:right'>Cantidad</th><th style='text-align:right'>Subtotal</th></tr>
                  %s
                  <tr><td><strong>Total contado</strong></td><td></td><td style='text-align:right'><strong>$%s</strong></td></tr>
                </table>
              </div>

              <div class='section'>
                <h2>Resultado del arqueo</h2>
                <div class='total-box'>
                  <div class='row'><div>Total sistema</div><div class='v'>$%s</div></div>
                  <div class='row'><div>Total declarado</div><div class='v'>$%s</div></div>
                  <div class='row' style='border-top:1px solid #ccc;padding-top:8px;margin-top:8px;'>
                    <div><strong>Diferencia</strong></div>
                    <div class='v' style='%s'>%s$%s</div>
                  </div>
                </div>
                %s
              </div>

              <div class='footer'>
                Documento generado automáticamente · Firmado con PIN del cajero<br/>
                Llavero — Sistema de gestión de hospedaje
              </div>
            </body></html>
            """.formatted(
                esc(a.getCajeroNombre()), fechaCierre,
                fechaInicio, horas, mins,
                fmt(r.getTotalSistema()), r.getCantidadVentas(),
                r.getCantidadBoletas(), r.getCantidadFacturas(),
                r.getMovimientosHabitaciones(), r.getLimpiezasRealizadas(),
                habitaciones.length() > 0 ? "<div class='section'><h2>Habitaciones vendidas</h2><table><tr><th>Tipo</th><th style='text-align:right'>Cant.</th><th style='text-align:right'>Total</th></tr>" + habitaciones + "</table></div>" : "",
                productos.length() > 0   ? "<div class='section'><h2>Productos vendidos</h2><table><tr><th>Producto</th><th style='text-align:right'>Cant.</th><th style='text-align:right'>Total</th></tr>" + productos + "</table></div>" : "",
                fmt(a.getEfectivo()), fmt(a.getTransferencia()),
                fmt(a.getTarjetaDebito()), fmt(a.getTarjetaCredito()),
                fmt(a.getOtro()), fmt(a.getTotalDeclarado()),
                filaConteo(a),
                fmt(a.getTotalConteoEfectivo()),
                fmt(r.getTotalSistema()), fmt(a.getTotalDeclarado()),
                diffStyle,
                a.getDiferencia().signum() > 0 ? "+" : a.getDiferencia().signum() < 0 ? "−" : "",
                fmt(a.getDiferencia().abs()),
                a.getObservacion() != null && !a.getObservacion().isBlank()
                    ? "<div style='margin-top:10px;padding:10px 12px;background:#fffbeb;border-left:3px solid #d97706;'><strong>Observación:</strong> " + esc(a.getObservacion()) + "</div>"
                    : ""
            );
    }

    private String filaConteo(ArqueoTurno a) {
        StringBuilder sb = new StringBuilder();
        agregarFila(sb, "$20.000", 20000, a.getB20000());
        agregarFila(sb, "$10.000", 10000, a.getB10000());
        agregarFila(sb, "$5.000",  5000,  a.getB5000());
        agregarFila(sb, "$2.000",  2000,  a.getB2000());
        agregarFila(sb, "$1.000",  1000,  a.getB1000());
        agregarFila(sb, "$500",    500,   a.getM500());
        agregarFila(sb, "$100",    100,   a.getM100());
        agregarFila(sb, "$50",     50,    a.getM50());
        agregarFila(sb, "$10",     10,    a.getM10());
        return sb.toString();
    }

    private void agregarFila(StringBuilder sb, String label, int valor, Integer cantidad) {
        int c = cantidad != null ? cantidad : 0;
        if (c == 0) return;
        sb.append("<tr><td>").append(label)
          .append("</td><td style='text-align:right'>").append(c)
          .append("</td><td style='text-align:right'>$").append(String.format("%,d", (long)valor * c).replace(',', '.'))
          .append("</td></tr>");
    }

    private String fmt(BigDecimal n) {
        if (n == null) return "0";
        return String.format("%,d", n.longValue()).replace(',', '.');
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }
}
