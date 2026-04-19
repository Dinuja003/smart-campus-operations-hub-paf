package com.smartcampus.backend.features.ticket.service;

import com.smartcampus.backend.features.ticket.dto.CreateTicketRequest;
import com.smartcampus.backend.features.ticket.model.Ticket;
import com.smartcampus.backend.features.ticket.repository.TicketRepository;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;

    public TicketService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    public Ticket createTicket(CreateTicketRequest request) {
        Ticket ticket = new Ticket();

        ticket.setUserId(new ObjectId(request.getUserId()));

        if (request.getResourceId() != null && !request.getResourceId().isBlank()) {
            ticket.setResourceId(new ObjectId(request.getResourceId()));
        } else {
            ticket.setResourceId(null);
        }

        ticket.setCategory(request.getCategory());
        ticket.setSubject(request.getSubject());
        ticket.setDescription(request.getDescription());
        ticket.setPriority(request.getPriority());
        ticket.setLocation(request.getLocation());
        ticket.setPreferredContact(request.getPreferredContact());
        ticket.setTicketStatus("OPEN");
        ticket.setAssignedTechnicianId(null);
        ticket.setResolutionNotes(null);
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
}