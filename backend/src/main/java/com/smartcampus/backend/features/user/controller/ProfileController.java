package com.smartcampus.backend.features.user.controller;

import com.smartcampus.backend.features.auth.model.User;
import com.smartcampus.backend.features.auth.repository.UserRepository;
import com.smartcampus.backend.features.user.dto.UpdateProfileRequest;
import com.smartcampus.backend.features.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/user/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;

    @Value("${app.profile.upload-dir:uploads/profiles}")
    private String profileUploadDir;

    @GetMapping
    public ResponseEntity<UserResponse> getProfile(Authentication auth) {
        User user = findUser(auth);
        return ResponseEntity.ok(toResponse(user));
    }

    @PutMapping
    public ResponseEntity<UserResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication auth) {
        User user = findUser(auth);
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        if (request.getProfileImage() == null && user.getProfileImage() != null) {
            deleteFile(user.getProfileImage());
        }
        user.setProfileImage(request.getProfileImage());
        return ResponseEntity.ok(toResponse(userRepository.save(user)));
    }

    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            Authentication auth) throws IOException {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image files are allowed");
        }

        String originalName = file.getOriginalFilename();
        String extension = "jpg";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase();
        }

        String filename = UUID.randomUUID() + "." + extension;
        Path uploadPath = Paths.get(profileUploadDir).toAbsolutePath();
        Files.createDirectories(uploadPath);
        Files.copy(file.getInputStream(), uploadPath.resolve(filename), StandardCopyOption.REPLACE_EXISTING);

        String imageUrl = "/uploads/profiles/" + filename;

        User user = findUser(auth);
        deleteFile(user.getProfileImage());
        user.setProfileImage(imageUrl);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("url", imageUrl));
    }

    @DeleteMapping("/image")
    public ResponseEntity<Void> removeImage(Authentication auth) {
        User user = findUser(auth);
        deleteFile(user.getProfileImage());
        user.setProfileImage(null);
        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }

    private User findUser(Authentication auth) {
        return userRepository.findById(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void deleteFile(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith("/uploads/profiles/")) return;
        String filename = imageUrl.substring("/uploads/profiles/".length());
        try {
            Files.deleteIfExists(Paths.get(profileUploadDir).toAbsolutePath().resolve(filename));
        } catch (IOException ignored) {}
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .isActive(user.isActive())
                .authProvider(user.getAuthProvider())
                .profileImage(user.getProfileImage())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
