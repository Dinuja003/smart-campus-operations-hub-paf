package com.smartcampus.backend.features.booking.repository;

import com.smartcampus.backend.features.booking.model.Booking;
import com.smartcampus.backend.features.booking.model.BookingStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {

    // All bookings by a specific user
    List<Booking> findByRequestedByOrderByCreatedAtDesc(String userId);

    // All bookings for a specific resource
    List<Booking> findByResourceIdOrderByDateAscStartTimeAsc(String resourceId);

    // All bookings for a resource on a specific date (for conflict checking & schedule display)
    List<Booking> findByResourceIdAndDate(String resourceId, String date);

    // For conflict detection: find APPROVED bookings on the same resource+date that overlap
    @Query("{ 'resourceId': ?0, 'date': ?1, 'status': 'APPROVED', " +
           "'startTimeMinutes': { $lt: ?3 }, 'endTimeMinutes': { $gt: ?2 } }")
    List<Booking> findConflictingBookings(String resourceId, String date,
                                          int startMinutes, int endMinutes);

    // Admin: filter by status
    List<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status);

    // All bookings ordered by createdAt desc (admin view)
    List<Booking> findAllByOrderByCreatedAtDesc();

    // User + status filter
    List<Booking> findByRequestedByAndStatus(String userId, BookingStatus status);
}