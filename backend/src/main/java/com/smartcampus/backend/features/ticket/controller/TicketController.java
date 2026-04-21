package com.smartcampus.backend.features.ticket.controller;

import com.smartcampus.backend.features.ticket.model.Ticket;
import com.smartcampus.backend.features.ticket.service.TicketService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Ticket createTicket(
            @RequestParam String userId,
            @RequestParam(required = false) String resourceId,
            @RequestParam String category,
            @RequestParam String subject,
            @RequestParam String description,
            @RequestParam String priority,
            @RequestParam String location,
            @RequestParam String preferredContact,
            @RequestParam(required = false) MultipartFile[] attachments
    ) throws IOException {
        return ticketService.createTicket(
                userId,
                resourceId,
                category,
                subject,
                description,
                priority,
                location,
                preferredContact,
                attachments
        );
    }

    @GetMapping
    public List<Ticket> getAllTickets() {
        return ticketService.getAllTickets();
    }

    @GetMapping("/{id}")
    public Ticket getTicketById(@PathVariable String id) {
        return ticketService.getTicketById(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTicket(@PathVariable String id) {
        ticketService.deleteTicket(id);
    }
}