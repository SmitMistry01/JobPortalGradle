package com.jobportal.applicationservice.event;

public class ApplicationStatusEvent {
    private Long applicationId;
    private String email;
    private String status;

    public ApplicationStatusEvent() {
    }

    public ApplicationStatusEvent(Long applicationId, String email, String status) {
        this.applicationId = applicationId;
        this.email = email;
        this.status = status;
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
}
