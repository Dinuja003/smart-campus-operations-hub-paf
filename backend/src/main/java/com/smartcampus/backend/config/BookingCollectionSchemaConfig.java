package com.smartcampus.backend.config;

import org.bson.Document;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.Arrays;
import java.util.List;

@Configuration
public class BookingCollectionSchemaConfig {

    @Bean
    public CommandLineRunner bookingCollectionValidator(MongoTemplate mongoTemplate) {
        return args -> {
            if (!mongoTemplate.collectionExists("bookings")) {
                mongoTemplate.createCollection("bookings");
            }

            Document validator = new Document("$jsonSchema", new Document()
                    .append("bsonType", "object")
                    .append("required", Arrays.asList(
                            "resourceId",
                            "requestedBy",
                            "bookingReason",
                            "date",
                            "startTime",
                            "endTime",
                            "purpose",
                            "expectedAttendees",
                            "status"
                    ))
                    .append("properties", new Document()
                            // Existing data model uses String IDs in booking docs.
                            // Allow both string and objectId to be backward-compatible.
                            .append("resourceId", new Document("bsonType", Arrays.asList("string", "objectId")))
                            .append("requestedBy", new Document("bsonType", Arrays.asList("string", "objectId")))
                            .append("bookingReason", new Document("bsonType", "string").append("maxLength", 120))
                            .append("resourceType", new Document("bsonType", "string"))
                            .append("date", new Document("bsonType", "string"))
                            .append("startTime", new Document("bsonType", "string"))
                            .append("endTime", new Document("bsonType", "string"))
                            .append("startTimeMinutes", new Document("bsonType", "int").append("minimum", 0).append("maximum", 1440))
                            .append("endTimeMinutes", new Document("bsonType", "int").append("minimum", 0).append("maximum", 1440))
                            .append("purpose", new Document("bsonType", "string").append("minLength", 10).append("maxLength", 500))
                            .append("expectedAttendees", new Document("bsonType", "int").append("minimum", 1).append("maximum", 1000))
                            .append("status", new Document("bsonType", "string").append("enum", List.of(
                                    "PENDING", "APPROVED", "REJECTED", "CANCELLED"
                            )))
                            .append("adminNote", new Document("bsonType", "string"))
                            .append("reviewedBy", new Document("bsonType", Arrays.asList("string", "objectId")))
                    ));

            mongoTemplate.executeCommand(new Document("collMod", "bookings")
                    .append("validator", validator)
                    .append("validationLevel", "moderate")
                    .append("validationAction", "error"));
        };
    }
}
