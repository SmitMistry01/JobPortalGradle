package com.jobportal.notificationservice.service;

import com.jobportal.notificationservice.event.ApplicationStatusEvent;
import com.jobportal.notificationservice.event.JobPostedEvent;
import java.util.List;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class NotificationListenerService {

    private final EmailSenderService emailSenderService;
    private final AuthUserEmailService authUserEmailService;

    public NotificationListenerService(EmailSenderService emailSenderService, AuthUserEmailService authUserEmailService) {
        this.emailSenderService = emailSenderService;
        this.authUserEmailService = authUserEmailService;
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
        emailSenderService.send(
                event.getEmail(),
                "Application Status Updated",
                "Your application status has been updated to: " + event.getStatus() + "\n\n"
                        + "Congratulations! You are selected/shortlisted."
        );
    }
}
