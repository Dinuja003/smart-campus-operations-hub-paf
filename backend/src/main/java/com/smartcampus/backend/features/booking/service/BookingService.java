package com.smartcampus.backend.features.booking.service;

import com.smartcampus.backend.features.Resources.Model.Resource;
import com.smartcampus.backend.features.Resources.Repository.ResourceRepository;
import com.smartcampus.backend.features.booking.dto.BookingRequestDto;
import com.smartcampus.backend.features.booking.dto.BookingResponseDto;
import com.smartcampus.backend.features.booking.dto.BookingReviewDto;
import com.smartcampus.backend.features.booking.model.Booking;
import com.smartcampus.backend.features.booking.model.BookingStatus;
import com.smartcampus.backend.features.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;

    // ─── Helper: convert "HH:mm" to total minutes since midnight ───────────────
    private int toMinutes(String time) {
        String[] parts = time.split(":");
        return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
    }

    // ─── Helper: build response DTO ─────────────────────────────────────────────
    private BookingResponseDto toDto(Booking b) {
        return BookingResponseDto.builder()
                .id(b.getId())
                .resourceId(b.getResourceId())
                .resourceType(b.getResourceType())
                .requestedBy(b.getRequestedBy())
                .bookingReason(b.getBookingReason())
                .date(b.getDate())
                .startTime(b.getStartTime())
                .endTime(b.getEndTime())
                .purpose(b.getPurpose())
                .expectedAttendees(b.getExpectedAttendees())
                .status(b.getStatus())
                .adminNote(b.getAdminNote())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }

    // ─── CREATE booking request ─────────────────────────────────────────────────
    public BookingResponseDto createBooking(BookingRequestDto dto, String userId) {
        Resource resource = resourceRepository.findById(dto.getResourceId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Resource not found"));

        if (!"AVAILABLE".equalsIgnoreCase(resource.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Selected resource is not available for booking");
        }

        if (dto.getExpectedAttendees() > resource.getCapacity()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Expected attendees exceed resource capacity");
        }

        int startMins = toMinutes(dto.getStartTime());
        int endMins   = toMinutes(dto.getEndTime());

        if (endMins <= startMins) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "End time must be after start time");
        }

        // Conflict check: any APPROVED booking on same resource/date that overlaps
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                dto.getResourceId(), dto.getDate(), startMins, endMins);

        if (!conflicts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This resource is already booked for the selected time slot");
        }

        Booking booking = Booking.builder()
                .resourceId(dto.getResourceId())
            .resourceType(resource.getType())
                .requestedBy(userId)
                .bookingReason(dto.getBookingReason())
                .date(dto.getDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .startTimeMinutes(startMins)
                .endTimeMinutes(endMins)
                .purpose(dto.getPurpose())
                .expectedAttendees(dto.getExpectedAttendees())
                .status(BookingStatus.PENDING)
                .build();

        Booking saved = bookingRepository.save(booking);
        log.info("Booking created: {} by user {}", saved.getId(), userId);
        return toDto(saved);
    }

    // ─── GET my bookings ────────────────────────────────────────────────────────
    public List<BookingResponseDto> getMyBookings(String userId) {
        return bookingRepository.findByRequestedByOrderByCreatedAtDesc(userId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    // ─── GET single booking ─────────────────────────────────────────────────────
    public BookingResponseDto getBookingById(String bookingId, String userId, boolean isAdmin) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Booking not found"));

        if (!isAdmin && !b.getRequestedBy().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You do not have access to this booking");
        }
        return toDto(b);
    }

    // ─── GET all bookings (admin) ────────────────────────────────────────────────
    public List<BookingResponseDto> getAllBookings(BookingStatus statusFilter) {
        if (statusFilter != null) {
            return bookingRepository.findByStatusOrderByCreatedAtDesc(statusFilter)
                    .stream().map(this::toDto).collect(Collectors.toList());
        }
        return bookingRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    // ─── GET bookings for a resource on a date (schedule view) ──────────────────
    public List<BookingResponseDto> getBookingsByResourceAndDate(String resourceId, String date) {
        return bookingRepository.findByResourceIdAndDate(resourceId, date)
                .stream()
                .filter(b -> b.getStatus() == BookingStatus.APPROVED
                          || b.getStatus() == BookingStatus.PENDING)
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ─── ADMIN: approve or reject ────────────────────────────────────────────────
    public BookingResponseDto reviewBooking(String bookingId, BookingReviewDto dto, String adminId) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Booking not found"));

        if (b.getStatus() != BookingStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only PENDING bookings can be reviewed");
        }

        if (!dto.getApproved() && (dto.getAdminNote() == null || dto.getAdminNote().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A reason is required when rejecting a booking");
        }

        b.setStatus(dto.getApproved() ? BookingStatus.APPROVED : BookingStatus.REJECTED);
        b.setAdminNote(dto.getAdminNote());
        b.setReviewedBy(adminId);

        Booking saved = bookingRepository.save(b);
        log.info("Booking {} {} by admin {}", bookingId,
                saved.getStatus(), adminId);
        return toDto(saved);
    }

    // ─── USER / ADMIN: cancel booking ───────────────────────────────────────────
    public BookingResponseDto cancelBooking(String bookingId, String userId, boolean isAdmin) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Booking not found"));

        if (!isAdmin && !b.getRequestedBy().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only cancel your own bookings");
        }

        if (b.getStatus() == BookingStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Booking is already cancelled");
        }

        if (b.getStatus() == BookingStatus.REJECTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot cancel a rejected booking");
        }

        b.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(b);
        log.info("Booking {} cancelled by user {}", bookingId, userId);
        return toDto(saved);
    }

    // ─── ADMIN: delete booking ───────────────────────────────────────────────────
    public void deleteBooking(String bookingId) {
        if (!bookingRepository.existsById(bookingId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found");
        }
        bookingRepository.deleteById(bookingId);
        log.info("Booking {} deleted", bookingId);
    }
}