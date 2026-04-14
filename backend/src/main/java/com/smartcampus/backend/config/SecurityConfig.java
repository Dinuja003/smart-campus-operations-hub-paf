package com.smartcampus.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
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

                        // ✅ Auth endpoints (login/register)
                        .requestMatchers("/api/auth/**").permitAll()

                        // ✅ Resources (ALLOW FULL CRUD for now)
                        .requestMatchers("/api/resources/**").permitAll()

                        // OR if you want method-based control, use this instead:
                        /*
                        .requestMatchers(HttpMethod.GET, "/api/resources/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/resources/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/resources/**").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/resources/**").permitAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/resources/**").permitAll()
                        */

                        // ✅ Booking read (your friend's part - safe for testing)
                        .requestMatchers(HttpMethod.GET, "/api/bookings/**").permitAll()

                        // ❗ Everything else requires authentication
                        .anyRequest().authenticated()
                )

                // Basic auth (for now)
                .httpBasic(Customizer.withDefaults())

                // Disable login page (optional cleaner)
                .formLogin(form -> form.disable());

        return http.build();
    }
}