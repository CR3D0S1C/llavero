package cl.llavero.service;

import cl.llavero.dto.MetricasResponse;
import cl.llavero.dto.UsuarioRequest;
import cl.llavero.dto.UsuarioResponse;
import cl.llavero.entity.EstadoHabitacion;
import cl.llavero.entity.Habitacion;
import cl.llavero.entity.Rol;
import cl.llavero.entity.Usuario;
import cl.llavero.entity.Venta;
import cl.llavero.repository.HabitacionRepository;
import cl.llavero.repository.UsuarioRepository;
import cl.llavero.repository.VentaRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final VentaRepository ventaRepository;
    private final HabitacionRepository habitacionRepository;
    private final UsuarioRepository usuarioRepository;

    public AdminService(VentaRepository ventaRepository,
                        HabitacionRepository habitacionRepository,
                        UsuarioRepository usuarioRepository) {
        this.ventaRepository = ventaRepository;
        this.habitacionRepository = habitacionRepository;
        this.usuarioRepository = usuarioRepository;
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

    public List<UsuarioResponse> getUsuarios() {
        return usuarioRepository.findAll().stream()
                .sorted((a, b) -> a.getNombre().compareToIgnoreCase(b.getNombre()))
                .map(UsuarioResponse::new)
                .toList();
    }

    public UsuarioResponse crearUsuario(UsuarioRequest req) {
        if (req.getPin() == null || req.getPin().isBlank())
            throw new RuntimeException("El PIN es obligatorio al crear un usuario");

        Usuario u = new Usuario();
        u.setNombre(req.getNombre().trim());
        u.setRol(Rol.valueOf(req.getRol().toLowerCase()));
        u.setPinHash(AuthService.sha256(req.getPin()));
        return new UsuarioResponse(usuarioRepository.save(u));
    }

    public UsuarioResponse editarUsuario(UUID id, UsuarioRequest req) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (req.getNombre() != null && !req.getNombre().isBlank())
            u.setNombre(req.getNombre().trim());
        if (req.getRol() != null && !req.getRol().isBlank())
            u.setRol(Rol.valueOf(req.getRol().toLowerCase()));
        if (req.getPin() != null && !req.getPin().isBlank())
            u.setPinHash(AuthService.sha256(req.getPin()));
        return new UsuarioResponse(usuarioRepository.save(u));
    }

    public void desactivarUsuario(UUID id) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        u.setActivo(false);
        usuarioRepository.save(u);
    }

    private BigDecimal sumar(List<Venta> ventas) {
        return ventas.stream()
                .map(Venta::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
