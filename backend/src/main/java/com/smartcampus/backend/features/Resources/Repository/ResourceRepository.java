package com.smartcampus.backend.features.Resources.Repository;

import com.smartcampus.backend.features.Resources.Model.Resource;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResourceRepository extends MongoRepository<Resource, String> {
}