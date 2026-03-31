package com.jobportal.applicationservice.repository;

import com.jobportal.applicationservice.model.ApplicationStatusSaga;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationStatusSagaRepository extends JpaRepository<ApplicationStatusSaga, Long> {
    Optional<ApplicationStatusSaga> findByEventId(String eventId);
}

