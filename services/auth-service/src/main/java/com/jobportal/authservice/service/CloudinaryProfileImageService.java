package com.jobportal.authservice.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CloudinaryProfileImageService {

    private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024 * 1024;

    private final Cloudinary cloudinary;
    private final String profileImageFolder;
    private final boolean cloudinaryConfigured;

    public CloudinaryProfileImageService(
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret,
            @Value("${cloudinary.folders.profile-images:job-portal/profile-images}") String profileImageFolder
    ) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
        this.profileImageFolder = profileImageFolder;
        this.cloudinaryConfigured = !cloudName.isBlank() && !apiKey.isBlank() && !apiSecret.isBlank();
    }

    public String uploadProfileImage(MultipartFile file) {
        if (!cloudinaryConfigured) {
            throw new IllegalArgumentException("Cloudinary is not configured");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Profile image is required");
        }
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("Profile image must be <= 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed for profile image");
        }

        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", profileImageFolder,
                            "resource_type", "image"
                    )
            );
            Object secureUrl = uploadResult.get("secure_url");
            if (secureUrl == null) {
                throw new IllegalArgumentException("Profile image upload failed");
            }
            return secureUrl.toString();
        } catch (IOException ex) {
            throw new IllegalArgumentException("Profile image upload failed");
        }
    }

    public void deleteByUrl(String fileUrl) {
        if (!cloudinaryConfigured || fileUrl == null || fileUrl.isBlank()) {
            return;
        }

        String publicId = extractPublicId(fileUrl, true);
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
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


