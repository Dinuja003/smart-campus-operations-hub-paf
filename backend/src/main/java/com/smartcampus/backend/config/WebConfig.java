package com.smartcampus.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.ticket.upload-dir:uploads/tickets}")
    private String ticketUploadDir;

    @Value("${app.profile.upload-dir:uploads/profiles}")
    private String profileUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path ticketPath = Paths.get(ticketUploadDir).toAbsolutePath();
        registry.addResourceHandler("/uploads/tickets/**")
                .addResourceLocations(ticketPath.toUri().toString() + "/");

        Path profilePath = Paths.get(profileUploadDir).toAbsolutePath();
        registry.addResourceHandler("/uploads/profiles/**")
                .addResourceLocations(profilePath.toUri().toString() + "/");
    }
}
