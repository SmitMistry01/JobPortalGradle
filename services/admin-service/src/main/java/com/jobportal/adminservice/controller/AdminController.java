package com.jobportal.adminservice.controller;

import com.jobportal.adminservice.service.AdminFacadeService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminFacadeService adminFacadeService;

    public AdminController(AdminFacadeService adminFacadeService) {
        this.adminFacadeService = adminFacadeService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> users(@RequestHeader("X-User-Role") String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(adminFacadeService.users());
    }

    @GetMapping("/jobs")
    public ResponseEntity<List<Map<String, Object>>> jobs(@RequestHeader("X-User-Role") String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(adminFacadeService.jobs());
    }

    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> reports(@RequestHeader("X-User-Role") String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(adminFacadeService.reports());
    }
}
