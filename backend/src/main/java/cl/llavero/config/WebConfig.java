package cl.llavero.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Solo sirve los archivos físicos (JS, CSS, imágenes)
        // Las rutas de React Router las maneja LlaveroSpaController
        registry.addResourceHandler("/llavero/assets/**")
                .addResourceLocations("classpath:/static/llavero/assets/");
    }
}
