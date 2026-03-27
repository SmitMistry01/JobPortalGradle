package com.jobportal.jobservice.service;

import com.jobportal.jobservice.dto.CreateJobRequest;
import com.jobportal.jobservice.event.JobPostedEvent;
import com.jobportal.jobservice.model.Job;
import com.jobportal.jobservice.repository.JobRepository;
import java.util.List;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final RabbitTemplate rabbitTemplate;

    public JobService(JobRepository jobRepository, RabbitTemplate rabbitTemplate) {
        this.jobRepository = jobRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = "jobsAll", allEntries = true),
            @CacheEvict(cacheNames = "jobsById", allEntries = true),
            @CacheEvict(cacheNames = "jobsSearch", allEntries = true)
    })
    public Job createJob(CreateJobRequest request, Long recruiterId) {
        Job job = new Job();
        job.setTitle(request.getTitle());
        job.setCompanyName(request.getCompanyName());
        job.setLocation(request.getLocation());
        job.setSalary(request.getSalary());
        job.setExperience(request.getExperience());
        job.setDescription(request.getDescription());
        job.setPostedBy(recruiterId);
        job.setRecruiterId(recruiterId);

        Job saved = jobRepository.save(job);
        rabbitTemplate.convertAndSend("notification.exchange", "job.posted",
                new JobPostedEvent(saved.getId(), saved.getTitle(), saved.getCompanyName()));
        return saved;
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
}
