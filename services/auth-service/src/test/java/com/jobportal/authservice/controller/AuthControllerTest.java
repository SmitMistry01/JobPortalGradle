package com.jobportal.authservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.authservice.dto.AuthResponse;
import com.jobportal.authservice.dto.LoginRequest;
import com.jobportal.authservice.dto.RegisterRequest;
import com.jobportal.authservice.dto.UserResponse;
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
import org.springframework.test.web.servlet.MockMvc;
import com.jobportal.authservice.config.SecurityConfig;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
    void register_shouldReturnUser() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName("User One");
        request.setEmail("user1@example.com");
        request.setPassword("password123");
        request.setRole(Role.JOB_SEEKER);

        Mockito.when(authService.register(Mockito.any(RegisterRequest.class)))
                .thenReturn(new UserResponse(1L, "User One", "user1@example.com", Role.JOB_SEEKER, "9999999999"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("user1@example.com"));
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
}
