package cl.llavero.service;

import cl.llavero.entity.Habitacion;
import cl.llavero.entity.HabitacionFoto;
import cl.llavero.repository.HabitacionFotoRepository;
import cl.llavero.repository.HabitacionRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FotoService {

    private static final String UPLOAD_DIR = "uploads/habitaciones/";

    private final HabitacionFotoRepository fotoRepository;
    private final HabitacionRepository habitacionRepository;

    public FotoService(HabitacionFotoRepository fotoRepository,
                       HabitacionRepository habitacionRepository) {
        this.fotoRepository = fotoRepository;
        this.habitacionRepository = habitacionRepository;
    }

    public HabitacionFoto guardar(UUID habitacionId, MultipartFile file, boolean esPortada) throws IOException {
        Habitacion habitacion = habitacionRepository.findById(habitacionId)
            .orElseThrow(() -> new IllegalArgumentException("Habitación no encontrada"));

        String extension = obtenerExtension(file.getOriginalFilename());
        String nombreArchivo = UUID.randomUUID() + extension;

        Path directorio = Paths.get(UPLOAD_DIR);
        Files.createDirectories(directorio);
        Files.write(directorio.resolve(nombreArchivo), file.getBytes());

        String url = "/uploads/habitaciones/" + nombreArchivo;

        if (esPortada) {
            habitacion.getFotos().forEach(f -> f.setEsPortada(false));
            fotoRepository.saveAll(habitacion.getFotos());
        }

        int orden = habitacion.getFotos().size();

        HabitacionFoto foto = new HabitacionFoto();
        foto.setHabitacion(habitacion);
        foto.setUrl(url);
        foto.setOrden(orden);
        foto.setEsPortada(esPortada || habitacion.getFotos().isEmpty());
        return fotoRepository.save(foto);
    }

    public void eliminar(UUID fotoId) throws IOException {
        HabitacionFoto foto = fotoRepository.findById(fotoId)
            .orElseThrow(() -> new IllegalArgumentException("Foto no encontrada"));

        String nombre = Paths.get(foto.getUrl()).getFileName().toString();
        Path archivo = Paths.get(UPLOAD_DIR, nombre);
        Files.deleteIfExists(archivo);

        fotoRepository.delete(foto);
    }

    private String obtenerExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf(".")).toLowerCase();
    }
}
