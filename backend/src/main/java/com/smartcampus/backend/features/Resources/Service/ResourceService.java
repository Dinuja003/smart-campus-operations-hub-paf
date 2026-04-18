package com.smartcampus.backend.features.Resources.Service;

import com.smartcampus.backend.features.Resources.DTO.ResourceRequestDto;
import com.smartcampus.backend.features.Resources.DTO.ResourceResponseDto;
import com.smartcampus.backend.features.Resources.Model.AvailabilityWindow;
import com.smartcampus.backend.features.Resources.Model.Resource;
import com.smartcampus.backend.features.Resources.Repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
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

        if (resource.getCapacity() <= 0) {
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
    }

    private void validateAvailabilityWindow(AvailabilityWindow window) {
        try {
            LocalTime startTime = LocalTime.parse(window.getStartTime());
            LocalTime endTime = LocalTime.parse(window.getEndTime());

            if (!endTime.isAfter(startTime)) {
                throw new IllegalArgumentException("End time must be later than start time");
            }

            DayOfWeek selectedDay = DayOfWeek.valueOf(window.getDay().toUpperCase());
            DayOfWeek today = LocalDate.now(ZoneId.systemDefault()).getDayOfWeek();

            if (selectedDay == today && startTime.isBefore(LocalTime.now(ZoneId.systemDefault()))) {
                throw new IllegalArgumentException("Start time must be the current time or a future time");
            }
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Start time and end time must use HH:mm format");
        } catch (IllegalArgumentException e) {
            throw e;
        }
    }

    private Resource toResource(ResourceRequestDto dto) {
        Resource resource = new Resource();
        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setEqCount(dto.getEqCount());
        resource.setCapacity(dto.getCapacity());
        resource.setLocation(dto.getLocation());
        resource.setAvailabilityWindows(dto.getAvailabilityWindows());
        resource.setStatus(dto.getStatus());
        resource.setDescription(dto.getDescription());
        resource.setImageUrl(dto.getImageUrl());
        resource.setCreatedBy(dto.getCreatedBy());
        return resource;
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
