package com.jobportal.authservice.service;

import com.jobportal.authservice.dto.AuthResponse;
import com.jobportal.authservice.dto.LoginRequest;
import com.jobportal.authservice.dto.RegisterRequest;
import com.jobportal.authservice.dto.UserResponse;
import com.jobportal.authservice.model.Role;
import com.jobportal.authservice.model.User;
import com.jobportal.authservice.repository.UserRepository;
import com.jobportal.authservice.security.JwtService;
import java.util.List;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CloudinaryProfileImageService cloudinaryProfileImageService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            CloudinaryProfileImageService cloudinaryProfileImageService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.cloudinaryProfileImageService = cloudinaryProfileImageService;
    }

    public UserResponse registerWithProfileImage(RegisterRequest request, MultipartFile profileImage) {
        if (profileImage != null && !profileImage.isEmpty()) {
            request.setProfileImageUrl(cloudinaryProfileImageService.uploadProfileImage(profileImage));
        }
        return register(request);
    }

    public UserResponse replaceProfileImage(Long userId, MultipartFile profileImage) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String oldProfileImageUrl = user.getProfileImageUrl();
        String newProfileImageUrl = cloudinaryProfileImageService.uploadProfileImage(profileImage);

        user.setProfileImageUrl(newProfileImageUrl);
        User saved = userRepository.save(user);

        if (oldProfileImageUrl != null && !oldProfileImageUrl.isBlank()
                && !oldProfileImageUrl.equals(newProfileImageUrl)) {
            cloudinaryProfileImageService.deleteByUrl(oldProfileImageUrl);
        }

        return new UserResponse(
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getRole(),
                saved.getPhone(),
                saved.getProfileImageUrl()
        );
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = "authUsers", allEntries = true),
            @CacheEvict(cacheNames = "authUserEmails", allEntries = true)
    })
    public UserResponse register(RegisterRequest request) {
        validateRegisterRequest(request);

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setUsername(resolveUsername(request));
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(request.getRole() == null ? Role.JOB_SEEKER : request.getRole());
        user.setProfileImageUrl(request.getProfileImageUrl());

        User saved = userRepository.save(user);
        return new UserResponse(
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getRole(),
                saved.getPhone(),
                saved.getProfileImageUrl()
        );
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole().name());
    }

    @Cacheable(cacheNames = "authUsers")
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserResponse(
                        u.getId(),
                        u.getName(),
                        u.getEmail(),
                        u.getRole(),
                        u.getPhone(),
                        u.getProfileImageUrl()
                ))
                .toList();
    }

    @Cacheable(cacheNames = "authUserEmails")
    public List<String> getAllUserEmails() {
        return userRepository.findAll().stream().map(User::getEmail).toList();
    }

    private String resolveUsername(RegisterRequest request) {
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            return request.getUsername().trim();
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        String email = request.getEmail().trim();
        int atIndex = email.indexOf('@');
        return atIndex > 0 ? email.substring(0, atIndex) : email;
    }

    private void validateRegisterRequest(RegisterRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
    }
}
