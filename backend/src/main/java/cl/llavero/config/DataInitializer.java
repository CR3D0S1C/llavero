package cl.llavero.config;

import cl.llavero.entity.*;
import cl.llavero.repository.*;
import cl.llavero.service.AuthService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final TipoHabitacionRepository tipoRepository;
    private final HabitacionRepository habitacionRepository;
    private final HabitacionPrecioRepository precioRepository;
    private final ProductoRepository productoRepository;

    public DataInitializer(UsuarioRepository usuarioRepository,
                           TipoHabitacionRepository tipoRepository,
                           HabitacionRepository habitacionRepository,
                           HabitacionPrecioRepository precioRepository,
                           ProductoRepository productoRepository) {
        this.usuarioRepository = usuarioRepository;
        this.tipoRepository = tipoRepository;
        this.habitacionRepository = habitacionRepository;
        this.precioRepository = precioRepository;
        this.productoRepository = productoRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (usuarioRepository.count() == 0) {
            crearUsuarios();
        }
        if (tipoRepository.count() == 0) {
            crearTiposYHabitaciones();
        }
        if (productoRepository.count() == 0) {
            crearProductos();
        }
    }

    private void crearUsuarios() {
        String pinJefe   = AuthService.sha256("1271");
        String pinCajero = AuthService.sha256("1891");

        usuarioRepository.saveAll(List.of(
            usuario("Abelardo Cruchaga", Rol.jefe,   pinJefe),
            usuario("Salma Cruchaga",    Rol.jefe,   pinJefe),
            usuario("Cesar Cruchaga",    Rol.jefe,   pinJefe),
            usuario("cajero1",           Rol.cajero, pinCajero),
            usuario("cajero2",           Rol.cajero, pinCajero),
            usuario("cajero3",           Rol.cajero, pinCajero)
        ));
    }

    private Usuario usuario(String nombre, Rol rol, String pinHash) {
        Usuario u = new Usuario();
        u.setNombre(nombre);
        u.setRol(rol);
        u.setPinHash(pinHash);
        return u;
    }

    private void crearTiposYHabitaciones() {
        // Capturar entidades gestionadas devueltas por save() — con ID String usa merge()
        TipoHabitacion loft    = tipoRepository.save(tipo("loft", "Loft", "Privado", "#6c63ff"));
        TipoHabitacion matPriv = tipoRepository.save(tipo("matrimonial-privado", "Matrimonial baño privado", "Privado", "#3b82f6"));
        TipoHabitacion indPriv = tipoRepository.save(tipo("individual-privado", "Individual baño privado", "Privado", "#06b6d4"));
        TipoHabitacion matComp = tipoRepository.save(tipo("matrimonial-compartido", "Matrimonial baño compartido", "Compartido", "#8b5cf6"));
        TipoHabitacion familiar = tipoRepository.save(tipo("familiar-compartido", "Familiar baño compartido", "Compartido", "#f59e0b"));
        TipoHabitacion indComp = tipoRepository.save(tipo("individual-compartido", "Individual baño compartido", "Compartido", "#6b7280"));

        Habitacion h1 = habitacionRepository.save(habitacion("L101", loft, "Suite loft con vista"));
        preciosLoft(h1);

        Habitacion h2 = habitacionRepository.save(habitacion("M201", matPriv, "Matrimonial con baño privado"));
        preciosMatrimonial(h2, false);

        Habitacion h3 = habitacionRepository.save(habitacion("M202", matPriv, "Matrimonial con baño privado"));
        preciosMatrimonial(h3, false);

        Habitacion h4 = habitacionRepository.save(habitacion("I301", indPriv, "Individual con baño privado"));
        preciosIndividual(h4, false);

        Habitacion h5 = habitacionRepository.save(habitacion("M401", matComp, "Matrimonial baño compartido"));
        preciosMatrimonial(h5, true);

        Habitacion h6 = habitacionRepository.save(habitacion("F501", familiar, "Familiar baño compartido"));
        preciosFamiliar(h6);

        Habitacion h7 = habitacionRepository.save(habitacion("I601", indComp, "Individual baño compartido"));
        preciosIndividual(h7, true);
    }

    private void preciosLoft(Habitacion h) {
        guardarPrecios(h, List.of(
                new int[]{2, 0}, new int[]{3, 0}, new int[]{4, 0}
        ), List.of("1h", "2h", "3h", "noche"), new BigDecimal[][]{
                {bd(14000), bd(20000), bd(25000), bd(45000)},
                {bd(16000), bd(22000), bd(28000), bd(50000)},
                {bd(18000), bd(25000), bd(32000), bd(58000)}
        });
    }

    private void preciosMatrimonial(Habitacion h, boolean compartido) {
        BigDecimal base = compartido ? bd(10000) : bd(12000);
        BigDecimal base2 = compartido ? bd(16000) : bd(18000);
        BigDecimal base3 = compartido ? bd(20000) : bd(22000);
        BigDecimal baseN = compartido ? bd(28000) : bd(35000);
        guardarPrecios(h, List.of(new int[]{2, 0}),
                List.of("1h", "2h", "3h", "noche"),
                new BigDecimal[][]{{base, base2, base3, baseN}});
    }

    private void preciosIndividual(Habitacion h, boolean compartido) {
        BigDecimal base = compartido ? bd(8000) : bd(10000);
        BigDecimal base2 = compartido ? bd(13000) : bd(15000);
        BigDecimal base3 = compartido ? bd(17000) : bd(19000);
        BigDecimal baseN = compartido ? bd(22000) : bd(28000);
        List<String> duraciones = compartido ? List.of("noche") : List.of("1h", "2h", "3h", "noche");
        if (compartido) {
            precioRepository.save(precio(h, 1, "noche", baseN));
        } else {
            guardarPrecios(h, List.of(new int[]{1, 0}),
                    duraciones,
                    new BigDecimal[][]{{base, base2, base3, baseN}});
        }
    }

    private void preciosFamiliar(Habitacion h) {
        guardarPrecios(h, List.of(
                new int[]{2, 0}, new int[]{3, 0}, new int[]{4, 0}
        ), List.of("1h", "2h", "3h", "noche"), new BigDecimal[][]{
                {bd(12000), bd(18000), bd(22000), bd(32000)},
                {bd(14000), bd(20000), bd(25000), bd(36000)},
                {bd(16000), bd(23000), bd(29000), bd(42000)}
        });
    }

    private void guardarPrecios(Habitacion h, List<int[]> personasConfig,
                                List<String> duraciones, BigDecimal[][] valores) {
        for (int pi = 0; pi < personasConfig.size(); pi++) {
            int personas = personasConfig.get(pi)[0];
            for (int di = 0; di < duraciones.size(); di++) {
                precioRepository.save(precio(h, personas, duraciones.get(di), valores[pi][di]));
            }
        }
    }

    private HabitacionPrecio precio(Habitacion h, int personas, String duracion, BigDecimal precio) {
        HabitacionPrecio p = new HabitacionPrecio();
        p.setHabitacion(h);
        p.setPersonas(personas);
        p.setDuracion(duracion);
        p.setPrecio(precio);
        return p;
    }

    private void crearProductos() {
        productoRepository.saveAll(List.of(
                producto("Desayuno continental", bd(4500), "🥐", "Desayunos"),
                producto("Desayuno completo", bd(6500), "🍳", "Desayunos"),
                producto("Café + Tostadas", bd(3000), "☕", "Desayunos"),
                producto("Agua mineral 500ml", bd(1000), "💧", "Snacks"),
                producto("Bebida lata", bd(1200), "🥤", "Snacks"),
                producto("Papas fritas", bd(1500), "🍟", "Snacks"),
                producto("Chocolate", bd(800), "🍫", "Snacks"),
                producto("Kit aseo básico", bd(2000), "🧴", "Aseo"),
                producto("Toalla extra", bd(1500), "🛁", "Aseo"),
                producto("Condón (pack x3)", bd(2500), "💊", "Aseo"),
                producto("Cargador universal", bd(3000), "🔌", "Electrónica"),
                producto("Audífonos desechables", bd(2000), "🎧", "Electrónica")
        ));
    }

    private Producto producto(String nombre, BigDecimal precio, String icono, String categoria) {
        Producto p = new Producto();
        p.setNombre(nombre);
        p.setPrecio(precio);
        p.setIcono(icono);
        p.setCategoria(categoria);
        return p;
    }

    private TipoHabitacion tipo(String id, String label, String bano, String color) {
        TipoHabitacion t = new TipoHabitacion();
        t.setId(id);
        t.setLabel(label);
        t.setBano(bano);
        t.setColor(color);
        return t;
    }

    private Habitacion habitacion(String numero, TipoHabitacion tipo, String descripcion) {
        Habitacion h = new Habitacion();
        h.setNumero(numero);
        h.setTipo(tipo);
        h.setDescripcion(descripcion);
        return h;
    }

    private BigDecimal bd(int valor) {
        return BigDecimal.valueOf(valor);
    }
}
