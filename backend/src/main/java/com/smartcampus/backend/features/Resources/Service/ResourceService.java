package com.smartcampus.backend.features.Resources.Service;

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

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    public Optional<Resource> getResourceById(String id) {
        return resourceRepository.findById(id);
    }

    public Resource createResource(Resource resource) {
        validateResource(resource);
        resource.setId(null);
        resource.setCreatedAt(Instant.now());
        resource.setUpdatedAt(Instant.now());
        return resourceRepository.save(resource);
    }

    public Resource updateResource(String id, Resource updatedResource) {
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
            return resourceRepository.save(existingResource);
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
}
