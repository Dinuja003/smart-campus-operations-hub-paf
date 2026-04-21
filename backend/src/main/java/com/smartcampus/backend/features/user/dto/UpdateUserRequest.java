package com.smartcampus.backend.features.user.dto;

import com.smartcampus.backend.features.auth.model.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @NotNull
    private UserRole role;

    @Size(min = 6)
    private String password;
}
