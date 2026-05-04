package com.jobportal.applicationservice.client;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
public class AiServiceClient {

    private final RestTemplate restTemplate;
    private static final String AI_SERVICE_URL = "http://localhost:8080/api/ai/ats-score";

    public AiServiceClient(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder.build();
    }

    public Map<String, Object> calculateAtsScore(String resumeUrl, String jobDescription) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("resumeUrl", resumeUrl);
            requestBody.put("jobDescription", jobDescription);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

            return restTemplate.postForObject(AI_SERVICE_URL, request, Map.class);
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("score", 0, "feedback", "Failed to calculate ATS score");
        }
    }
}
