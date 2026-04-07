package com.jobportal.adminservice.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AdminFacadeService {

    private final RestTemplate restTemplate;
    private final AdminFacadeService self;

    public AdminFacadeService(RestTemplate restTemplate, @Lazy AdminFacadeService self) {
        this.restTemplate = restTemplate;
        this.self = self;
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
        List<Map<String, Object>> users = self.users();
        List<Map<String, Object>> jobs = self.jobs();

        Map<String, Object> report = new HashMap<>();
        report.put("totalUsers", users == null ? 0 : users.size());
        report.put("totalJobs", jobs == null ? 0 : jobs.size());
        return report;
    }

    public List<Map<String, Object>> hiringConflicts() {
        List<Map<String, Object>> jobs = self.jobs();
        List<Map<String, Object>> conflicts = new ArrayList<>();

        for (Map<String, Object> job : jobs) {
            long jobId = toLong(job.get("id"));
            int openings = toOpenings(job.get("openings"));

            List<Map<String, Object>> applications = applicationsByJob(jobId);
            List<Map<String, Object>> selected = applications.stream()
                    .filter(this::isSelectedLike)
                    .sorted(this::compareCandidates)
                    .toList();

            if (selected.size() > openings) {
                Map<String, Object> conflict = new HashMap<>();
                conflict.put("jobId", jobId);
                conflict.put("title", asString(job.get("title")));
                conflict.put("companyName", asString(job.get("companyName")));
                conflict.put("openings", openings);
                conflict.put("selectedCount", selected.size());
                conflict.put("overflowBy", selected.size() - openings);
                conflict.put("candidates", selected);
                conflicts.add(conflict);
            }
        }

        conflicts.sort(Comparator
                .comparingInt((Map<String, Object> item) -> toInt(item.get("overflowBy"))).reversed()
                .thenComparingInt((Map<String, Object> item) -> toInt(item.get("selectedCount"))).reversed()
                .thenComparingLong((Map<String, Object> item) -> toLong(item.get("jobId"))));

        return conflicts;
    }

    public Map<String, Object> finalizeHiring(Long jobId, List<Long> hiredApplicationIds, boolean enforceExactOpenings) {
        if (jobId == null || jobId <= 0) {
            throw new IllegalArgumentException("A valid jobId is required for finalization");
        }

        List<Map<String, Object>> applications = applicationsByJob(jobId);
        Map<String, Object> job = restTemplate.getForObject("http://JOB-SERVICE/api/jobs/" + jobId, Map.class);

        if (job == null || applications == null) {
            throw new IllegalArgumentException("Unable to load job/applications for finalization");
        }

        int openings = toOpenings(job.get("openings"));
        if (hiredApplicationIds == null || hiredApplicationIds.isEmpty()) {
            throw new IllegalArgumentException("At least one candidate must be selected by admin");
        }
        boolean hasInvalidId = hiredApplicationIds.stream().anyMatch(id -> id == null || id <= 0);
        if (hasInvalidId) {
            throw new IllegalArgumentException("All application IDs must be positive numbers");
        }
        Set<Long> desired = new HashSet<>(hiredApplicationIds);
        if (desired.size() != hiredApplicationIds.size()) {
            throw new IllegalArgumentException("Duplicate application IDs are not allowed in finalization");
        }
        if (hiredApplicationIds.size() > openings) {
            throw new IllegalArgumentException("Finalized candidates exceed available openings");
        }
        if (enforceExactOpenings && hiredApplicationIds.size() != openings) {
            throw new IllegalArgumentException("Finalized candidates must exactly match available openings");
        }

        Set<Long> available = new HashSet<>();

        for (Map<String, Object> application : applications) {
            long applicationId = toLong(application.get("id"));
            if (isSelectedLike(application)) {
                available.add(applicationId);
            }
        }

        if (!available.containsAll(desired)) {
            throw new IllegalArgumentException("Some selected application IDs are not eligible for finalization");
        }

        for (Map<String, Object> application : applications) {
            long applicationId = toLong(application.get("id"));
            String status = asString(application.get("status"));

            if (desired.contains(applicationId)) {
                if (!"HIRED".equalsIgnoreCase(status)) {
                    updateInternalStatus(applicationId, "HIRED");
                }
            } else if ("SELECTED".equalsIgnoreCase(status) || "HIRED".equalsIgnoreCase(status)) {
                updateInternalStatus(applicationId, "SHORTLISTED");
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("jobId", jobId);
        result.put("openings", openings);
        result.put("finalizedCount", desired.size());
        result.put("remainingOpenings", Math.max(0, openings - desired.size()));
        result.put("exactOpeningsEnforced", enforceExactOpenings);
        result.put("message", "Hiring finalized by admin successfully");
        return result;
    }

    private List<Map<String, Object>> applicationsByJob(Long jobId) {
        return restTemplate.exchange(
                "http://APPLICATION-SERVICE/api/applications/internal/job/" + jobId,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {
                }
        ).getBody();
    }

    private void updateInternalStatus(Long applicationId, String status) {
        restTemplate.exchange(
                "http://APPLICATION-SERVICE/api/applications/internal/" + applicationId + "/status?status=" + status,
                HttpMethod.PUT,
                null,
                Map.class
        );
    }

    private boolean isSelectedLike(Map<String, Object> application) {
        String status = asString(application.get("status"));
        return "SELECTED".equalsIgnoreCase(status) || "HIRED".equalsIgnoreCase(status);
    }

    private int compareCandidates(Map<String, Object> first, Map<String, Object> second) {
        int statusCompare = Integer.compare(statusRank(asString(first.get("status"))), statusRank(asString(second.get("status"))));
        if (statusCompare != 0) {
            return statusCompare;
        }

        int timestampCompare = Long.compare(candidateTimestamp(second), candidateTimestamp(first));
        if (timestampCompare != 0) {
            return timestampCompare;
        }

        return Long.compare(toLong(first.get("id")), toLong(second.get("id")));
    }

    private int statusRank(String status) {
        if ("HIRED".equalsIgnoreCase(status)) {
            return 0;
        }
        if ("SELECTED".equalsIgnoreCase(status)) {
            return 1;
        }
        return 2;
    }

    private long candidateTimestamp(Map<String, Object> candidate) {
        return parseTimestamp(candidate.get("appliedAt"), candidate.get("createdAt"), candidate.get("updatedAt"));
    }

    private long parseTimestamp(Object... values) {
        for (Object value : values) {
            if (value == null) {
                continue;
            }
            try {
                return java.time.Instant.parse(String.valueOf(value)).toEpochMilli();
            } catch (Exception ignored) {
                // Ignore malformed date value and continue to fallback fields.
            }
        }
        return 0L;
    }

    private String asString(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }

    private int toOpenings(Object value) {
        if (value instanceof Number number) {
            return Math.max(1, number.intValue());
        }
        if (value == null) {
            return 1;
        }
        return Math.max(1, Integer.parseInt(String.valueOf(value)));
    }

    private int toInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value == null) {
            return 0;
        }
        return Integer.parseInt(String.valueOf(value));
    }
}
