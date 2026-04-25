package com.smartcampus.backend.features.auth.controller;

import com.smartcampus.backend.features.auth.dto.AuthResponse;
import com.smartcampus.backend.features.auth.dto.LoginRequest;
import com.smartcampus.backend.features.auth.dto.SignUpRequest;
import com.smartcampus.backend.features.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // Auth Flow: local registration endpoint returns JWT + role-aware redirect hint.
    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signUp(@Valid @RequestBody SignUpRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signUp(request));
    }

    // Auth Flow: local login endpoint validates credentials and returns JWT payload.
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> signIn(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.signIn(request));
    }
}
