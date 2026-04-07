package com.jobportal.jobservice.service;

import com.jobportal.jobservice.model.Job;
import com.jobportal.jobservice.repository.JobRepository;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class JobQueryService {

    private final JobRepository jobRepository;

    public JobQueryService(JobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    @Cacheable(cacheNames = "jobsAll")
    public List<Job> getAllJobs() {
        return jobRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @Cacheable(cacheNames = "jobsById", key = "#id")
    public Job getJob(Long id) {
        return jobRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Job not found"));
    }

    @Cacheable(cacheNames = "jobsSearch", key = "(#title == null ? '' : #title.toLowerCase()) + '::' + (#location == null ? '' : #location.toLowerCase()) + '::' + (#jobType == null ? '' : #jobType.toLowerCase()) + '::' + (#companyName == null ? '' : #companyName.toLowerCase()) + '::' + (#minSalary == null ? '' : #minSalary.toString()) + '::' + (#maxSalary == null ? '' : #maxSalary.toString()) + '::' + (#minExperience == null ? '' : #minExperience.toString()) + '::' + (#maxExperience == null ? '' : #maxExperience.toString())")
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
        return jobRepository.findAll(buildSearchSpecification(
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

    @Cacheable(
            cacheNames = "jobsPaged",
            key = "(#title == null ? '' : #title.toLowerCase()) + '::' + (#location == null ? '' : #location.toLowerCase()) + '::' + (#jobType == null ? '' : #jobType.toLowerCase()) + '::' + (#companyName == null ? '' : #companyName.toLowerCase()) + '::' + (#minSalary == null ? '' : #minSalary.toString()) + '::' + (#maxSalary == null ? '' : #maxSalary.toString()) + '::' + (#minExperience == null ? '' : #minExperience.toString()) + '::' + (#maxExperience == null ? '' : #maxExperience.toString()) + '::' + #pageable.pageNumber + '::' + #pageable.pageSize + '::' + #pageable.sort.toString()"
    )
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
        return jobRepository.findAll(buildSearchSpecification(
                title,
                location,
                jobType,
                companyName,
                minSalary,
                maxSalary,
                minExperience,
                maxExperience
        ), pageable);
    }

    @Cacheable(cacheNames = "jobsSearch", key = "'recruiter::' + #recruiterId")
    public List<Job> getJobsByRecruiter(Long recruiterId) {
        return jobRepository.findByRecruiterIdOrderByCreatedAtDesc(recruiterId);
    }

    private Specification<Job> buildSearchSpecification(
            String title,
            String location,
            String jobType,
            String companyName,
            BigDecimal minSalary,
            BigDecimal maxSalary,
            Integer minExperience,
            Integer maxExperience
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (title != null && !title.isBlank()) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), "%" + title.trim().toLowerCase() + "%"));
            }
            if (location != null && !location.isBlank()) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("location")), "%" + location.trim().toLowerCase() + "%"));
            }
            if (jobType != null && !jobType.isBlank()) {
                predicates.add(criteriaBuilder.equal(criteriaBuilder.lower(root.get("jobType")), jobType.trim().toLowerCase()));
            }
            if (companyName != null && !companyName.isBlank()) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("companyName")), "%" + companyName.trim().toLowerCase() + "%"));
            }
            if (minSalary != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("salary"), minSalary));
            }
            if (maxSalary != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("salary"), maxSalary));
            }
            if (minExperience != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("experience"), minExperience));
            }
            if (maxExperience != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("experience"), maxExperience));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}

