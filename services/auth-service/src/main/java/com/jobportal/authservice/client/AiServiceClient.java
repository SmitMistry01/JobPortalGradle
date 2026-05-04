package com.jobportal.authservice.client;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class AiServiceClient {

    private final RestTemplate restTemplate;
    // Assuming API Gateway is on localhost:8080
    private static final String AI_SERVICE_URL = "http://localhost:8080/api/ai/extract-skills";

    public AiServiceClient(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder.build();
    }

    public List<String> extractSkills(String resumeUrl) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("resumeUrl", resumeUrl);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

            Map response = restTemplate.postForObject(AI_SERVICE_URL, request, Map.class);
            if (response != null && response.containsKey("skills")) {
                return (List<String>) response.get("skills");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return List.of();
    }
}
