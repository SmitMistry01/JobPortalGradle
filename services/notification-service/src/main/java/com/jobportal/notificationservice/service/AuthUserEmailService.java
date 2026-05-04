package com.jobportal.notificationservice.service;

import java.util.List;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;


//Producer(send msg)
@Service
public class AuthUserEmailService {

    private final RestTemplate restTemplate;

    public AuthUserEmailService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Cacheable(cacheNames = "notificationUserEmails")
    public List<String> getAllUserEmails() {

        //class used to make HTTP requests to external APIs or microservices
        return restTemplate.exchange(
                "http://AUTH-SERVICE/api/auth/internal/users/emails",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<String>>() {
                }
        ).getBody();
    }
}

