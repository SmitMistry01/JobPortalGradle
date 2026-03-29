package com.jobportal.authservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.authservice.dto.AuthResponse;
import com.jobportal.authservice.dto.ForgotPasswordRequest;
import com.jobportal.authservice.dto.LoginRequest;
import com.jobportal.authservice.dto.OtpMessageResponse;
import com.jobportal.authservice.dto.RegisterRequest;
import com.jobportal.authservice.dto.ResetPasswordRequest;
import com.jobportal.authservice.dto.UserResponse;
import com.jobportal.authservice.dto.VerifyForgotPasswordOtpRequest;
import com.jobportal.authservice.dto.VerifyForgotPasswordOtpResponse;
import com.jobportal.authservice.dto.VerifyRegistrationOtpRequest;
import com.jobportal.authservice.model.Role;
import com.jobportal.authservice.service.AuthService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import com.jobportal.authservice.config.SecurityConfig;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.never;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Test
    void register_shouldBeDisabledForStrictOtpFlow() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName("User One");
        request.setEmail("user1@example.com");
        request.setPassword("password123");
        request.setRole(Role.JOB_SEEKER);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.message").value("Direct registration is disabled. Use /api/auth/register/request-otp and /api/auth/register/verify-otp"));

        Mockito.verify(authService, never()).register(Mockito.any(RegisterRequest.class));
    }

    @Test
    void login_shouldReturnToken() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("user1@example.com");
        request.setPassword("password123");

        Mockito.when(authService.login(Mockito.any(LoginRequest.class)))
                .thenReturn(new AuthResponse("jwt-token", 1L, "user1@example.com", "JOB_SEEKER"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"));
    }

    @Test
    void registerMultipart_shouldBeDisabledForStrictOtpFlow() throws Exception {
        MockMultipartFile profileImage = new MockMultipartFile(
                "profileImage",
                "avatar.png",
                "image/png",
                "image-bytes".getBytes()
        );

        mockMvc.perform(multipart("/api/auth/register")
                        .file(profileImage)
                        .param("name", "Recruiter One")
                        .param("email", "recruiter@example.com")
                        .param("password", "password123")
                        .param("role", "RECRUITER")
                        .param("phone", "9999999999")
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.message").value("Direct registration is disabled. Use /api/auth/register/request-otp and /api/auth/register/verify-otp"));

        Mockito.verify(authService, never()).registerWithProfileImage(Mockito.any(RegisterRequest.class), Mockito.any());
    }

    @Test
    void replaceProfileImage_shouldReturnUpdatedUser() throws Exception {
        MockMultipartFile profileImage = new MockMultipartFile(
                "profileImage",
                "new-avatar.png",
                "image/png",
                "new-image-bytes".getBytes()
        );

        Mockito.when(authService.replaceProfileImage(Mockito.eq(1L), Mockito.any()))
                .thenReturn(new UserResponse(
                        1L,
                        "User One",
                        "user1@example.com",
                        Role.JOB_SEEKER,
                        "9999999999",
                        "https://res.cloudinary.com/demo/image/upload/v2/new-avatar.png"
                ));

        mockMvc.perform(multipart("/api/auth/profile/image")
                        .file(profileImage)
                        .header("X-User-Id", "1")
                        .with(request -> {
                            request.setMethod("PUT");
                            return request;
                        })
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileImageUrl").exists());
    }

    @Test
    void requestRegistrationOtp_shouldReturnMessage() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName("User One");
        request.setEmail("user1@example.com");
        request.setPassword("password123");

        Mockito.when(authService.requestRegistrationOtp(Mockito.any(RegisterRequest.class)))
                .thenReturn(new OtpMessageResponse("OTP sent to your email"));

        mockMvc.perform(post("/api/auth/register/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP sent to your email"));
    }

    @Test
    void verifyRegistrationOtp_shouldReturnUser() throws Exception {
        VerifyRegistrationOtpRequest request = new VerifyRegistrationOtpRequest();
        request.setEmail("user1@example.com");
        request.setOtp("123456");

        Mockito.when(authService.verifyRegistrationOtp(Mockito.any(VerifyRegistrationOtpRequest.class)))
                .thenReturn(new UserResponse(1L, "User One", "user1@example.com", Role.JOB_SEEKER, "9999999999"));

        mockMvc.perform(post("/api/auth/register/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void requestForgotPasswordOtp_shouldReturnMessage() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("user1@example.com");

        Mockito.when(authService.requestForgotPasswordOtp(Mockito.any(ForgotPasswordRequest.class)))
                .thenReturn(new OtpMessageResponse("OTP sent to your email"));

        mockMvc.perform(post("/api/auth/password/forgot/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP sent to your email"));
    }

    @Test
    void verifyForgotPasswordOtp_shouldReturnResetToken() throws Exception {
        VerifyForgotPasswordOtpRequest request = new VerifyForgotPasswordOtpRequest();
        request.setEmail("user1@example.com");
        request.setOtp("123456");

        Mockito.when(authService.verifyForgotPasswordOtp(Mockito.any(VerifyForgotPasswordOtpRequest.class)))
                .thenReturn(new VerifyForgotPasswordOtpResponse("OTP verified", "token-123"));

        mockMvc.perform(post("/api/auth/password/forgot/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetToken").value("token-123"));
    }

    @Test
    void resetPassword_shouldReturnSuccessMessage() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("user1@example.com");
        request.setResetToken("token-123");
        request.setNewPassword("newPass123");

        Mockito.when(authService.resetPassword(Mockito.any(ResetPasswordRequest.class)))
                .thenReturn(new OtpMessageResponse("Password reset successful"));

        mockMvc.perform(post("/api/auth/password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successful"));
    }
}
