package com.smartcampus.backend.features.ticket.repository;

import com.smartcampus.backend.features.ticket.model.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository extends MongoRepository<Ticket, String> {
}