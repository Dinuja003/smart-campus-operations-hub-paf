package com.smartcampus.backend.features.Resources.DTO;

import com.smartcampus.backend.features.Resources.Model.AvailabilityWindow;
import com.smartcampus.backend.features.Resources.Model.Location;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class ResourceRequestDto {

    @NotBlank(message = "Resource name is required")
    private String name;

    @NotBlank(message = "Resource type is required")
    private String type;

    @Min(value = 0, message = "Equipment count cannot be negative")
    private int eqCount;

    @Min(value = 1, message = "Capacity must be greater than 0")
    private int capacity;

    @Valid
    @NotNull(message = "Location is required")
    private Location location;

    @Valid
    @NotEmpty(message = "Availability window is required")
    private List<AvailabilityWindow> availabilityWindows;

    @NotBlank(message = "Status is required")
    private String status;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Resource image is required")
    private String imageUrl;

    @NotBlank(message = "Created by is required")
    private String createdBy;

    public ResourceRequestDto() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getEqCount() {
        return eqCount;
    }

    public void setEqCount(int eqCount) {
        this.eqCount = eqCount;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public Location getLocation() {
        return location;
    }

    public void setLocation(Location location) {
        this.location = location;
    }

    public List<AvailabilityWindow> getAvailabilityWindows() {
        return availabilityWindows;
    }

    public void setAvailabilityWindows(List<AvailabilityWindow> availabilityWindows) {
        this.availabilityWindows = availabilityWindows;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
}
