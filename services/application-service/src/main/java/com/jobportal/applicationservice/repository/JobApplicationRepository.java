package com.jobportal.applicationservice.repository;

import com.jobportal.applicationservice.model.JobApplication;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    boolean existsByUserIdAndJobId(Long userId, Long jobId);

    List<JobApplication> findByUserId(Long userId);

    List<JobApplication> findByJobId(Long jobId);

    Optional<JobApplication> findByUserIdAndJobId(Long userId, Long jobId);
}
