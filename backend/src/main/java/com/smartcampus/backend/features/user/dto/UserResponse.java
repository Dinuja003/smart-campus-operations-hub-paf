package com.smartcampus.backend.features.user.dto;

import com.smartcampus.backend.features.auth.model.AuthProvider;
import com.smartcampus.backend.features.auth.model.UserRole;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class UserResponse {
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private UserRole role;
    private boolean isActive;
    private AuthProvider authProvider;
    private String profileImage;
    private Instant createdAt;
    private Instant updatedAt;
}
