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
           @Value("${spring.data.mongodb.uri:mongodb+srv://it23540880_db_user:it23540880@core.xzay0y2.mongodb.net/?appName=core}") String mongoUri
    ) {
        return MongoClients.create(mongoUri);
    }
}
