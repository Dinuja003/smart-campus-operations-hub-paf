package com.smartcampus.backend.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DBConfig {

    @Bean
    public MongoClient mongoClient(
            @Value("${spring.data.mongodb.uri:mongodb://localhost:27017/smartcampus}") String mongoUri
    ) {
        return MongoClients.create(mongoUri);
    }
}
