package com.smartcampus.backend.features.auth.service;

import com.smartcampus.backend.features.auth.dto.AuthResponse;
import com.smartcampus.backend.features.auth.dto.LoginRequest;
import com.smartcampus.backend.features.auth.dto.SignUpRequest;
import com.smartcampus.backend.features.auth.model.AuthProvider;
import com.smartcampus.backend.features.auth.model.User;
import com.smartcampus.backend.features.auth.model.UserRole;
import com.smartcampus.backend.features.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthResponse signUp(SignUpRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }

        User user = User.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.USER)
                .authProvider(AuthProvider.LOCAL)
                .isActive(true)
                .build();

        User saved = userRepository.save(user);
        return buildAuthResponse(saved);
    }

    public AuthResponse signIn(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        if (!authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return buildAuthResponse(user);
    }

    public AuthResponse buildAuthResponse(User user) {
        return AuthResponse.builder()
                .token(jwtService.generateToken(user))
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .redirectTo(getRedirectRoute(user.getRole()))
                .build();
    }

    public String getRedirectRoute(UserRole role) {
        return switch (role) {
            case ADMIN -> "/admin/dashboard";
            case TECHNICIAN -> "/technician/dashboard";
            case USER -> "/user/dashboard";
        };
    }
}
