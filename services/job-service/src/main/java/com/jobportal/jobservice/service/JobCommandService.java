package com.jobportal.jobservice.service;

import com.jobportal.jobservice.dto.CreateJobRequest;
import com.jobportal.jobservice.event.JobPostedEvent;
import com.jobportal.jobservice.model.Job;
import com.jobportal.jobservice.repository.JobRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

@Service
public class JobCommandService {

    private final JobRepository jobRepository;
    private final RabbitTemplate rabbitTemplate;

    public JobCommandService(JobRepository jobRepository, RabbitTemplate rabbitTemplate) {
        this.jobRepository = jobRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = "jobsAll", allEntries = true),
            @CacheEvict(cacheNames = "jobsById", allEntries = true),
            @CacheEvict(cacheNames = "jobsSearch", allEntries = true),
            @CacheEvict(cacheNames = "jobsPaged", allEntries = true)
    })
    public Job createJob(CreateJobRequest request, Long recruiterId) {
        Job job = new Job();
        job.setTitle(request.getTitle());
        job.setCompanyName(request.getCompanyName());
        job.setJobType(request.getJobType());
        job.setLocation(request.getLocation());
        job.setSalary(request.getSalary());
        job.setExperience(request.getExperience());
        job.setDescription(request.getDescription());
        job.setOpenings(request.getOpenings() == null || request.getOpenings() < 1 ? 1 : request.getOpenings());
        job.setPostedBy(recruiterId);
        job.setRecruiterId(recruiterId);

        Job saved = jobRepository.save(job);
        rabbitTemplate.convertAndSend(
                "notification.exchange",
                "job.posted",
                new JobPostedEvent(saved.getId(), saved.getTitle(), saved.getCompanyName())
        );
        return saved;
    }
    @Caching(evict = {
            @CacheEvict(cacheNames = "jobsAll", allEntries = true),
            @CacheEvict(cacheNames = "jobsById", allEntries = true),
            @CacheEvict(cacheNames = "jobsSearch", allEntries = true),
            @CacheEvict(cacheNames = "jobsPaged", allEntries = true)
    })
    public Job updateJob(Long jobId, CreateJobRequest request, Long actorUserId, boolean adminOverride) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));

        if (!adminOverride && !job.getRecruiterId().equals(actorUserId)) {
            throw new IllegalArgumentException("You can update only your own job posting");
        }

        job.setTitle(request.getTitle());
        job.setCompanyName(request.getCompanyName());
        job.setJobType(request.getJobType());
        job.setLocation(request.getLocation());
        job.setSalary(request.getSalary());
        job.setExperience(request.getExperience());
        job.setDescription(request.getDescription());
        job.setOpenings(request.getOpenings() == null || request.getOpenings() < 1 ? 1 : request.getOpenings());
        return jobRepository.save(job);
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = "jobsAll", allEntries = true),
            @CacheEvict(cacheNames = "jobsById", allEntries = true),
            @CacheEvict(cacheNames = "jobsSearch", allEntries = true),
            @CacheEvict(cacheNames = "jobsPaged", allEntries = true)
    })
    public void deleteJob(Long jobId, Long actorUserId, boolean adminOverride) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));

        if (!adminOverride && !job.getRecruiterId().equals(actorUserId)) {
            throw new IllegalArgumentException("You can delete only your own job posting");
        }

        jobRepository.delete(job);
    }
}

