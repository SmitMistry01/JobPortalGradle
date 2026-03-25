package com.jobportal.applicationservice.controller;

import com.jobportal.applicationservice.dto.ApplyJobRequest;
import com.jobportal.applicationservice.model.ApplicationStatus;
import com.jobportal.applicationservice.model.JobApplication;
import com.jobportal.applicationservice.service.ApplicationDomainService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationDomainService service;

    public ApplicationController(ApplicationDomainService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<JobApplication> apply(@RequestBody ApplyJobRequest request,
                                                @RequestHeader("X-User-Id") Long userId,
                                                @RequestHeader("X-User-Email") String userEmail,
                                                @RequestHeader("X-User-Role") String role) {
        if (!hasRole(role, "JOB_SEEKER")) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(service.apply(request, userId, userEmail));
    }

    @GetMapping("/user")
    public ResponseEntity<List<JobApplication>> userApplications(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.userApplications(userId));
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<JobApplication>> jobApplications(@PathVariable Long jobId,
                                                                @RequestHeader("X-User-Role") String role) {
        if (!hasAnyRole(role, "RECRUITER", "ADMIN")) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(service.jobApplications(jobId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<JobApplication> updateStatus(@PathVariable Long id,
                                                       @RequestParam ApplicationStatus status,
                                                       @RequestHeader("X-User-Role") String role) {
        if (!hasRole(role, "RECRUITER")) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    private boolean hasAnyRole(String actualRole, String... expectedRoles) {
        for (String expectedRole : expectedRoles) {
            if (hasRole(actualRole, expectedRole)) {
                return true;
            }
        }
        return false;
    }

    private boolean hasRole(String actualRole, String expectedRole) {
        if (actualRole == null || actualRole.isBlank()) {
            return false;
        }
        String normalized = actualRole.trim();
        if (normalized.regionMatches(true, 0, "ROLE_", 0, 5)) {
            normalized = normalized.substring(5);
        }
        return expectedRole.equalsIgnoreCase(normalized);
    }
}
