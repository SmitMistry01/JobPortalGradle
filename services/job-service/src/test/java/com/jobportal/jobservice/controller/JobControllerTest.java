package com.jobportal.jobservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.jobservice.dto.CreateJobRequest;
import com.jobportal.jobservice.model.Job;
import com.jobportal.jobservice.service.JobCommandService;
import com.jobportal.jobservice.service.JobQueryService;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(JobController.class)
@AutoConfigureMockMvc(addFilters = false)
class JobControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private JobCommandService jobCommandService;

    @MockBean
    private JobQueryService jobQueryService;

    @Test
    void createJob_shouldReturnForbidden_forNonRecruiter() throws Exception {
        CreateJobRequest request = new CreateJobRequest();
        request.setTitle("Java Developer");

        mockMvc.perform(post("/api/jobs")
                        .header("X-User-Role", "JOB_SEEKER")
                        .header("X-User-Id", "10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createJob_shouldCreate_forRecruiter() throws Exception {
        CreateJobRequest request = new CreateJobRequest();
        request.setTitle("Java Developer");
        request.setCompanyName("ABC");
        request.setLocation("Pune");
        request.setSalary(BigDecimal.valueOf(1000000));

        Job job = new Job();
        job.setId(1L);
        job.setTitle("Java Developer");
        job.setRecruiterId(5L);

        Mockito.when(jobCommandService.createJob(Mockito.any(CreateJobRequest.class), Mockito.eq(5L))).thenReturn(job);

        mockMvc.perform(post("/api/jobs")
                        .header("X-User-Role", "RECRUITER")
                        .header("X-User-Id", "5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.recruiterId").value(5));
    }

    @Test
    void createJob_shouldCreate_forRolePrefixedRecruiter() throws Exception {
        CreateJobRequest request = new CreateJobRequest();
        request.setTitle("Java Developer");
        request.setCompanyName("ABC");
        request.setLocation("Pune");
        request.setSalary(BigDecimal.valueOf(1000000));

        Job job = new Job();
        job.setId(3L);
        job.setTitle("Java Developer");
        job.setRecruiterId(7L);

        Mockito.when(jobCommandService.createJob(Mockito.any(CreateJobRequest.class), Mockito.eq(7L))).thenReturn(job);

        mockMvc.perform(post("/api/jobs")
                        .header("X-User-Role", "ROLE_RECRUITER")
                        .header("X-User-Id", "7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.recruiterId").value(7));
    }

    @Test
    void allJobs_shouldReturnList() throws Exception {
        Job job = new Job();
        job.setId(2L);
        job.setTitle("Backend Engineer");
        Mockito.when(jobQueryService.getAllJobs()).thenReturn(List.of(job));

        mockMvc.perform(get("/api/jobs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(2));
    }

    @Test
    void pagedJobs_shouldReturnPageData() throws Exception {
        Job job = new Job();
        job.setId(9L);
        job.setTitle("Platform Engineer");

        Mockito.when(jobQueryService.searchPaged(Mockito.eq("Platform"), Mockito.eq("Pune"), Mockito.any()))
                .thenReturn(new PageImpl<>(List.of(job), PageRequest.of(0, 5), 1));

        mockMvc.perform(get("/api/jobs/paged")
                        .param("title", "Platform")
                        .param("location", "Pune")
                        .param("page", "0")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(9))
                .andExpect(jsonPath("$.totalElements").value(1));
    }
}
