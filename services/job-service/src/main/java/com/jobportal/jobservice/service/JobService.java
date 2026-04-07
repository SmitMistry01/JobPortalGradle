package com.jobportal.jobservice.service;

import com.jobportal.jobservice.dto.CreateJobRequest;
import com.jobportal.jobservice.model.Job;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class JobService {

    private final JobCommandService jobCommandService;
    private final JobQueryService jobQueryService;

    public JobService(JobCommandService jobCommandService, JobQueryService jobQueryService) {
        this.jobCommandService = jobCommandService;
        this.jobQueryService = jobQueryService;
    }

    public Job createJob(CreateJobRequest request, Long recruiterId) {
        return jobCommandService.createJob(request, recruiterId);
    }

    public List<Job> getAllJobs() {
        return jobQueryService.getAllJobs();
    }

    public Job getJob(Long id) {
        return jobQueryService.getJob(id);
    }

    public List<Job> search(
            String title,
            String location,
            String jobType,
            String companyName,
            BigDecimal minSalary,
            BigDecimal maxSalary,
            Integer minExperience,
            Integer maxExperience
    ) {
        return jobQueryService.search(title, location, jobType, companyName, minSalary, maxSalary, minExperience, maxExperience);
    }

    public Page<Job> searchPaged(
            String title,
            String location,
            String jobType,
            String companyName,
            BigDecimal minSalary,
            BigDecimal maxSalary,
            Integer minExperience,
            Integer maxExperience,
            Pageable pageable
    ) {
        return jobQueryService.searchPaged(title, location, jobType, companyName, minSalary, maxSalary, minExperience, maxExperience, pageable);
    }

    public List<Job> getJobsByRecruiter(Long recruiterId) {
        return jobQueryService.getJobsByRecruiter(recruiterId);
    }
}
