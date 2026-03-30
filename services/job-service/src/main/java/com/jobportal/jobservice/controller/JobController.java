package com.jobportal.jobservice.controller;

import com.jobportal.jobservice.dto.CreateJobRequest;
import com.jobportal.jobservice.model.Job;
import com.jobportal.jobservice.service.JobService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @PostMapping
    public ResponseEntity<Job> createJob(@RequestBody CreateJobRequest request,
                                         @RequestHeader("X-User-Role") String role,
                                         @RequestHeader("X-User-Id") Long userId) {
        if (!hasRole(role, "RECRUITER")) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(jobService.createJob(request, userId));
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

    @GetMapping
    public ResponseEntity<List<Job>> allJobs() {
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Job> getJob(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getJob(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Job>> search(@RequestParam(required = false) String title,
                                            @RequestParam(required = false) String location) {
        return ResponseEntity.ok(jobService.search(title, location));
    }
}
