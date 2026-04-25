package com.smartcampus.backend.features.auth.dto;

import com.smartcampus.backend.features.auth.model.User;
import com.smartcampus.backend.features.auth.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
// Auth Flow: safe user projection for API responses without credential fields.
public class UserResponse {
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private UserRole role;

    // Auth Flow: explicit mapper keeps response shape stable for frontend consumers.
    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
