package com.jobportal.aiservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
        this.objectMapper = new ObjectMapper();
    }

    public String generateContent(String prompt) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", List.of(
                    Map.of("parts", List.of(Map.of("text", prompt)))
            ));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            String fullUrl = apiUrl + "?key=" + apiKey;

            ResponseEntity<String> response = restTemplate.postForEntity(fullUrl, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode rootNode = objectMapper.readTree(response.getBody());
                JsonNode candidates = rootNode.path("candidates");
                if (candidates.isArray() && candidates.size() > 0) {
                    return candidates.get(0)
                            .path("content").path("parts").get(0)
                            .path("text").asText();
                }

                String errorMessage = rootNode.path("error").path("message").asText();
                if (errorMessage == null || errorMessage.isBlank()) {
                    errorMessage = "Unexpected Gemini API response format";
                }
                log.warn("Gemini API response missing candidates: {}", errorMessage);
                return "Gemini API error: " + errorMessage;
            }
            log.warn("Gemini API returned non-2xx: {}", response.getStatusCode());
            return "Error from Gemini API";
        } catch (Exception e) {
            log.warn("Exception calling Gemini API", e);
            return "Exception calling Gemini API: " + e.getMessage();
        }
    }
}
