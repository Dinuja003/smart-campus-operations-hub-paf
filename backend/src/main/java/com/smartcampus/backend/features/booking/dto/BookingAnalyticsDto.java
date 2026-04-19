package com.smartcampus.backend.features.booking.dto;

import com.smartcampus.backend.features.booking.model.BookingStatus;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class BookingAnalyticsDto {

    private int totalBookings;
    private Map<BookingStatus, Integer> bookingsByStatus;
    private List<HourlyBookingsDto> hourlyDistribution;
    private List<ResourceBookingsDto> topResources;
    private double averageBookingDurationHours;
    private int uniqueBookers;
    private List<DailyBookingsDto> dailyTrend;

    @Data
    @Builder
    public static class HourlyBookingsDto {
        private int hour;
        private int count;
    }

    @Data
    @Builder
    public static class ResourceBookingsDto {
        private String resourceId;
        private String resourceName;
        private int bookingCount;
    }

    @Data
    @Builder
    public static class DailyBookingsDto {
        private String date;
        private int count;
    }
}
