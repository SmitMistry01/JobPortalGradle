package com.jobportal.jobservice.controller;

import com.jobportal.jobservice.dto.CreateJobRequest;
import com.jobportal.jobservice.model.Job;
import com.jobportal.jobservice.service.JobCommandService;
import com.jobportal.jobservice.service.JobQueryService;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobCommandService jobCommandService;
    private final JobQueryService jobQueryService;

    public JobController(JobCommandService jobCommandService, JobQueryService jobQueryService) {
        this.jobCommandService = jobCommandService;
        this.jobQueryService = jobQueryService;
    }

    @PostMapping
    public ResponseEntity<Job> createJob(@RequestBody CreateJobRequest request,
                                         @RequestHeader("X-User-Role") String role,
                                         @RequestHeader("X-User-Id") Long userId) {
        if (!hasRole(role, "RECRUITER")) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(jobCommandService.createJob(request, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Job> updateJob(
            @PathVariable Long id,
            @RequestBody CreateJobRequest request,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Id") Long userId
    ) {
        if (!hasAnyRole(role, "RECRUITER", "ADMIN")) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(jobCommandService.updateJob(id, request, userId, hasRole(role, "ADMIN")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Id") Long userId
    ) {
        if (!hasAnyRole(role, "RECRUITER", "ADMIN")) {
            return ResponseEntity.status(403).build();
        }
        jobCommandService.deleteJob(id, userId, hasRole(role, "ADMIN"));
        return ResponseEntity.noContent().build();
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
        return ResponseEntity.ok(jobQueryService.getAllJobs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Job> getJob(@PathVariable Long id) {
        return ResponseEntity.ok(jobQueryService.getJob(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Job>> search(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String jobType,
            @RequestParam(required = false) String companyName,
            @RequestParam(required = false) BigDecimal minSalary,
            @RequestParam(required = false) BigDecimal maxSalary,
            @RequestParam(required = false) Integer minExperience,
            @RequestParam(required = false) Integer maxExperience
    ) {
        return ResponseEntity.ok(jobQueryService.search(
                title,
                location,
                jobType,
                companyName,
                minSalary,
                maxSalary,
                minExperience,
                maxExperience
        ));
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<Job>> searchPaged(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String jobType,
            @RequestParam(required = false) String companyName,
            @RequestParam(required = false) BigDecimal minSalary,
            @RequestParam(required = false) BigDecimal maxSalary,
            @RequestParam(required = false) Integer minExperience,
            @RequestParam(required = false) Integer maxExperience,
            Pageable pageable
    ) {
        return ResponseEntity.ok(jobQueryService.searchPaged(
                title,
                location,
                jobType,
                companyName,
                minSalary,
                maxSalary,
                minExperience,
                maxExperience,
                pageable
        ));
    }

    @GetMapping("/recruiter/{recruiterId}")
    public ResponseEntity<List<Job>> recruiterJobs(
            @PathVariable Long recruiterId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") String role
    ) {
        if (!hasAnyRole(role, "RECRUITER", "ADMIN")) {
            return ResponseEntity.status(403).build();
        }
        if (hasRole(role, "RECRUITER") && !userId.equals(recruiterId)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(jobQueryService.getJobsByRecruiter(recruiterId));
    }

    private boolean hasAnyRole(String actualRole, String... expectedRoles) {
        for (String expectedRole : expectedRoles) {
            if (hasRole(actualRole, expectedRole)) {
                return true;
            }
        }
        return false;
    }
}
