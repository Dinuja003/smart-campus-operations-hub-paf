package com.smartcampus.backend.features.booking.service;

import com.smartcampus.backend.features.Resources.Model.Resource;
import com.smartcampus.backend.features.Resources.Repository.ResourceRepository;
import com.smartcampus.backend.features.booking.dto.BookingAnalyticsDto;
import com.smartcampus.backend.features.booking.model.Booking;
import com.smartcampus.backend.features.booking.model.BookingStatus;
import com.smartcampus.backend.features.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingAnalyticsService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;

    public BookingAnalyticsDto generateAnalytics() {
        List<Booking> bookings = bookingRepository.findAll();

        return BookingAnalyticsDto.builder()
                .totalBookings(bookings.size())
                .bookingsByStatus(getBookingsByStatus(bookings))
                .hourlyDistribution(getHourlyDistribution(bookings))
                .topResources(getTopResources(bookings))
                .averageBookingDurationHours(getAverageBookingDuration(bookings))
                .uniqueBookers(countUniqueBookers(bookings))
                .dailyTrend(getDailyTrend(bookings))
                .build();
    }

    private Map<BookingStatus, Integer> getBookingsByStatus(List<Booking> bookings) {
        Map<BookingStatus, Long> counts = bookings.stream()
                .filter(booking -> booking.getStatus() != null)
                .collect(Collectors.groupingBy(Booking::getStatus, Collectors.counting()));

        Map<BookingStatus, Integer> normalized = new HashMap<>();
        for (BookingStatus status : BookingStatus.values()) {
            normalized.put(status, counts.getOrDefault(status, 0L).intValue());
        }
        return normalized;
    }

    private List<BookingAnalyticsDto.HourlyBookingsDto> getHourlyDistribution(List<Booking> bookings) {
        Map<Integer, Integer> countsByHour = new HashMap<>();
        for (int hour = 0; hour < 24; hour++) {
            countsByHour.put(hour, 0);
        }

        for (Booking booking : bookings) {
            Integer hour = extractHour(booking.getStartTime());
            if (hour != null && hour >= 0 && hour <= 23) {
                countsByHour.put(hour, countsByHour.get(hour) + 1);
            }
        }

        List<BookingAnalyticsDto.HourlyBookingsDto> result = new ArrayList<>();
        for (int hour = 0; hour < 24; hour++) {
            result.add(BookingAnalyticsDto.HourlyBookingsDto.builder()
                    .hour(hour)
                    .count(countsByHour.get(hour))
                    .build());
        }
        return result;
    }

    private List<BookingAnalyticsDto.ResourceBookingsDto> getTopResources(List<Booking> bookings) {
        Map<String, Long> bookingCountByResource = bookings.stream()
                .map(Booking::getResourceId)
                .filter(resourceId -> resourceId != null && !resourceId.isBlank())
                .collect(Collectors.groupingBy(resourceId -> resourceId, Collectors.counting()));

        return bookingCountByResource.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .map(entry -> {
                    String resourceId = entry.getKey();
                    Optional<Resource> resource = resourceRepository.findById(resourceId);
                    String resourceName = resource.map(Resource::getName).orElse("Unknown Resource");

                    return BookingAnalyticsDto.ResourceBookingsDto.builder()
                            .resourceId(resourceId)
                            .resourceName(resourceName)
                            .bookingCount(entry.getValue().intValue())
                            .build();
                })
                .toList();
    }

    private double getAverageBookingDuration(List<Booking> bookings) {
        List<Integer> durationsInMinutes = bookings.stream()
                .map(this::getDurationMinutes)
                .filter(duration -> duration > 0)
                .toList();

        if (durationsInMinutes.isEmpty()) {
            return 0.0;
        }

        double averageMinutes = durationsInMinutes.stream()
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);

        return Math.round((averageMinutes / 60.0) * 100.0) / 100.0;
    }

    private int getDurationMinutes(Booking booking) {
        Integer startMinutes = parseMinutes(booking.getStartTime());
        Integer endMinutes = parseMinutes(booking.getEndTime());

        if (startMinutes == null || endMinutes == null) {
            return 0;
        }

        int duration = endMinutes - startMinutes;
        if (duration <= 0) {
            duration += 24 * 60;
        }

        return duration;
    }

    private int countUniqueBookers(List<Booking> bookings) {
        Set<String> uniqueBookers = bookings.stream()
                .map(Booking::getRequestedBy)
                .filter(userId -> userId != null && !userId.isBlank())
                .collect(Collectors.toSet());
        return uniqueBookers.size();
    }

    private List<BookingAnalyticsDto.DailyBookingsDto> getDailyTrend(List<Booking> bookings) {
        Map<LocalDate, Long> countByDate = bookings.stream()
                .map(booking -> parseDate(booking.getDate()))
                .filter(date -> date != null)
                .collect(Collectors.groupingBy(date -> date, Collectors.counting()));

        return countByDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey(Comparator.naturalOrder()))
                .map(entry -> BookingAnalyticsDto.DailyBookingsDto.builder()
                        .date(entry.getKey().toString())
                        .count(entry.getValue().intValue())
                        .build())
                .toList();
    }

    private Integer extractHour(String time) {
        if (time == null || time.isBlank()) {
            return null;
        }
        String[] timeParts = time.split(":");
        if (timeParts.length < 2) {
            return null;
        }
        try {
            return Integer.parseInt(timeParts[0]);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private Integer parseMinutes(String time) {
        if (time == null || time.isBlank()) {
            return null;
        }
        String[] timeParts = time.split(":");
        if (timeParts.length < 2) {
            return null;
        }

        try {
            int hours = Integer.parseInt(timeParts[0]);
            int minutes = Integer.parseInt(timeParts[1]);
            return (hours * 60) + minutes;
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private LocalDate parseDate(String date) {
        if (date == null || date.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(date);
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }
}
