package com.jobportal.authservice.dto;

public class OtpMessageResponse {
    private String message;

    public OtpMessageResponse(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}

