package com.jobportal.applicationservice.service;

import com.jobportal.applicationservice.dto.ApplyJobRequest;
import com.jobportal.applicationservice.event.ApplicationStatusEvent;
import com.jobportal.applicationservice.model.ApplicationStatusSaga;
import com.jobportal.applicationservice.model.ApplicationStatus;
import com.jobportal.applicationservice.model.JobApplication;
import com.jobportal.applicationservice.model.SagaState;
import com.jobportal.applicationservice.repository.ApplicationStatusSagaRepository;
import com.jobportal.applicationservice.repository.JobApplicationRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ApplicationDomainService {

    private final JobApplicationRepository repository;
    private final RabbitTemplate rabbitTemplate;
    private final CloudinaryResumeService cloudinaryResumeService;
    private final ApplicationStatusSagaRepository sagaRepository;
    private final com.jobportal.applicationservice.client.AiServiceClient aiServiceClient;
    private final com.jobportal.applicationservice.client.JobServiceClient jobServiceClient;

    public ApplicationDomainService(
            JobApplicationRepository repository,
            RabbitTemplate rabbitTemplate,
            CloudinaryResumeService cloudinaryResumeService,
            ApplicationStatusSagaRepository sagaRepository,
            com.jobportal.applicationservice.client.AiServiceClient aiServiceClient,
            com.jobportal.applicationservice.client.JobServiceClient jobServiceClient
    ) {
        this.repository = repository;
        this.rabbitTemplate = rabbitTemplate;
        this.cloudinaryResumeService = cloudinaryResumeService;
        this.sagaRepository = sagaRepository;
        this.aiServiceClient = aiServiceClient;
        this.jobServiceClient = jobServiceClient;
    }

    public JobApplication applyWithResume(Long jobId, MultipartFile resume, Long userId, String userEmail) {
        ApplyJobRequest request = new ApplyJobRequest();
        request.setJobId(jobId);
        request.setResumeUrl(cloudinaryResumeService.uploadResume(resume));
        return apply(request, userId, userEmail);
    }

    public JobApplication replaceResume(Long applicationId, MultipartFile resume, Long userId) {
        JobApplication application = repository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (!application.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can update only your own application");
        }

        String oldResumeUrl = application.getResumeUrl();
        String newResumeUrl = cloudinaryResumeService.uploadResume(resume);

        application.setResumeUrl(newResumeUrl);
        JobApplication saved = repository.save(application);

        if (oldResumeUrl != null && !oldResumeUrl.isBlank() && !oldResumeUrl.equals(newResumeUrl)) {
            cloudinaryResumeService.deleteByUrl(oldResumeUrl);
        }

        return saved;
    }

    public JobApplication apply(ApplyJobRequest request, Long userId, String userEmail) {
        if (request.getResumeUrl() == null || request.getResumeUrl().isBlank()) {
            throw new IllegalArgumentException("Resume URL is required");
        }
        if (repository.existsByUserIdAndJobId(userId, request.getJobId())) {
            throw new IllegalArgumentException("You already applied for this job");
        }
        JobApplication application = new JobApplication();
        application.setUserId(userId);
        application.setJobId(request.getJobId());
        application.setResumeUrl(request.getResumeUrl());
        application.setUserEmail(userEmail);
        application.setStatus(ApplicationStatus.APPLIED);
        
        try {
            String jobDescription = jobServiceClient.getJobDescription(request.getJobId());
            if (!jobDescription.isBlank()) {
                java.util.Map<String, Object> atsResult = aiServiceClient.calculateAtsScore(request.getResumeUrl(), jobDescription);
                if (atsResult.containsKey("score")) {
                    application.setAtsScore((Integer) atsResult.get("score"));
                }
                if (atsResult.containsKey("feedback")) {
                    application.setAtsFeedback((String) atsResult.get("feedback"));
                }
            }
        } catch (Exception e) {
            // Log error but allow application to proceed
            application.setAtsScore(0);
            application.setAtsFeedback("Could not calculate score: " + e.getMessage());
        }
        
        return repository.save(application);
    }

    public List<JobApplication> userApplications(Long userId) {
        return repository.findByUserId(userId);
    }

    public List<JobApplication> jobApplications(Long jobId) {
        return repository.findByJobId(jobId);
    }

    @Transactional
    public JobApplication updateStatus(Long id, ApplicationStatus status) {
        JobApplication application = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        return updateStatusAndPublishIfNeeded(application, status);
    }

    @Transactional
    public JobApplication updateStatusByUserAndJob(Long userId, Long jobId, ApplicationStatus status) {
        JobApplication application = repository.findByUserIdAndJobId(userId, jobId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        return updateStatusAndPublishIfNeeded(application, status);
    }

    private JobApplication updateStatusAndPublishIfNeeded(JobApplication application, ApplicationStatus status) {

        application.setStatus(status);
        JobApplication saved = repository.save(application);

        if (status == ApplicationStatus.SHORTLISTED || status == ApplicationStatus.SELECTED) {
            String eventId = UUID.randomUUID().toString();
            String correlationId = "application-status-" + saved.getId();

            ApplicationStatusSaga saga = new ApplicationStatusSaga();
            saga.setEventId(eventId);
            saga.setCorrelationId(correlationId);
            saga.setApplicationId(saved.getId());
            saga.setState(SagaState.PENDING);
            sagaRepository.save(saga);

            try {
                rabbitTemplate.convertAndSend(
                        "notification.exchange",
                        "application.status.changed",
                        new ApplicationStatusEvent(saved.getId(), saved.getUserEmail(), status.name(), eventId, correlationId)
                );
                saga.setState(SagaState.COMPLETED);
                saga.setLastError(null);
            } catch (Exception ex) {
                saga.setState(SagaState.FAILED);
                saga.setRetryCount(saga.getRetryCount() + 1);
                saga.setLastError(ex.getMessage());
                sagaRepository.save(saga);
                throw ex;
            }

            sagaRepository.save(saga);
        }

        return saved;
    }
}
