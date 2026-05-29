package cl.llavero.service;

import cl.llavero.dto.ReservaInvitadoRequest;
import cl.llavero.dto.ReservaRequest;
import cl.llavero.dto.ReservaResponse;
import cl.llavero.dto.ReservaStaffRequest;
import cl.llavero.entity.*;
import cl.llavero.repository.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final HabitacionRepository habitacionRepository;
    private final HuespedRepository huespedRepository;
    private final EmailService emailService;
    private final VentaRepository ventaRepository;
    private final VentaItemRepository itemRepository;

    public ReservaService(ReservaRepository reservaRepository,
                          HabitacionRepository habitacionRepository,
                          HuespedRepository huespedRepository,
                          EmailService emailService,
                          VentaRepository ventaRepository,
                          VentaItemRepository itemRepository) {
        this.reservaRepository = reservaRepository;
        this.habitacionRepository = habitacionRepository;
        this.huespedRepository = huespedRepository;
        this.emailService = emailService;
        this.ventaRepository = ventaRepository;
        this.itemRepository = itemRepository;
    }

    public ReservaResponse crear(ReservaRequest req, UUID huespedId) {
        if (req.fechaEntrada() == null || req.fechaSalida() == null)
            throw new IllegalArgumentException("Las fechas son requeridas");
        if (!req.fechaEntrada().isBefore(req.fechaSalida()))
            throw new IllegalArgumentException("La fecha de salida debe ser posterior a la de entrada");
        if (req.fechaEntrada().isBefore(LocalDate.now()))
            throw new IllegalArgumentException("La fecha de entrada no puede ser en el pasado");

        var habitacion = habitacionRepository.findById(req.habitacionId())
            .orElseThrow(() -> new IllegalArgumentException("Habitación no encontrada"));

        if (!habitacion.getActiva())
            throw new IllegalArgumentException("Habitación no disponible");

        var solapadas = reservaRepository.findSolapadas(req.habitacionId(), req.fechaEntrada(), req.fechaSalida());
        if (!solapadas.isEmpty())
            throw new IllegalArgumentException("La habitación ya tiene una reserva en esas fechas");

        if (Boolean.TRUE.equals(req.conEstacionamiento())) {
            long estacionamientosUsados = reservaRepository.countEstacionamientoSolapadas(req.fechaEntrada(), req.fechaSalida());
            if (estacionamientosUsados >= 4)
                throw new IllegalArgumentException("No hay estacionamientos disponibles para esas fechas");
        }

        Huesped huesped = huespedRepository.findById(huespedId)
            .orElseThrow(() -> new IllegalArgumentException("Huésped no encontrado"));

        Reserva r = new Reserva();
        r.setHuesped(huesped);
        r.setHabitacion(habitacion);
        r.setFechaEntrada(req.fechaEntrada());
        r.setFechaSalida(req.fechaSalida());
        r.setNotas(req.notas());
        r.setPersonas(req.personas());
        r.setConEstacionamiento(Boolean.TRUE.equals(req.conEstacionamiento()));
        r.setMontoEstimado(req.montoEstimado());

        reservaRepository.save(r);
        emailService.enviarConfirmacionReservaAsync(r);
        return ReservaResponse.from(r);
    }

    public ReservaResponse crearComoInvitado(ReservaInvitadoRequest req) {
        if (req.nombre() == null || req.nombre().isBlank())
            throw new IllegalArgumentException("El nombre es requerido");
        if (req.email() == null || req.email().isBlank())
            throw new IllegalArgumentException("El email es requerido");
        if (req.fechaEntrada() == null || req.fechaSalida() == null)
            throw new IllegalArgumentException("Las fechas son requeridas");
        if (!req.fechaEntrada().isBefore(req.fechaSalida()))
            throw new IllegalArgumentException("La fecha de salida debe ser posterior a la de entrada");
        if (req.fechaEntrada().isBefore(LocalDate.now()))
            throw new IllegalArgumentException("La fecha de entrada no puede ser en el pasado");

        var habitacion = habitacionRepository.findById(req.habitacionId())
            .orElseThrow(() -> new IllegalArgumentException("Habitación no encontrada"));

        if (!habitacion.getActiva())
            throw new IllegalArgumentException("Habitación no disponible");

        var solapadas = reservaRepository.findSolapadas(req.habitacionId(), req.fechaEntrada(), req.fechaSalida());
        if (!solapadas.isEmpty())
            throw new IllegalArgumentException("La habitación ya tiene una reserva en esas fechas");

        if (Boolean.TRUE.equals(req.conEstacionamiento())) {
            long estacionamientosUsados = reservaRepository.countEstacionamientoSolapadas(req.fechaEntrada(), req.fechaSalida());
            if (estacionamientosUsados >= 4)
                throw new IllegalArgumentException("No hay estacionamientos disponibles para esas fechas");
        }

        String emailLower = req.email().toLowerCase().trim();
        Huesped huesped = huespedRepository.findByEmailIgnoreCase(emailLower).orElseGet(() -> {
            Huesped h = new Huesped();
            h.setNombre(req.nombre().trim());
            h.setEmail(emailLower);
            h.setPasswordHash(null);
            h.setTelefono(req.telefono());
            return huespedRepository.save(h);
        });

        Reserva r = new Reserva();
        r.setHuesped(huesped);
        r.setHabitacion(habitacion);
        r.setFechaEntrada(req.fechaEntrada());
        r.setFechaSalida(req.fechaSalida());
        r.setNotas(req.notas());
        r.setPersonas(req.personas());
        r.setConEstacionamiento(Boolean.TRUE.equals(req.conEstacionamiento()));
        r.setMontoEstimado(req.montoEstimado());

        reservaRepository.save(r);
        emailService.enviarConfirmacionReservaAsync(r);
        return ReservaResponse.from(r);
    }

    public List<ReservaResponse> misReservas(UUID huespedId) {
        return reservaRepository.findByHuespedIdOrderByCreatedAtDesc(huespedId)
            .stream().map(ReservaResponse::from).toList();
    }

    public List<ReservaResponse> listarTodas() {
        return reservaRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(ReservaResponse::from).toList();
    }

    public ReservaResponse cambiarEstado(UUID reservaId, EstadoReserva nuevoEstado) {
        Reserva r = reservaRepository.findById(reservaId)
            .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));
        r.setEstado(nuevoEstado);
        reservaRepository.save(r);
        return ReservaResponse.from(r);
    }

    public ReservaResponse confirmar(UUID reservaId, String referenciaDeposito) {
        Reserva r = reservaRepository.findById(reservaId)
            .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));
        r.setEstado(EstadoReserva.confirmada);
        if (referenciaDeposito != null && !referenciaDeposito.isBlank())
            r.setReferenciaDeposito(referenciaDeposito.trim());
        reservaRepository.save(r);
        emailService.enviarConfirmadaReservaAsync(r);
        return ReservaResponse.from(r);
    }

    public ReservaResponse cancelar(UUID reservaId, UUID huespedId) {
        Reserva r = reservaRepository.findById(reservaId)
            .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));

        if (!r.getHuesped().getId().equals(huespedId))
            throw new IllegalArgumentException("No autorizado");

        if (r.getEstado() == EstadoReserva.completada)
            throw new IllegalArgumentException("No se puede cancelar una reserva completada");

        r.setEstado(EstadoReserva.cancelada);
        reservaRepository.save(r);
        return ReservaResponse.from(r);
    }

    public ReservaResponse crearComoStaff(ReservaStaffRequest req) {
        if (req.fechaEntrada() == null || req.fechaSalida() == null)
            throw new IllegalArgumentException("Las fechas son requeridas");
        if (!req.fechaEntrada().isBefore(req.fechaSalida()))
            throw new IllegalArgumentException("La fecha de salida debe ser posterior a la de entrada");
        if (req.nombreHuesped() == null || req.nombreHuesped().isBlank())
            throw new IllegalArgumentException("El nombre del huésped es requerido");

        var habitacion = habitacionRepository.findById(req.habitacionId())
            .orElseThrow(() -> new IllegalArgumentException("Habitación no encontrada"));

        if (!habitacion.getActiva())
            throw new IllegalArgumentException("Habitación no disponible");

        var solapadas = reservaRepository.findSolapadas(req.habitacionId(), req.fechaEntrada(), req.fechaSalida());
        if (!solapadas.isEmpty())
            throw new IllegalArgumentException("La habitación ya tiene una reserva en esas fechas");

        String email = (req.emailHuesped() != null && !req.emailHuesped().isBlank())
            ? req.emailHuesped().toLowerCase().trim()
            : "walkin-" + UUID.randomUUID() + "@llavero.internal";

        Huesped huesped = huespedRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            Huesped h = new Huesped();
            h.setNombre(req.nombreHuesped().trim());
            h.setEmail(email);
            h.setPasswordHash(new BCryptPasswordEncoder().encode(UUID.randomUUID().toString()));
            h.setTelefono(req.telefonoHuesped());
            return huespedRepository.save(h);
        });

        Reserva r = new Reserva();
        r.setHuesped(huesped);
        r.setHabitacion(habitacion);
        r.setFechaEntrada(req.fechaEntrada());
        r.setFechaSalida(req.fechaSalida());
        r.setNotas(req.notas());
        r.setEstado(EstadoReserva.confirmada);
        reservaRepository.save(r);
        return ReservaResponse.from(r);
    }

    public ReservaResponse checkin(UUID reservaId) {
        Reserva r = reservaRepository.findById(reservaId)
            .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));
        if (r.getEstado() != EstadoReserva.confirmada)
            throw new IllegalArgumentException("Solo se puede hacer check-in de reservas confirmadas");

        r.getHabitacion().setEstado(EstadoHabitacion.ocupado);
        habitacionRepository.save(r.getHabitacion());
        r.setEstado(EstadoReserva.completada);
        reservaRepository.save(r);

        crearVentaActiva(r);

        return ReservaResponse.from(r);
    }

    private void crearVentaActiva(Reserva r) {
        long noches = r.getFechaEntrada().until(r.getFechaSalida()).getDays();
        if (noches <= 0) noches = 1;

        Venta venta = new Venta();
        venta.setHabitacion(r.getHabitacion());
        venta.setReserva(r);
        venta.setFecha(LocalDate.now());
        venta.setHora(LocalTime.now());
        venta.setCreatedAt(LocalDateTime.now());
        venta.setTipoDte(TipoDte.boleta);
        venta.setTipoVenta(TipoVenta.hostal);
        venta.setDuracion("noche");
        venta.setSalidaEstimada(r.getFechaSalida().atTime(12, 0));
        venta.setEstado(EstadoVenta.activa);
        venta.setReceptorEmail(r.getHuesped().getEmail());

        BigDecimal precioTotal = r.getMontoEstimado() != null ? r.getMontoEstimado() : BigDecimal.ZERO;
        BigDecimal precioPorNoche = noches > 0
            ? precioTotal.divide(BigDecimal.valueOf(noches), 2, java.math.RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        venta.setTotal(precioTotal);
        venta = ventaRepository.save(venta);

        String hab = r.getHabitacion().getNumero();
        String tipo = r.getHabitacion().getTipo() != null ? r.getHabitacion().getTipo().getLabel() : "";
        VentaItem item = new VentaItem();
        item.setVenta(venta);
        item.setTipo(TipoItem.habitacion);
        item.setDescripcion(String.format("Estadía %d noche%s – Hab. %s %s", noches, noches == 1 ? "" : "s", hab, tipo).trim());
        item.setCantidad((int) noches);
        item.setPrecioUnitario(precioPorNoche);
        item.setSubtotal(precioTotal);
        item.setEsLibre(false);
        itemRepository.save(item);
    }

    public boolean estaDisponible(UUID habitacionId, LocalDate fechaEntrada, LocalDate fechaSalida) {
        return reservaRepository.findSolapadas(habitacionId, fechaEntrada, fechaSalida).isEmpty();
    }

    public List<ReservaResponse> getProximas() {
        LocalDate hoy = LocalDate.now();
        LocalDate manana = hoy.plusDays(1);
        return reservaRepository.findProximas(hoy, manana)
            .stream().map(ReservaResponse::from).toList();
    }
}
