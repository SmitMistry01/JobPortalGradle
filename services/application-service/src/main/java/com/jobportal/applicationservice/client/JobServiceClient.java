package com.jobportal.applicationservice.client;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class JobServiceClient {

    private final RestTemplate restTemplate;

    @org.springframework.beans.factory.annotation.Value("${job.service.url:http://job-service:8082/api/jobs/}")
    private String jobServiceUrl;

    public JobServiceClient(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder.build();
    }

    public String getJobDescription(Long jobId) {
        try {
            Map response = restTemplate.getForObject(jobServiceUrl + jobId, Map.class);
            if (response != null && response.containsKey("description")) {
                return (String) response.get("description");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "";
    }
}
