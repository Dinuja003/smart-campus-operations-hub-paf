package com.smartcampus.backend.features.ticket.service;

import java.util.Date;
import java.util.List;

import org.springframework.stereotype.Service;

import com.smartcampus.backend.features.ticket.model.Ticket;
import com.smartcampus.backend.features.ticket.repository.TicketRepository;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;

    public TicketService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public Ticket createTicket(Ticket ticket) {
        ticket.setTicketStatus("OPEN");
        ticket.setCreatedAt(new Date());
        ticket.setUpdatedAt(new Date());
        return ticketRepository.save(ticket);
    }
}