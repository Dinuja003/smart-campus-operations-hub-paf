package com.smartcampus.backend.features.ticket.service;

import com.smartcampus.backend.features.ticket.model.AttachmentInfo;
import com.smartcampus.backend.features.ticket.model.Ticket;
import com.smartcampus.backend.features.ticket.repository.TicketRepository;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final Path uploadDir = Paths.get("uploads", "tickets");

    public TicketService(TicketRepository ticketRepository) throws IOException {
        this.ticketRepository = ticketRepository;
        Files.createDirectories(uploadDir);
    }

    public Ticket createTicket(
            String userId,
            String resourceId,
            String category,
            String subject,
            String description,
            String priority,
            String location,
            String preferredContact,
            MultipartFile[] attachments
    ) throws IOException {

        validateInput(userId, category, subject, description, priority, location, preferredContact, attachments);

        Ticket ticket = new Ticket();
        ticket.setUserId(new ObjectId(userId));

        if (resourceId != null && !resourceId.isBlank()) {
            ticket.setResourceId(new ObjectId(resourceId));
        } else {
            ticket.setResourceId(null);
        }

        ticket.setCategory(category.trim());
        ticket.setSubject(subject.trim());
        ticket.setDescription(description.trim());
        ticket.setPriority(priority.trim());
        ticket.setLocation(location.trim());
        ticket.setPreferredContact(preferredContact.trim());
        ticket.setTicketStatus("OPEN");
        ticket.setAssignedTechnicianId(null);
        ticket.setResolutionNotes(null);
        ticket.setAttachments(saveAttachments(attachments));
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setUpdatedAt(LocalDateTime.now());

        return ticketRepository.save(ticket);
    }

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public Ticket getTicketById(String id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + id));
    }

    public void deleteTicket(String id) {
        if (!ticketRepository.existsById(id)) {
            throw new RuntimeException("Ticket not found with id: " + id);
        }
        ticketRepository.deleteById(id);
    }

    private void validateInput(
            String userId,
            String category,
            String subject,
            String description,
            String priority,
            String location,
            String preferredContact,
            MultipartFile[] attachments
    ) {
        if (userId == null || userId.isBlank()) {
            throw new RuntimeException("userId is required");
        }

        if (category == null || category.isBlank()) {
            throw new RuntimeException("category is required");
        }

        if (subject == null || subject.isBlank()) {
            throw new RuntimeException("subject is required");
        }

        if (description == null || description.isBlank()) {
            throw new RuntimeException("description is required");
        }

        if (priority == null || priority.isBlank()) {
            throw new RuntimeException("priority is required");
        }

        if (location == null || location.isBlank()) {
            throw new RuntimeException("location is required");
        }

        if (preferredContact == null || preferredContact.isBlank()) {
            throw new RuntimeException("preferredContact is required");
        }

        if (attachments != null && attachments.length > 3) {
            throw new RuntimeException("You can upload up to 3 images only");
        }

        if (attachments != null) {
            for (MultipartFile file : attachments) {
                if (file == null || file.isEmpty()) {
                    continue;
                }

                String contentType = file.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    throw new RuntimeException("Only image files are allowed");
                }

                if (file.getSize() > 5 * 1024 * 1024) {
                    throw new RuntimeException("Each image must be smaller than 5MB");
                }
            }
        }
    }

    private List<AttachmentInfo> saveAttachments(MultipartFile[] attachments) throws IOException {
        List<AttachmentInfo> savedFiles = new ArrayList<>();

        if (attachments == null) {
            return savedFiles;
        }

        for (MultipartFile file : attachments) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            String uniqueName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path targetPath = uploadDir.resolve(uniqueName);
            Files.copy(file.getInputStream(), targetPath);

            AttachmentInfo info = new AttachmentInfo();
            info.setFileName(uniqueName);
            info.setOriginalFileName(file.getOriginalFilename());
            info.setFileType(file.getContentType());
            info.setFileSize(file.getSize());
            info.setFilePath(targetPath.toString());

            savedFiles.add(info);
        }

        return savedFiles;
    }
}