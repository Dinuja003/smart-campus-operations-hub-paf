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
    public ResponseEntity<TicketResponse> createTicket(
            @RequestPart("ticket") String ticket,
            @RequestPart(value = "files", required = false) MultipartFile[] files
    ) throws IOException {
        TicketResponse response = ticketService.createTicket(ticket, files);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TicketResponse>> getUserTickets(@PathVariable String userId) {
        return ResponseEntity.ok(ticketService.getTicketsByUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable String id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TicketResponse> updateTicket(
            @PathVariable String id,
            @RequestParam String userId,
            @Valid @RequestBody TicketUpdateRequest request
    ) {
        return ResponseEntity.ok(ticketService.updateTicket(id, userId, request));
    }

    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAllTickets(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(ticketService.getAllTickets(user));
    }

    @GetMapping("/technicians")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getTechnicians() {
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
            @RequestParam String userId
    ) {
        ticketService.deleteTicket(id, userId);
        return ResponseEntity.noContent().build();
    }
}