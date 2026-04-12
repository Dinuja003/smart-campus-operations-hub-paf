package com.smartcampus.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Auth endpoints - login/register must be public
                        .requestMatchers("/api/auth/**").permitAll()
                        // Resources - public read
                        .requestMatchers(HttpMethod.GET, "/api/resources/**").permitAll()
                        // Bookings - public read for testing
                        .requestMatchers(HttpMethod.GET, "/api/bookings", "/api/bookings/**").permitAll()
                        // Everything else requires login
                        .anyRequest().authenticated()
                )
                .httpBasic(basic -> {})
                .formLogin(form -> {});

        return http.build();
    }
}