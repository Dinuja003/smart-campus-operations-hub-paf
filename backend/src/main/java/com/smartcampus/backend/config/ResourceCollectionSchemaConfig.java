package com.smartcampus.backend.config;

import org.bson.Document;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.Arrays;
import java.util.List;

@Configuration
public class ResourceCollectionSchemaConfig {

    @Bean
    public CommandLineRunner resourceCollectionValidator(MongoTemplate mongoTemplate) {
        return args -> {
            if (!mongoTemplate.collectionExists("resources")) {
                mongoTemplate.createCollection("resources");
            }

            Document validator = new Document("$jsonSchema", new Document()
                    .append("bsonType", "object")
                    .append("required", List.of("name", "type", "status", "capacity"))
                    .append("properties", new Document()
                            .append("name", new Document("bsonType", "string"))
                            .append("type", new Document()
                                    .append("bsonType", "string")
                                    .append("enum", Arrays.asList(
                                            "LAB",
                                            "LECTURE_HALL",
                                            "MEETING_ROOM",
                                            "EQUIPMENT",
                                            "AUDITORIUM"
                                    )))
                            .append("eqCount", new Document("bsonType", "int").append("minimum", 0))
                            .append("capacity", new Document("bsonType", "int").append("minimum", 1))
                            .append("location", new Document()
                                    .append("bsonType", "object")
                                    .append("properties", new Document()
                                            .append("building", new Document("bsonType", "string"))
                                            .append("floor", new Document("bsonType", "string"))
                                            .append("room", new Document("bsonType", "string"))))
                            .append("availabilityWindows", new Document()
                                    .append("bsonType", "array")
                                    .append("items", new Document()
                                            .append("bsonType", "object")
                                            .append("properties", new Document()
                                                    .append("day", new Document("bsonType", "string"))
                                                    .append("startTime", new Document("bsonType", "string"))
                                                    .append("endTime", new Document("bsonType", "string")))))
                            .append("status", new Document()
                                    .append("bsonType", "string")
                                    .append("enum", Arrays.asList(
                                            "AVAILABLE",
                                            "UNAVAILABLE",
                                            "BOOKED",
                                            "MAINTENANCE"
                                    )))
                            .append("description", new Document("bsonType", "string"))
                            .append("imageUrl", new Document("bsonType", "string"))
                            .append("createdBy", new Document("bsonType", "string"))));

            mongoTemplate.executeCommand(new Document("collMod", "resources")
                    .append("validator", validator)
                    .append("validationLevel", "moderate")
                    .append("validationAction", "error"));
        };
    }
}
