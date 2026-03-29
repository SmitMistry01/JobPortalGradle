package com.jobportal.authservice.dto;

public class VerifyForgotPasswordOtpResponse {
    private String message;
    private String resetToken;

    public VerifyForgotPasswordOtpResponse(String message, String resetToken) {
        this.message = message;
        this.resetToken = resetToken;
    }

    public String getMessage() {
        return message;
    }

    public String getResetToken() {
        return resetToken;
    }
}

