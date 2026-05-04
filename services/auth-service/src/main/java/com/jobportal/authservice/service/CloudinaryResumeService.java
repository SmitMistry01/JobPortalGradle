package com.jobportal.authservice.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryResumeService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5MB

    private final Cloudinary cloudinary;
    private final String resumeFolder;
    private final boolean cloudinaryConfigured;

    public CloudinaryResumeService(
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret,
            @Value("${cloudinary.folders.resumes:job-portal/resumes}") String resumeFolder
    ) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
        this.resumeFolder = resumeFolder;
        this.cloudinaryConfigured = !cloudName.isBlank() && !apiKey.isBlank() && !apiSecret.isBlank();
    }

    public String uploadResume(MultipartFile file) {
        if (!cloudinaryConfigured) {
            throw new IllegalArgumentException("Cloudinary is not configured");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Resume file is required");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("Resume must be <= 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new IllegalArgumentException("Only PDF files are allowed for resume");
        }

        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", resumeFolder,
                            "resource_type", "raw"
                    )
            );
            Object secureUrl = uploadResult.get("secure_url");
            if (secureUrl == null) {
                throw new IllegalArgumentException("Resume upload failed");
            }
            return secureUrl.toString();
        } catch (IOException ex) {
            throw new IllegalArgumentException("Resume upload failed: " + ex.getMessage());
        }
    }
}
