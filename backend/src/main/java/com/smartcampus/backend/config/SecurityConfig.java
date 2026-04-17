package com.smartcampus.backend.config;

import com.smartcampus.backend.features.auth.security.JwtAuthenticationFilter;
import com.smartcampus.backend.features.auth.security.OAuth2AuthenticationFailureHandler;
import com.smartcampus.backend.features.auth.security.OAuth2AuthenticationSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;

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
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        // .requestMatchers(HttpMethod.GET, "/api/resources/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/bookings/schedule").hasAnyRole("USER", "ADMIN", "TECHNICIAN")
                        .requestMatchers(HttpMethod.GET, "/api/bookings/**").authenticated()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/technician/**").hasRole("TECHNICIAN")
                        .requestMatchers("/api/user/**").hasAnyRole("USER", "ADMIN", "TECHNICIAN")
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2AuthenticationSuccessHandler)
                        .failureHandler(oAuth2AuthenticationFailureHandler)
                )
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
