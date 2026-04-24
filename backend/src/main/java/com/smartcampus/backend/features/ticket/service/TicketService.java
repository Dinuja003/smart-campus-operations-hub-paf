package com.smartcampus.backend.features.ticket.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.backend.features.ticket.dto.CreateTicketRequest;
import com.smartcampus.backend.features.ticket.dto.TicketResponse;
import com.smartcampus.backend.features.ticket.dto.TicketUpdateRequest;
import com.smartcampus.backend.features.ticket.model.Attachment;
import com.smartcampus.backend.features.ticket.model.Ticket;
import com.smartcampus.backend.features.ticket.model.TicketStatus;
import com.smartcampus.backend.features.ticket.repository.TicketRepository;
import com.smartcampus.backend.features.auth.model.User;
import com.smartcampus.backend.features.auth.dto.UserResponse;
import com.smartcampus.backend.features.auth.repository.UserRepository;
import com.smartcampus.backend.features.auth.model.UserRole;
import com.smartcampus.backend.features.notification.model.NotificationType;
import com.smartcampus.backend.features.notification.service.NotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    @Value("${app.ticket.upload-dir:uploads/tickets}")
    private String uploadDir;

    private static final int MAX_ATTACHMENTS = 3;
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final long EDIT_DELETE_WINDOW_MINUTES = 15;

    public TicketService(TicketRepository ticketRepository, UserRepository userRepository,
                         ObjectMapper objectMapper, NotificationService notificationService) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
    }

    public TicketResponse createTicket(String ticketJson, MultipartFile[] files) throws IOException {
        try {
            CreateTicketRequest request = objectMapper.readValue(ticketJson, CreateTicketRequest.class);
            validateAttachments(files);

            Ticket ticket = new Ticket();
            ticket.setUserId(request.getUserId());
            ticket.setResourceId(blankToNull(request.getResourceId()));
            ticket.setCategory(request.getCategory());
            ticket.setSubject(StringUtils.hasText(request.getSubject()) ? request.getSubject().trim() : "No Subject");
            ticket.setDescription(StringUtils.hasText(request.getDescription()) ? request.getDescription().trim() : "");
            ticket.setPriority(request.getPriority());
            ticket.setLocation(StringUtils.hasText(request.getLocation()) ? request.getLocation().trim() : "Not Specified");
            ticket.setPreferredContact(StringUtils.hasText(request.getPreferredContact()) ? request.getPreferredContact().trim() : "None");
            ticket.setStatus(TicketStatus.OPEN);
            ticket.setCreatedAt(LocalDateTime.now());
            ticket.setUpdatedAt(LocalDateTime.now());

            List<Attachment> attachments = saveFiles(files);
            ticket.setAttachments(attachments);

            Ticket saved = ticketRepository.save(ticket);

            userRepository.findByRole(UserRole.ADMIN).forEach(admin ->
                    notificationService.send(
                            admin.getId(),
                            NotificationType.TICKET_SUBMITTED,
                            "New Support Ticket",
                            "A new ticket has been submitted: " + saved.getSubject(),
                            "/admin/tickets"
                    )
            );

            return TicketResponse.from(saved, true, true, null);
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    public List<TicketResponse> getTicketsByUser(String userId) {
        List<Ticket> tickets = ticketRepository.findByUserIdOrderByCreatedAtDesc(new org.bson.types.ObjectId(userId));
        Map<String, String> techNames = getTechnicianNameMap();
        
        return tickets.stream()
                .filter(t -> t.getHiddenBy() == null || !t.getHiddenBy().contains(userId))
                .map(ticket -> TicketResponse.from(
                    ticket, 
                    canEdit(ticket), 
                    canDelete(ticket, userId), 
                    ticket.getAssignedTechnicianId() != null ? techNames.getOrDefault(ticket.getAssignedTechnicianId(), "Unknown Technician") : null
                ))
                .toList();
    }

    public TicketResponse getTicketById(String id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        // Get userId from context if possible, but for response mapping we use the requestorId if passed
        // For simplicity in getTicketById, we use a generic check or pass the authenticated user id
        return TicketResponse.from(ticket, canEdit(ticket), canDelete(ticket, ticket.getUserId()), resolveTechnicianName(ticket.getAssignedTechnicianId()));
    }

    public TicketResponse updateTicketStatus(String id, String userId, TicketStatus status) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User user = userRepository.findById(userId)
                .or(() -> userRepository.findByEmailIgnoreCase(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Only Admin or the assigned technician can update status
        if (user.getRole() != UserRole.ADMIN && !userId.equals(ticket.getAssignedTechnicianId())) {
            throw new RuntimeException("Unauthorized: Only Admin or the assigned technician can update status");
        }

        ticket.setStatus(status);
        ticket.setUpdatedAt(LocalDateTime.now());
        Ticket updated = ticketRepository.save(ticket);

        // Notify user about status change - wrap in try-catch to prevent 500 if notification fails
        try {
            notificationService.send(
                    updated.getUserId(),
                    NotificationType.TICKET_UPDATED,
                    "Ticket Status Updated",
                    "Your ticket status has been changed to: " + status,
                    "/tickets/" + id
            );
        } catch (Exception e) {
            System.err.println("Failed to send notification: " + e.getMessage());
        }

        return TicketResponse.from(updated, false, false, resolveTechnicianName(updated.getAssignedTechnicianId()));
    }

    public TicketResponse updateTicket(String id, String userId, TicketUpdateRequest request) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (!ticket.getUserId().equals(userId)) {
            throw new RuntimeException("You can only update your own ticket");
        }

        if (!canEdit(ticket)) {
            throw new RuntimeException("Cannot edit ticket: Technician has already started work or ticket is not open.");
        }

        if (request.getResourceId() != null) {
            ticket.setResourceId(blankToNull(request.getResourceId()));
        }
        if (request.getCategory() != null) {
            ticket.setCategory(request.getCategory());
        }
        if (StringUtils.hasText(request.getSubject())) {
            ticket.setSubject(request.getSubject().trim());
        }
        if (StringUtils.hasText(request.getDescription())) {
            ticket.setDescription(request.getDescription().trim());
        }
        if (request.getPriority() != null) {
            ticket.setPriority(request.getPriority());
        }
        if (StringUtils.hasText(request.getLocation())) {
            ticket.setLocation(request.getLocation().trim());
        }
        if (StringUtils.hasText(request.getPreferredContact())) {
            ticket.setPreferredContact(request.getPreferredContact().trim());
        }

        ticket.setUpdatedAt(LocalDateTime.now());
        Ticket updated = ticketRepository.save(ticket);

        return TicketResponse.from(updated, canEdit(updated), canDelete(updated, userId), resolveTechnicianName(updated.getAssignedTechnicianId()));
    }

    public void deleteTicket(String id, String userId) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User user = userRepository.findById(userId)
                .or(() -> userRepository.findByEmailIgnoreCase(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        // If it's the creator and it's not assigned yet -> Hard Delete
        if (ticket.getUserId().equals(userId) && ticket.getAssignedTechnicianId() == null) {
            ticketRepository.delete(ticket);
        } else {
            // Otherwise, it's a "Delete for Me" (Hide)
            if (ticket.getHiddenBy() == null) {
                ticket.setHiddenBy(new ArrayList<>());
            }
            if (!ticket.getHiddenBy().contains(userId)) {
                ticket.getHiddenBy().add(userId);
                ticketRepository.save(ticket);
            }
        }
    }

    public List<TicketResponse> getAllTickets(User user) {
        List<Ticket> tickets;
        if (user.getRole() == UserRole.ADMIN) {
            tickets = ticketRepository.findAll();
        } else if (user.getRole() == UserRole.TECHNICIAN) {
            tickets = ticketRepository.findAll().stream()
                    .filter(t -> user.getId().equals(t.getAssignedTechnicianId()))
                    .toList();
        } else {
            tickets = ticketRepository.findByUserIdOrderByCreatedAtDesc(new org.bson.types.ObjectId(user.getId()));
        }

        Map<String, String> techNames = getTechnicianNameMap();

        return tickets.stream()
                .filter(t -> t.getHiddenBy() == null || !t.getHiddenBy().contains(user.getId()))
                .map(ticket -> TicketResponse.from(
                    ticket, 
                    user.getRole() == UserRole.ADMIN ? false : canEdit(ticket), 
                    user.getRole() == UserRole.ADMIN ? false : canDelete(ticket, user.getId()), 
                    ticket.getAssignedTechnicianId() != null ? techNames.getOrDefault(ticket.getAssignedTechnicianId(), "Unknown Technician") : null
                ))
                .toList();
    }

    private Map<String, String> getTechnicianNameMap() {
        try {
            return userRepository.findByRole(UserRole.TECHNICIAN).stream()
                    .collect(Collectors.toMap(
                        User::getId, 
                        u -> u.getFirstName() + " " + u.getLastName(),
                        (existing, replacement) -> existing
                    ));
        } catch (Exception e) {
            return new java.util.HashMap<>();
        }
    }

    public TicketResponse addMessage(String ticketId, com.smartcampus.backend.features.ticket.model.TicketMessage message) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        message.setTimestamp(LocalDateTime.now());
        ticket.getMessages().add(message);
        Ticket saved = ticketRepository.save(ticket);

        String senderRole = message.getSenderRole();
        String senderName = message.getSenderName();
        String subject = saved.getSubject();

        if ("USER".equals(senderRole)) {
            // Notify all admins
            userRepository.findByRole(UserRole.ADMIN).forEach(admin ->
                    notificationService.send(
                            admin.getId(),
                            NotificationType.TICKET_MESSAGE,
                            "New Message on Ticket",
                            senderName + " replied on: " + subject,
                            "/admin/tickets/" + ticketId
                    )
            );
            // Notify assigned technician if present
            if (saved.getAssignedTechnicianId() != null) {
                notificationService.send(
                        saved.getAssignedTechnicianId(),
                        NotificationType.TICKET_MESSAGE,
                        "New Message on Ticket",
                        senderName + " replied on: " + subject,
                        "/admin/tickets/" + ticketId
                );
            }
        } else {
            // ADMIN or TECHNICIAN replied — notify the ticket creator
            notificationService.send(
                    saved.getUserId(),
                    NotificationType.TICKET_MESSAGE,
                    "New Reply on Your Ticket",
                    senderName + " replied on: " + subject,
                    "/tickets/" + ticketId
            );
        }

        return TicketResponse.from(saved, canEdit(saved), canDelete(saved, message.getSenderId()), resolveTechnicianName(saved.getAssignedTechnicianId()));
    }

    public List<UserResponse> getTechnicians() {
        return userRepository.findByRole(UserRole.TECHNICIAN)
                .stream()
                .map(UserResponse::from)
                .toList();
    }

    public TicketResponse assignTechnician(String ticketId, String technicianId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new RuntimeException("Technician not found"));

        if (technician.getRole() != UserRole.TECHNICIAN) {
            throw new RuntimeException("User is not a technician");
        }

        ticket.setAssignedTechnicianId(technicianId);
        ticket.setUpdatedAt(LocalDateTime.now());
        
        Ticket saved = ticketRepository.save(ticket);

        notificationService.send(
                technicianId,
                NotificationType.TICKET_ASSIGNED,
                "Ticket Assigned to You",
                "You have been assigned to ticket: " + saved.getSubject(),
                "/admin/tickets/" + ticketId
        );

        return TicketResponse.from(saved, false, false, resolveTechnicianName(technicianId));
    }

    private String resolveTechnicianName(String technicianId) {
        if (technicianId == null || technicianId.trim().isEmpty()) return null;
        try {
            return userRepository.findById(technicianId)
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Unknown Technician");
        } catch (Exception e) {
            return "Unknown Technician";
        }
    }

    private boolean canEdit(Ticket ticket) {
        // Can edit only if status is OPEN (tech hasn't started work)
        return ticket.getStatus() == TicketStatus.OPEN;
    }

    private boolean canDelete(Ticket ticket, String userId) {
        // Staff can always hide a ticket from their dashboard
        // Students can hard-delete before assignment OR hide after resolution
        if (!ticket.getUserId().equals(userId)) return true; // It's staff or another user
        
        boolean beforeAssignment = ticket.getAssignedTechnicianId() == null;
        boolean afterResolution = ticket.getStatus() == TicketStatus.RESOLVED;
        
        return beforeAssignment || afterResolution;
    }

    private void validateAttachments(MultipartFile[] files) {
        if (files == null) return;

        if (files.length > MAX_ATTACHMENTS) {
            throw new RuntimeException("You can upload up to 3 images only");
        }

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;

            if (file.getSize() > MAX_FILE_SIZE) {
                throw new RuntimeException("Each file must be less than 5MB");
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new RuntimeException("Only image files are allowed");
            }
        }
    }

    private List<Attachment> saveFiles(MultipartFile[] files) throws IOException {
        List<Attachment> attachments = new ArrayList<>();
        if (files == null || files.length == 0) return attachments;

        // Use absolute path to avoid issues with Tomcat temporary directories
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        Files.createDirectories(uploadPath);

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;

            String originalName = file.getOriginalFilename() == null ? "image" : file.getOriginalFilename();
            String storedName = UUID.randomUUID() + "_" + originalName;
            Path targetPath = uploadPath.resolve(storedName);

            // Transfer to absolute file location
            file.transferTo(targetPath.toFile());

            attachments.add(new Attachment(
                    originalName,
                    file.getContentType(),
                    "/uploads/tickets/" + storedName, // Store relative URL for frontend
                    (int) file.getSize()
            ));
        }

        return attachments;
    }

    private String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}