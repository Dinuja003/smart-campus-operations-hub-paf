package com.smartcampus.backend.features.auth.security;

import com.smartcampus.backend.features.auth.dto.AuthResponse;
import com.smartcampus.backend.features.auth.model.User;
import com.smartcampus.backend.features.auth.service.AuthService;
import com.smartcampus.backend.features.auth.service.OAuth2UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final OAuth2UserService oAuth2UserService;
    private final AuthService authService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        // Auth Flow: convert Google principal -> local user -> JWT auth response.
        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        User user = oAuth2UserService.upsertGoogleUser(principal);
        AuthResponse authResponse = authService.buildAuthResponse(user);

        // Auth Flow: frontend callback receives token/user metadata via query params.
        String redirectUrl = UriComponentsBuilder
                .fromUriString(frontendUrl + "/oauth2/callback")
                .queryParam("token", authResponse.getToken())
                .queryParam("userId", authResponse.getUserId())
                .queryParam("email", authResponse.getEmail())
                .queryParam("role", authResponse.getRole())
                .queryParam("redirectTo", authResponse.getRedirectTo())
                .build()
                .toUriString();

        response.sendRedirect(redirectUrl);
    }
}
