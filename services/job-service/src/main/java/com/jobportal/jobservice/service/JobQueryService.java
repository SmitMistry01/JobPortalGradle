package com.jobportal.jobservice.service;

import com.jobportal.jobservice.model.Job;
import com.jobportal.jobservice.repository.JobRepository;
import java.util.List;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class JobQueryService {

    private final JobRepository jobRepository;

    public JobQueryService(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    @Cacheable(cacheNames = "jobsAll")
    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    @Cacheable(cacheNames = "jobsById", key = "#id")
    public Job getJob(Long id) {
        return jobRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Job not found"));
    }

    @Cacheable(cacheNames = "jobsSearch", key = "(#title == null ? '' : #title.toLowerCase()) + '::' + (#location == null ? '' : #location.toLowerCase())")
    public List<Job> search(String title, String location) {
        return jobRepository.findByTitleContainingIgnoreCaseAndLocationContainingIgnoreCase(
                title == null ? "" : title,
                location == null ? "" : location
        );
    }

    @Cacheable(
            cacheNames = "jobsPaged",
            key = "(#title == null ? '' : #title.toLowerCase()) + '::' + (#location == null ? '' : #location.toLowerCase()) + '::' + #pageable.pageNumber + '::' + #pageable.pageSize + '::' + #pageable.sort.toString()"
    )
    public Page<Job> searchPaged(String title, String location, Pageable pageable) {
        return jobRepository.findByTitleContainingIgnoreCaseAndLocationContainingIgnoreCase(
                title == null ? "" : title,
                location == null ? "" : location,
                pageable
        );
    }
}

