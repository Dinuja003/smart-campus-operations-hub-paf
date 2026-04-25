package com.smartcampus.backend.features.auth.model;

// Authorization: role set used in JWT claims and Spring Security access rules.
public enum UserRole {
    ADMIN,
    USER,
    TECHNICIAN
}
