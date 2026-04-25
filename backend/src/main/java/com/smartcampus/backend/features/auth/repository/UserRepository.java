package com.smartcampus.backend.features.auth.repository;

import com.smartcampus.backend.features.auth.model.User;
import com.smartcampus.backend.features.auth.model.UserRole;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

// Auth Flow: persistence gateway for local and Google-based user lookups.
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByGoogleId(String googleId);
    boolean existsByEmailIgnoreCase(String email);
    List<User> findByRole(UserRole role);
}
