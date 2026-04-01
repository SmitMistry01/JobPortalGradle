package com.jobportal.authservice.controller;

import com.jobportal.authservice.dto.AuthResponse;
import com.jobportal.authservice.dto.ForgotPasswordRequest;
import com.jobportal.authservice.dto.LoginRequest;
import com.jobportal.authservice.dto.OtpMessageResponse;
import com.jobportal.authservice.dto.RegisterRequest;
import com.jobportal.authservice.dto.ResetPasswordRequest;
import com.jobportal.authservice.dto.UpdateUserProfileRequest;
import com.jobportal.authservice.dto.UserResponse;
import com.jobportal.authservice.dto.VerifyForgotPasswordOtpRequest;
import com.jobportal.authservice.dto.VerifyForgotPasswordOtpResponse;
import com.jobportal.authservice.dto.VerifyRegistrationOtpRequest;
import com.jobportal.authservice.model.Role;
import com.jobportal.authservice.service.AuthService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<OtpMessageResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.GONE)
                .body(new OtpMessageResponse("Direct registration is disabled. Use /api/auth/register/request-otp and /api/auth/register/verify-otp"));
    }

    @PostMapping("/register/request-otp")
    public ResponseEntity<OtpMessageResponse> requestRegistrationOtp(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.requestRegistrationOtp(request));
    }

    @PostMapping("/register/verify-otp")
    public ResponseEntity<UserResponse> verifyRegistrationOtp(@RequestBody VerifyRegistrationOtpRequest request) {
        return ResponseEntity.ok(authService.verifyRegistrationOtp(request));
    }

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OtpMessageResponse> registerWithProfileImage(
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam(required = false) String username,
            @RequestParam String password,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String phone,
            @RequestPart(name = "profileImage", required = false) MultipartFile profileImage
    ) {
        return ResponseEntity.status(HttpStatus.GONE)
                .body(new OtpMessageResponse("Direct registration is disabled. Use /api/auth/register/request-otp and /api/auth/register/verify-otp"));
    }

    @PostMapping(value = "/register/request-otp", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OtpMessageResponse> requestRegistrationOtpWithProfileImage(
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam(required = false) String username,
            @RequestParam String password,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String phone,
            @RequestPart(name = "profileImage", required = false) MultipartFile profileImage
    ) {
        RegisterRequest request = new RegisterRequest();
        request.setName(name);
        request.setEmail(email);
        request.setUsername(username);
        request.setPassword(password);
        request.setPhone(phone);
        request.setRole(resolveRole(role));

        return ResponseEntity.ok(authService.requestRegistrationOtp(request, profileImage));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/password/forgot/request-otp")
    public ResponseEntity<OtpMessageResponse> requestForgotPasswordOtp(@RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.requestForgotPasswordOtp(request));
    }

    @PostMapping("/password/forgot/verify-otp")
    public ResponseEntity<VerifyForgotPasswordOtpResponse> verifyForgotPasswordOtp(
            @RequestBody VerifyForgotPasswordOtpRequest request
    ) {
        return ResponseEntity.ok(authService.verifyForgotPasswordOtp(request));
    }

    @PostMapping("/password/reset")
    public ResponseEntity<OtpMessageResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    @GetMapping("/internal/users")
    public ResponseEntity<List<UserResponse>> users() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @GetMapping("/internal/users/emails")
    public ResponseEntity<List<String>> userEmails() {
        return ResponseEntity.ok(authService.getAllUserEmails());
    }

    @PutMapping(value = "/profile/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponse> replaceProfileImage(
            @RequestHeader("X-User-Id") Long userId,
            @RequestPart("profileImage") MultipartFile profileImage
    ) {
        return ResponseEntity.ok(authService.replaceProfileImage(userId, profileImage));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody UpdateUserProfileRequest request
    ) {
        return ResponseEntity.ok(authService.updateUserProfile(userId, request));
    }

    private Role resolveRole(String role) {
        if (role == null || role.isBlank()) {
            return null;
        }
        try {
            return Role.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid role: " + role);
        }
    }
}
