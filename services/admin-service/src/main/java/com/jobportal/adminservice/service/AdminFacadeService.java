package com.jobportal.adminservice.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AdminFacadeService {

    private final RestTemplate restTemplate;

    public AdminFacadeService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Cacheable(cacheNames = "adminUsers")
    public List<Map<String, Object>> users() {
        return restTemplate.exchange(
                "http://AUTH-SERVICE/api/auth/internal/users",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {
                }
        ).getBody();
    }

    @Cacheable(cacheNames = "adminJobs")
    public List<Map<String, Object>> jobs() {
        return restTemplate.exchange(
                "http://JOB-SERVICE/api/jobs",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {
                }
        ).getBody();
    }

    @Cacheable(cacheNames = "adminReports")
    public Map<String, Object> reports() {
        List<Map<String, Object>> users = restTemplate.users();
        List<Map<String, Object>> jobs = restTemplate.jobs();

        Map<String, Object> report = new HashMap<>();
        report.put("totalUsers", users == null ? 0 : users.size());
        report.put("totalJobs", jobs == null ? 0 : jobs.size());
        return report;
    }
}
