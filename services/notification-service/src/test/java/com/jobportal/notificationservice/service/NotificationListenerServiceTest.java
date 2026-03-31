package com.jobportal.notificationservice.service;

import com.jobportal.notificationservice.event.ApplicationStatusEvent;
import com.jobportal.notificationservice.event.JobPostedEvent;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.redis.core.StringRedisTemplate;

class NotificationListenerServiceTest {

    @Test
    void onJobPosted_shouldSendToAllUsers() {
        EmailSenderService emailSenderService = Mockito.mock(EmailSenderService.class);
        AuthUserEmailService authUserEmailService = Mockito.mock(AuthUserEmailService.class);
        StringRedisTemplate stringRedisTemplate = Mockito.mock(StringRedisTemplate.class);

        Mockito.when(authUserEmailService.getAllUserEmails())
                .thenReturn(List.of("u1@example.com", "u2@example.com"));

        NotificationListenerService listener = new NotificationListenerService(
                emailSenderService,
                authUserEmailService,
                stringRedisTemplate
        );

        JobPostedEvent event = new JobPostedEvent();
        event.setJobId(1L);
        event.setTitle("Java Developer");
        event.setCompanyName("ABC");

        listener.onJobPosted(event);

        Mockito.verify(emailSenderService, Mockito.times(2))
                .send(Mockito.anyString(), Mockito.contains("New Job Posted"), Mockito.contains("Java Developer"));
    }

    @Test
    void onApplicationStatusChanged_shouldSendToCandidate() {
        EmailSenderService emailSenderService = Mockito.mock(EmailSenderService.class);
        AuthUserEmailService authUserEmailService = Mockito.mock(AuthUserEmailService.class);
        StringRedisTemplate stringRedisTemplate = Mockito.mock(StringRedisTemplate.class);
        NotificationListenerService listener = new NotificationListenerService(
                emailSenderService,
                authUserEmailService,
                stringRedisTemplate
        );

        ApplicationStatusEvent event = new ApplicationStatusEvent();
        event.setApplicationId(10L);
        event.setEmail("candidate@example.com");
        event.setStatus("SELECTED");

        listener.onApplicationStatusChanged(event);

        Mockito.verify(emailSenderService)
                .send(Mockito.eq("candidate@example.com"), Mockito.anyString(), Mockito.contains("SELECTED"));
    }
}
