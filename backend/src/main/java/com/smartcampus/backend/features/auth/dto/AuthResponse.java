package com.smartcampus.backend.features.auth.dto;

import com.smartcampus.backend.features.auth.model.UserRole;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
// Auth Flow: response contract returned after successful login/signup/oauth completion.
public class AuthResponse {
    String token;
    String userId;
    String email;
    UserRole role;
    String redirectTo;
}
