package com.smartcampus.backend.features.auth.service;

import com.smartcampus.backend.features.auth.model.AuthProvider;
import com.smartcampus.backend.features.auth.model.User;
import com.smartcampus.backend.features.auth.model.UserRole;
import com.smartcampus.backend.features.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class OAuth2UserService {

    private final UserRepository userRepository;

    public User upsertGoogleUser(OAuth2User oAuth2User) {
        Map<String, Object> attrs = oAuth2User.getAttributes();
        String email = (String) attrs.get("email");
        String googleId = (String) attrs.get("sub");
        String givenName = (String) attrs.getOrDefault("given_name", "");
        String familyName = (String) attrs.getOrDefault("family_name", "");
        String picture = (String) attrs.get("picture");

        if (email == null || googleId == null) {
            throw new OAuth2AuthenticationException("Google response missing required user attributes");
        }

        return userRepository.findByEmailIgnoreCase(email)
                .map(existing -> {
                    existing.setGoogleId(googleId);
                    existing.setProfileImage(picture);
                    existing.setAuthProvider(AuthProvider.GOOGLE);
                    if (existing.getFirstName() == null || existing.getFirstName().isBlank()) {
                        existing.setFirstName(givenName);
                    }
                    if (existing.getLastName() == null || existing.getLastName().isBlank()) {
                        existing.setLastName(familyName);
                    }
                    return userRepository.save(existing);
                })
                .orElseGet(() -> userRepository.save(User.builder()
                        .firstName(givenName)
                        .lastName(familyName)
                        .username(email.substring(0, email.indexOf('@')))
                        .email(email.toLowerCase())
                        .googleId(googleId)
                        .profileImage(picture)
                        .role(UserRole.USER)
                        .isActive(true)
                        .authProvider(AuthProvider.GOOGLE)
                        .build()));
    }
}
