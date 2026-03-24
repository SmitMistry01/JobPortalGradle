package com.jobportal.applicationservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.applicationservice.dto.ApplyJobRequest;
import com.jobportal.applicationservice.model.ApplicationStatus;
import com.jobportal.applicationservice.model.JobApplication;
import com.jobportal.applicationservice.service.ApplicationDomainService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ApplicationController.class)
@AutoConfigureMockMvc(addFilters = false)
class ApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ApplicationDomainService service;

    @Test
    void apply_shouldReturnForbidden_forNonJobSeeker() throws Exception {
        ApplyJobRequest request = new ApplyJobRequest();
        request.setJobId(1L);
        request.setResumeUrl("http://example.com/resume.pdf");

        mockMvc.perform(post("/api/applications")
                        .header("X-User-Id", "11")
                        .header("X-User-Email", "user@example.com")
                        .header("X-User-Role", "RECRUITER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void apply_shouldCreateApplication_forJobSeeker() throws Exception {
        ApplyJobRequest request = new ApplyJobRequest();
        request.setJobId(1L);
        request.setResumeUrl("http://example.com/resume.pdf");

        JobApplication application = new JobApplication();
        application.setId(10L);
        application.setJobId(1L);
        application.setUserId(11L);
        application.setStatus(ApplicationStatus.APPLIED);

        Mockito.when(service.apply(Mockito.any(ApplyJobRequest.class), Mockito.eq(11L), Mockito.eq("user@example.com")))
                .thenReturn(application);

        mockMvc.perform(post("/api/applications")
                        .header("X-User-Id", "11")
                        .header("X-User-Email", "user@example.com")
                        .header("X-User-Role", "JOB_SEEKER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10));
    }

    @Test
    void updateStatus_shouldUpdate_forRecruiter() throws Exception {
        JobApplication updated = new JobApplication();
        updated.setId(10L);
        updated.setStatus(ApplicationStatus.SELECTED);

        Mockito.when(service.updateStatus(10L, ApplicationStatus.SELECTED)).thenReturn(updated);

        mockMvc.perform(put("/api/applications/10/status")
                        .header("X-User-Role", "RECRUITER")
                        .param("status", "SELECTED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SELECTED"));
    }
}
