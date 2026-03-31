package com.jobportal.notificationservice.service;

import com.jobportal.notificationservice.event.ApplicationStatusEvent;
import com.jobportal.notificationservice.event.JobPostedEvent;
import java.time.Duration;
import java.util.List;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationListenerService {

    private final EmailSenderService emailSenderService;
    private final AuthUserEmailService authUserEmailService;
    private final StringRedisTemplate stringRedisTemplate;

    public NotificationListenerService(
            EmailSenderService emailSenderService,
            AuthUserEmailService authUserEmailService,
            StringRedisTemplate stringRedisTemplate
    ) {
        this.emailSenderService = emailSenderService;
        this.authUserEmailService = authUserEmailService;
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @RabbitListener(queues = "job.notifications")
    public void onJobPosted(JobPostedEvent event) {
        List<String> emails = authUserEmailService.getAllUserEmails();

        if (emails == null || emails.isEmpty()) {
            return;
        }

        for (String email : emails) {
            emailSenderService.send(
                    email,
                    "New Job Posted: " + event.getTitle(),
                    "A new job has been posted by " + event.getCompanyName() + "\n\n"
                            + "Job Title: " + event.getTitle() + "\n"
                            + "Apply now on Job Portal."
            );
        }
    }

    @RabbitListener(queues = "application.notifications")
    public void onApplicationStatusChanged(ApplicationStatusEvent event) {
        if (event.getEventId() != null && !event.getEventId().isBlank()) {
            String key = "notification:event:application-status:" + event.getEventId();
            Boolean firstConsumption = stringRedisTemplate.opsForValue()
                    .setIfAbsent(key, "1", Duration.ofHours(24));
            if (Boolean.FALSE.equals(firstConsumption)) {
                return;
            }
        }

        emailSenderService.send(
                event.getEmail(),
                "Application Status Updated",
                "Your application status has been updated to: " + event.getStatus() + "\n\n"
                        + "Congratulations! You are selected/shortlisted."
        );
    }
}
