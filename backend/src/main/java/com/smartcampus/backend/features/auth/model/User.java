package com.smartcampus.backend.features.auth.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
// Auth Flow: canonical identity record used by JWT, role checks, and profile APIs.
public class User {

    @Id
    private String id;

    private String firstName;
    private String lastName;
    private String username;
    private String email;
    private String passwordHash;
    private String googleId;
    private String profileImage;

    @Field(targetType = FieldType.STRING)
    private UserRole role;

    @Builder.Default
    private boolean isActive = true;

    @Field(targetType = FieldType.STRING)
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
