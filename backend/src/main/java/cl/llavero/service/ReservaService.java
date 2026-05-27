package cl.llavero.service;

import cl.llavero.dto.ReservaRequest;
import cl.llavero.dto.ReservaResponse;
import cl.llavero.dto.ReservaStaffRequest;
import cl.llavero.entity.EstadoReserva;
import cl.llavero.entity.Huesped;
import cl.llavero.entity.Reserva;
import cl.llavero.repository.HabitacionRepository;
import cl.llavero.repository.HuespedRepository;
import cl.llavero.repository.ReservaRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final HabitacionRepository habitacionRepository;
    private final HuespedRepository huespedRepository;

    public ReservaService(ReservaRepository reservaRepository,
                          HabitacionRepository habitacionRepository,
                          HuespedRepository huespedRepository) {
        this.reservaRepository = reservaRepository;
        this.habitacionRepository = habitacionRepository;
        this.huespedRepository = huespedRepository;
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

        Huesped huesped = huespedRepository.findById(huespedId)
            .orElseThrow(() -> new IllegalArgumentException("Huésped no encontrado"));

        Reserva r = new Reserva();
        r.setHuesped(huesped);
        r.setHabitacion(habitacion);
        r.setFechaEntrada(req.fechaEntrada());
        r.setFechaSalida(req.fechaSalida());
        r.setNotas(req.notas());

        reservaRepository.save(r);
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
