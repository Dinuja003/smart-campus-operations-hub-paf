package com.smartcampus.backend.config;

import org.bson.Document;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.Arrays;
import java.util.List;

@Configuration
public class NotificationCollectionSchemaConfig {

    // Notification Flow: enforce Mongo schema so pushed notifications stay structurally valid.
    @Bean
    public CommandLineRunner notificationCollectionValidator(MongoTemplate mongoTemplate) {
        return args -> {
            if (!mongoTemplate.collectionExists("notifications")) {
                mongoTemplate.createCollection("notifications");
            }

            Document validator = new Document("$jsonSchema", new Document()
                    .append("bsonType", "object")
                    .append("required", Arrays.asList("userId", "type", "title", "message", "isRead", "createdAt"))
                    .append("properties", new Document()
                            .append("userId", new Document("bsonType", Arrays.asList("string", "objectId")))
                            .append("type", new Document("bsonType", "string").append("enum", List.of(
                                    "BOOKING_SUBMITTED",
                                    "BOOKING_APPROVED",
                                    "BOOKING_REJECTED",
                                    "TICKET_SUBMITTED",
                                    "TICKET_ASSIGNED",
                                    "TICKET_MESSAGE"
                            )))
                            .append("title", new Document("bsonType", "string"))
                            .append("message", new Document("bsonType", "string"))
                            .append("link", new Document("bsonType", "string"))
                            .append("isRead", new Document("bsonType", "bool"))
                            .append("createdAt", new Document("bsonType", "date"))
                    ));

            mongoTemplate.executeCommand(new Document("collMod", "notifications")
                    .append("validator", validator)
                    .append("validationLevel", "moderate")
                    .append("validationAction", "error"));
        };
    }
}
