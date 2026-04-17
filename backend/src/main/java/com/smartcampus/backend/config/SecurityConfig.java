package com.smartcampus.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.core.annotation.Order;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    @Order(1)
    public SecurityFilterChain resourceSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/api/resources", "/api/resources/**")
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable);

        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth

                        // ✅ Auth endpoints (login/register)
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        // ✅ Resources (ALLOW FULL CRUD for now)
                        .requestMatchers("/api/resources", "/api/resources/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/resources", "/api/resources/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/resources", "/api/resources/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/resources", "/api/resources/**").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/resources", "/api/resources/**").permitAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/resources", "/api/resources/**").permitAll()

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

                // Disable browser basic-auth popup; frontend handles API errors.
                .httpBasic(httpBasic -> httpBasic.disable())

                // Disable login page (optional cleaner)
                .formLogin(form -> form.disable());

        return http.build();
    }
}
