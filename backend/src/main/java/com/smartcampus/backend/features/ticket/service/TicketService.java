package com.smartcampus.backend.features.ticket.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.backend.features.ticket.dto.CreateTicketRequest;
import com.smartcampus.backend.features.ticket.dto.TicketResponse;
import com.smartcampus.backend.features.ticket.dto.TicketUpdateRequest;
import com.smartcampus.backend.features.ticket.model.Attachment;
import com.smartcampus.backend.features.ticket.model.Ticket;
import com.smartcampus.backend.features.ticket.model.TicketStatus;
import com.smartcampus.backend.features.ticket.repository.TicketRepository;
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
import java.util.UUID;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.ticket.upload-dir:uploads/tickets}")
    private String uploadDir;

    private static final int MAX_ATTACHMENTS = 3;
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final long EDIT_DELETE_WINDOW_MINUTES = 15;

    public TicketService(TicketRepository ticketRepository, ObjectMapper objectMapper) {
        this.ticketRepository = ticketRepository;
        this.objectMapper = objectMapper;
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
            return TicketResponse.from(saved, true, true);
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    public List<TicketResponse> getTicketsByUser(String userId) {
        return ticketRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(ticket -> TicketResponse.from(ticket, canEditOrDelete(ticket), canEditOrDelete(ticket)))
                .toList();
    }

    public TicketResponse getTicketById(String id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        return TicketResponse.from(ticket, canEditOrDelete(ticket), canEditOrDelete(ticket));
    }

    public TicketResponse updateTicket(String id, String userId, TicketUpdateRequest request) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (!ticket.getUserId().equals(userId)) {
            throw new RuntimeException("You can only update your own ticket");
        }

        if (!canEditOrDelete(ticket)) {
            throw new RuntimeException("Edit time window has expired or ticket is already being processed");
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

        return TicketResponse.from(updated, canEditOrDelete(updated), canEditOrDelete(updated));
    }

    public void deleteTicket(String id, String userId) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (!ticket.getUserId().equals(userId)) {
            throw new RuntimeException("You can only delete your own ticket");
        }

        if (!canEditOrDelete(ticket)) {
            throw new RuntimeException("Delete time window has expired or ticket is already being processed");
        }

        ticketRepository.delete(ticket);
    }

    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAll()
                .stream()
                .map(ticket -> TicketResponse.from(ticket, false, false))
                .toList();
    }

    public TicketResponse addMessage(String ticketId, com.smartcampus.backend.features.ticket.model.TicketMessage message) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        message.setTimestamp(LocalDateTime.now());
        ticket.getMessages().add(message);
        Ticket saved = ticketRepository.save(ticket);
        
        return TicketResponse.from(saved, canEditOrDelete(saved), canEditOrDelete(saved));
    }

    private boolean canEditOrDelete(Ticket ticket) {
        if (ticket.getStatus() != TicketStatus.OPEN) {
            return false;
        }

        long minutes = Duration.between(ticket.getCreatedAt(), LocalDateTime.now()).toMinutes();
        return minutes <= EDIT_DELETE_WINDOW_MINUTES;
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