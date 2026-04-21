package com.smartcampus.backend.features.Resources.Service;

import com.smartcampus.backend.features.Resources.DTO.ResourceRequestDto;
import com.smartcampus.backend.features.Resources.DTO.ResourceResponseDto;
import com.smartcampus.backend.features.Resources.Model.AvailabilityWindow;
import com.smartcampus.backend.features.Resources.Model.Resource;
import com.smartcampus.backend.features.Resources.Repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    public List<ResourceResponseDto> getAllResources() {
        return resourceRepository.findAll()
                .stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    public Optional<ResourceResponseDto> getResourceById(String id) {
        return resourceRepository.findById(id).map(this::toResponseDto);
    }

    public ResourceResponseDto createResource(ResourceRequestDto dto) {
        Resource resource = toResource(dto);
        validateResource(resource);
        resource.setId(null);
        resource.setCreatedAt(Instant.now());
        resource.setUpdatedAt(Instant.now());
        return toResponseDto(resourceRepository.save(resource));
    }

    public ResourceResponseDto updateResource(String id, ResourceRequestDto dto) {
        Resource updatedResource = toResource(dto);
        validateResource(updatedResource);
        return resourceRepository.findById(id).map(existingResource -> {
            existingResource.setName(updatedResource.getName());
            existingResource.setType(updatedResource.getType());
            existingResource.setEqCount(updatedResource.getEqCount());
            existingResource.setCapacity(updatedResource.getCapacity());
            existingResource.setLocation(updatedResource.getLocation());
            existingResource.setAvailabilityWindows(updatedResource.getAvailabilityWindows());
            existingResource.setStatus(updatedResource.getStatus());
            existingResource.setDescription(updatedResource.getDescription());
            existingResource.setImageUrl(updatedResource.getImageUrl());
            existingResource.setCreatedBy(updatedResource.getCreatedBy());
            existingResource.setUpdatedAt(Instant.now());
            return toResponseDto(resourceRepository.save(existingResource));
        }).orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));
    }

    public void deleteResource(String id) {
        if (!resourceRepository.existsById(id)) {
            throw new RuntimeException("Resource not found with id: " + id);
        }
        resourceRepository.deleteById(id);
    }

    private void validateResource(Resource resource) {
        boolean isEquipment = "EQUIPMENT".equalsIgnoreCase(resource.getType());

        if (!isEquipment && resource.getCapacity() <= 0) {
            throw new IllegalArgumentException("Capacity must be greater than 0");
        }

        if (isEquipment && resource.getEqCount() <= 0) {
            throw new IllegalArgumentException("Equipment count must be greater than 0");
        }

        if (resource.getAvailabilityWindows() == null || resource.getAvailabilityWindows().isEmpty()) {
            throw new IllegalArgumentException("Availability window is required");
        }

        for (AvailabilityWindow window : resource.getAvailabilityWindows()) {
            validateAvailabilityWindow(window);
        }

        validateAvailabilityWindowOverlaps(resource.getAvailabilityWindows());
    }

    private void validateAvailabilityWindow(AvailabilityWindow window) {
        try {
            LocalTime startTime = LocalTime.parse(window.getStartTime());
            LocalTime endTime = LocalTime.parse(window.getEndTime());

            if (!endTime.isAfter(startTime)) {
                throw new IllegalArgumentException("End time must be later than start time");
            }
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Start time and end time must use HH:mm format");
        } catch (IllegalArgumentException e) {
            throw e;
        }
    }

    private void validateAvailabilityWindowOverlaps(List<AvailabilityWindow> windows) {
        for (DayOfWeek day : DayOfWeek.values()) {
            List<AvailabilityWindow> dayWindows = windows.stream()
                    .filter(window -> day.name().equalsIgnoreCase(window.getDay()))
                    .sorted(Comparator.comparing(window -> LocalTime.parse(window.getStartTime())))
                    .toList();

            for (int i = 1; i < dayWindows.size(); i++) {
                LocalTime previousEnd = LocalTime.parse(dayWindows.get(i - 1).getEndTime());
                LocalTime currentStart = LocalTime.parse(dayWindows.get(i).getStartTime());
                if (!currentStart.isAfter(previousEnd)) {
                    throw new IllegalArgumentException("Availability windows cannot overlap on the same day");
                }
            }
        }
    }

    private Resource toResource(ResourceRequestDto dto) {
        Resource resource = new Resource();
        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setEqCount(dto.getEqCount());
        resource.setCapacity(dto.getCapacity());
        resource.setLocation(dto.getLocation());
        resource.setAvailabilityWindows(normalizeAvailabilityWindows(dto.getAvailabilityWindows()));
        resource.setStatus(dto.getStatus());
        resource.setDescription(dto.getDescription());
        resource.setImageUrl(dto.getImageUrl());
        resource.setCreatedBy(dto.getCreatedBy());
        return resource;
    }

    private List<AvailabilityWindow> normalizeAvailabilityWindows(List<AvailabilityWindow> windows) {
        if (windows == null) {
            return List.of();
        }

        List<AvailabilityWindow> normalized = new ArrayList<>();
        for (AvailabilityWindow window : windows) {
            AvailabilityWindow cleanWindow = new AvailabilityWindow();
            cleanWindow.setDay(window.getDay() == null ? null : window.getDay().trim().toUpperCase());
            cleanWindow.setStartTime(window.getStartTime() == null ? null : window.getStartTime().trim());
            cleanWindow.setEndTime(window.getEndTime() == null ? null : window.getEndTime().trim());
            normalized.add(cleanWindow);
        }
        return normalized;
    }

    private ResourceResponseDto toResponseDto(Resource resource) {
        ResourceResponseDto dto = new ResourceResponseDto();
        dto.setId(resource.getId());
        dto.setName(resource.getName());
        dto.setType(resource.getType());
        dto.setEqCount(resource.getEqCount());
        dto.setCapacity(resource.getCapacity());
        dto.setLocation(resource.getLocation());
        dto.setAvailabilityWindows(resource.getAvailabilityWindows());
        dto.setStatus(resource.getStatus());
        dto.setDescription(resource.getDescription());
        dto.setImageUrl(resource.getImageUrl());
        dto.setCreatedBy(resource.getCreatedBy());
        dto.setCreatedAt(resource.getCreatedAt());
        dto.setUpdatedAt(resource.getUpdatedAt());
        return dto;
    }
}
