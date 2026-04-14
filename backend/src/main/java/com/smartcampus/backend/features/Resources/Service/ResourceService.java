package com.smartcampus.backend.features.Resources.Service;

import com.smartcampus.backend.features.Resources.Model.Resource;
import com.smartcampus.backend.features.Resources.Repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
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
        resource.setId(null);
        resource.setCreatedAt(Instant.now());
        resource.setUpdatedAt(Instant.now());
        return resourceRepository.save(resource);
    }

    public Resource updateResource(String id, Resource updatedResource) {
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
}