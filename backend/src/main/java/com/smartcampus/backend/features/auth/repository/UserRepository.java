package com.smartcampus.backend.features.auth.repository;

import com.smartcampus.backend.features.auth.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByGoogleId(String googleId);
    boolean existsByEmailIgnoreCase(String email);
}
