package com.jobportal.applicationservice.service;

import com.jobportal.applicationservice.dto.ApplyJobRequest;
import com.jobportal.applicationservice.event.ApplicationStatusEvent;
import com.jobportal.applicationservice.model.ApplicationStatus;
import com.jobportal.applicationservice.model.JobApplication;
import com.jobportal.applicationservice.repository.JobApplicationRepository;
import java.util.List;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class ApplicationDomainService {

    private final JobApplicationRepository repository;
    private final RabbitTemplate rabbitTemplate;

    public ApplicationDomainService(JobApplicationRepository repository, RabbitTemplate rabbitTemplate) {
        this.repository = repository;
        this.rabbitTemplate = rabbitTemplate;
    }

    public JobApplication apply(ApplyJobRequest request, Long userId, String userEmail) {
        if (repository.existsByUserIdAndJobId(userId, request.getJobId())) {
            throw new IllegalArgumentException("You already applied for this job");
        }
        JobApplication application = new JobApplication();
        application.setUserId(userId);
        application.setJobId(request.getJobId());
        application.setResumeUrl(request.getResumeUrl());
        application.setUserEmail(userEmail);
        application.setStatus(ApplicationStatus.APPLIED);
        return repository.save(application);
    }

    public List<JobApplication> userApplications(Long userId) {
        return repository.findByUserId(userId);
    }

    public List<JobApplication> jobApplications(Long jobId) {
        return repository.findByJobId(jobId);
    }

    public JobApplication updateStatus(Long id, ApplicationStatus status) {
        JobApplication application = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        application.setStatus(status);
        JobApplication saved = repository.save(application);

        if (status == ApplicationStatus.SHORTLISTED || status == ApplicationStatus.SELECTED) {
            rabbitTemplate.convertAndSend(
                    "notification.exchange",
                    "application.status.changed",
                    new ApplicationStatusEvent(saved.getId(), saved.getUserEmail(), status.name())
            );
        }

        return saved;
    }
}
