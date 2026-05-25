package cl.llavero.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LlaveroSpaController {

    private static final Resource INDEX = new ClassPathResource("/static/llavero/index.html");

    @GetMapping(value = {
        "/llavero",
        "/llavero/",
        "/llavero/{p1:[^\\.]*}",
        "/llavero/{p1:[^\\.]*}/{p2:[^\\.]*}",
        "/llavero/{p1:[^\\.]*}/{p2:[^\\.]*}/{p3:[^\\.]*}"
    }, produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<Resource> spa() {
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(INDEX);
    }
}
