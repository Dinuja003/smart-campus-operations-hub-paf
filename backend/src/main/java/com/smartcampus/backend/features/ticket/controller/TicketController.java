package com.smartcampus.backend.features.ticket.controller;

import com.smartcampus.backend.features.ticket.dto.TicketResponse;
import com.smartcampus.backend.features.ticket.dto.TicketUpdateRequest;
import com.smartcampus.backend.features.ticket.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.security.core.Authentication;

import java.io.IOException;
import java.util.List;
import com.smartcampus.backend.features.auth.dto.UserResponse;
import com.smartcampus.backend.features.auth.model.User;
import com.smartcampus.backend.features.auth.repository.UserRepository;
import com.smartcampus.backend.features.auth.model.UserRole;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "http://localhost:5173")
public class TicketController {

    private final TicketService ticketService;
    private final UserRepository userRepository;

    public TicketController(TicketService ticketService, UserRepository userRepository) {
        this.ticketService = ticketService;
        this.userRepository = userRepository;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createTicket(
            @RequestPart("ticket") String ticket,
            @RequestPart(value = "files", required = false) MultipartFile[] files
    ) {
        try {
            TicketResponse response = ticketService.createTicket(ticket, files);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("message", "Error creating ticket: " + e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TicketResponse>> getUserTickets(@PathVariable String userId, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof String)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String currentUserId = (String) authentication.getPrincipal();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Only Admin or the user themselves can see their specific tickets
        if (currentUser.getRole() != UserRole.ADMIN && !currentUserId.equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.ok(ticketService.getTicketsByUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable String id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TicketResponse> updateTicket(
            @PathVariable String id,
            @Valid @RequestBody TicketUpdateRequest request,
            Authentication authentication
    ) {
        if (authentication == null || !(authentication.getPrincipal() instanceof String)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(ticketService.updateTicket(id, userId, request));
    }

    @GetMapping
    public ResponseEntity<?> getAllTickets(Authentication authentication) {
        try {
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(java.util.Map.of("message", "Not authenticated"));
            }

            String userId;
            if (authentication.getPrincipal() instanceof String) {
                userId = (String) authentication.getPrincipal();
            } else {
                userId = authentication.getName(); // Fallback to email/username if principal is an object
            }

            User user = userRepository.findById(userId)
                    .or(() -> userRepository.findByEmailIgnoreCase(userId)) // Try finding by email if ID lookup fails
                    .orElseThrow(() -> new RuntimeException("User not found: " + userId));

            return ResponseEntity.ok(ticketService.getAllTickets(user));
        } catch (Exception e) {
            e.printStackTrace(); // Log the stack trace
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("message", "Error loading tickets: " + e.getMessage()));
        }
    }

    @GetMapping("/technicians")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getTechnicians() {
        return ResponseEntity.ok(ticketService.getTechnicians());
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketResponse> assignTechnician(
            @PathVariable String id,
            @RequestParam String technicianId
    ) {
        return ResponseEntity.ok(ticketService.assignTechnician(id, technicianId));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<TicketResponse> addMessage(
            @PathVariable String id,
            @RequestBody com.smartcampus.backend.features.ticket.model.TicketMessage message
    ) {
        return ResponseEntity.ok(ticketService.addMessage(id, message));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable String id,
            Authentication authentication
    ) {
        if (authentication == null || !(authentication.getPrincipal() instanceof String)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String userId = (String) authentication.getPrincipal();
        ticketService.deleteTicket(id, userId);
        return ResponseEntity.noContent().build();
    }
}