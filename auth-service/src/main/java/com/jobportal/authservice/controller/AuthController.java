package com.jobportal.authservice.controller;

import com.jobportal.authservice.dto.AuthResponse;
import com.jobportal.authservice.dto.LoginRequest;
import com.jobportal.authservice.dto.RegisterRequest;
import com.jobportal.authservice.dto.UserResponse;
import com.jobportal.authservice.service.AuthService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/internal/users")
    public ResponseEntity<List<UserResponse>> users() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @GetMapping("/internal/users/emails")
    public ResponseEntity<List<String>> userEmails() {
        return ResponseEntity.ok(authService.getAllUserEmails());
    }
}
