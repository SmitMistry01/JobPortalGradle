package com.jobportal.authservice.repository;

import com.jobportal.authservice.model.PasswordResetOtp;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {
    Optional<PasswordResetOtp> findByEmail(String email);

    void deleteByEmail(String email);
}

