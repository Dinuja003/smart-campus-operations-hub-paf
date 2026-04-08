package com.smartcampus.backend.features.booking.controller;

import com.smartcampus.backend.features.booking.dto.BookingRequestDto;
import com.smartcampus.backend.features.booking.dto.BookingResponseDto;
import com.smartcampus.backend.features.booking.dto.BookingReviewDto;
import com.smartcampus.backend.features.booking.model.BookingStatus;
import com.smartcampus.backend.features.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // ── Helper: extract userId from Spring Security principal ──────────────────
    private String getUserId(Authentication auth) {
        // adjust if your UserDetails class stores the mongoId differently
        return auth.getName();
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // POST /api/bookings  →  Create a new booking request  (USER / ADMIN)
    // ─────────────────────────────────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<BookingResponseDto> createBooking(
            @Valid @RequestBody BookingRequestDto dto,
            Authentication auth) {

        BookingResponseDto response = bookingService.createBooking(dto, getUserId(auth));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/bookings/my  →  Current user's bookings  (USER / ADMIN)
    // ─────────────────────────────────────────────────────────────────────────────
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<List<BookingResponseDto>> getMyBookings(Authentication auth) {
        return ResponseEntity.ok(bookingService.getMyBookings(getUserId(auth)));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/bookings/{id}  →  Single booking detail  (owner or ADMIN)
    // ─────────────────────────────────────────────────────────────────────────────
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<BookingResponseDto> getBookingById(
            @PathVariable String id,
            Authentication auth) {

        return ResponseEntity.ok(
                bookingService.getBookingById(id, getUserId(auth), isAdmin(auth)));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/bookings  →  All bookings with optional status filter  (ADMIN only)
    // ─────────────────────────────────────────────────────────────────────────────
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponseDto>> getAllBookings(
            @RequestParam(required = false) BookingStatus status) {

        return ResponseEntity.ok(bookingService.getAllBookings(status));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // GET /api/bookings/schedule?resourceId=&date=  →  Schedule view  (public-ish)
    // ─────────────────────────────────────────────────────────────────────────────
    @GetMapping("/schedule")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<List<BookingResponseDto>> getSchedule(
            @RequestParam String resourceId,
            @RequestParam String date) {

        return ResponseEntity.ok(
                bookingService.getBookingsByResourceAndDate(resourceId, date));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PUT /api/bookings/{id}/review  →  Approve or reject  (ADMIN only)
    // ─────────────────────────────────────────────────────────────────────────────
    @PutMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponseDto> reviewBooking(
            @PathVariable String id,
            @Valid @RequestBody BookingReviewDto dto,
            Authentication auth) {

        return ResponseEntity.ok(
                bookingService.reviewBooking(id, dto, getUserId(auth)));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PATCH /api/bookings/{id}/cancel  →  Cancel own booking  (USER / ADMIN)
    // ─────────────────────────────────────────────────────────────────────────────
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<BookingResponseDto> cancelBooking(
            @PathVariable String id,
            Authentication auth) {

        return ResponseEntity.ok(
                bookingService.cancelBooking(id, getUserId(auth)));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // DELETE /api/bookings/{id}  →  Hard delete  (ADMIN only)
    // ─────────────────────────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteBooking(@PathVariable String id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.ok(Map.of("message", "Booking deleted successfully"));
    }
}