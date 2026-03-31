package com.jobportal.applicationservice.event;

public class ApplicationStatusEvent {
    private Long applicationId;
    private String email;
    private String status;
    private String eventId;
    private String correlationId;

    public ApplicationStatusEvent() {
    }

    public ApplicationStatusEvent(Long applicationId, String email, String status) {
        this.applicationId = applicationId;
        this.email = email;
        this.status = status;
    }

    public ApplicationStatusEvent(
            Long applicationId,
            String email,
            String status,
            String eventId,
            String correlationId
    ) {
        this.applicationId = applicationId;
        this.email = email;
        this.status = status;
        this.eventId = eventId;
        this.correlationId = correlationId;
    }

    public Long getApplicationId() {
        return applicationId;
    }

    public String getEmail() {
        return email;
    }

    public String getStatus() {
        return status;
    }

    public String getEventId() {
        return eventId;
    }

    public String getCorrelationId() {
        return correlationId;
    }
}
