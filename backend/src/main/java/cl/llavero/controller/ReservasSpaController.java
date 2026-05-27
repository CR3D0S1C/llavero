package cl.llavero.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ReservasSpaController {

    private static final Resource INDEX = new ClassPathResource("/static/reservas/index.html");

    @GetMapping(value = {
        "/",
        "/habitaciones",
        "/habitaciones/{id:[^\\.]*}",
        "/login",
        "/registro",
        "/mis-reservas"
    }, produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<Resource> spa() {
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(INDEX);
    }
}
