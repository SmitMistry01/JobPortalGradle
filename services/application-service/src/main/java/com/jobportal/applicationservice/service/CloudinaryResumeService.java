package com.jobportal.applicationservice.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CloudinaryResumeService {

    private static final long MAX_RESUME_SIZE_BYTES = 10L * 1024 * 1024;

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

    public String uploadResume(MultipartFile resumeFile) {
        if (!cloudinaryConfigured) {
            throw new IllegalArgumentException("Cloudinary is not configured");
        }
        if (resumeFile == null || resumeFile.isEmpty()) {
            throw new IllegalArgumentException("Resume file is required");
        }
        if (resumeFile.getSize() > MAX_RESUME_SIZE_BYTES) {
            throw new IllegalArgumentException("Resume must be <= 10MB");
        }

        String contentType = resumeFile.getContentType();
        boolean allowedContentType = "application/pdf".equalsIgnoreCase(contentType)
                || "application/msword".equalsIgnoreCase(contentType)
                || "application/vnd.openxmlformats-officedocument.wordprocessingml.document".equalsIgnoreCase(contentType);
        if (!allowedContentType) {
            throw new IllegalArgumentException("Resume must be a PDF or Word document");
        }

        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    resumeFile.getBytes(),
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
            throw new IllegalArgumentException("Resume upload failed");
        }
    }

    public void deleteByUrl(String fileUrl) {
        if (!cloudinaryConfigured || fileUrl == null || fileUrl.isBlank()) {
            return;
        }

        String publicId = extractPublicId(fileUrl, false);
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        try {
            cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap("resource_type", "raw")
            );
        } catch (Exception ignored) {
            // Best effort cleanup; replacement should not fail if old asset deletion fails.
        }
    }

    private String extractPublicId(String fileUrl, boolean stripExtension) {
        int uploadMarker = fileUrl.indexOf("/upload/");
        if (uploadMarker < 0) {
            return null;
        }

        String path = fileUrl.substring(uploadMarker + "/upload/".length());
        int queryIndex = path.indexOf('?');
        if (queryIndex >= 0) {
            path = path.substring(0, queryIndex);
        }
        if (path.startsWith("v")) {
            int firstSlash = path.indexOf('/');
            if (firstSlash > 1 && path.substring(1, firstSlash).chars().allMatch(Character::isDigit)) {
                path = path.substring(firstSlash + 1);
            }
        }
        if (stripExtension) {
            int dot = path.lastIndexOf('.');
            if (dot > 0) {
                path = path.substring(0, dot);
            }
        }

        return path;
    }
}

