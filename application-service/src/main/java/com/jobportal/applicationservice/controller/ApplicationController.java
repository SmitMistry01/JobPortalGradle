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
        if (!"JOB_SEEKER".equalsIgnoreCase(role)) {
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
        if (!"RECRUITER".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(service.jobApplications(jobId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<JobApplication> updateStatus(@PathVariable Long id,
                                                       @RequestParam ApplicationStatus status,
                                                       @RequestHeader("X-User-Role") String role) {
        if (!"RECRUITER".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(service.updateStatus(id, status));
    }
}
