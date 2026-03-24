package com.jobportal.jobservice.service;

import com.jobportal.jobservice.dto.CreateJobRequest;
import com.jobportal.jobservice.event.JobPostedEvent;
import com.jobportal.jobservice.model.Job;
import com.jobportal.jobservice.repository.JobRepository;
import java.util.List;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final RabbitTemplate rabbitTemplate;

    public JobService(JobRepository jobRepository, RabbitTemplate rabbitTemplate) {
        this.jobRepository = jobRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

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

    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    public Job getJob(Long id) {
        return jobRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Job not found"));
    }

    public List<Job> search(String title, String location) {
        return jobRepository.findByTitleContainingIgnoreCaseAndLocationContainingIgnoreCase(
                title == null ? "" : title,
                location == null ? "" : location
        );
    }
}
