package com.jobportal.applicationservice.client;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class JobServiceClient {

    private final RestTemplate restTemplate;
    // Assuming API Gateway is on localhost:8080
    private static final String JOB_SERVICE_URL = "http://localhost:8080/api/jobs/";

    public JobServiceClient(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder.build();
    }

    public String getJobDescription(Long jobId) {
        try {
            Map response = restTemplate.getForObject(JOB_SERVICE_URL + jobId, Map.class);
            if (response != null && response.containsKey("description")) {
                return (String) response.get("description");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "";
    }
}
