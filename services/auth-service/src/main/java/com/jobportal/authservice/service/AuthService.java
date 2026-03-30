package com.jobportal.authservice.service;

import com.jobportal.authservice.dto.AuthResponse;
import com.jobportal.authservice.dto.ForgotPasswordRequest;
import com.jobportal.authservice.dto.LoginRequest;
import com.jobportal.authservice.dto.OtpMessageResponse;
import com.jobportal.authservice.dto.RegisterRequest;
import com.jobportal.authservice.dto.ResetPasswordRequest;
import com.jobportal.authservice.dto.UserResponse;
import com.jobportal.authservice.dto.VerifyForgotPasswordOtpRequest;
import com.jobportal.authservice.dto.VerifyForgotPasswordOtpResponse;
import com.jobportal.authservice.dto.VerifyRegistrationOtpRequest;
import com.jobportal.authservice.model.PasswordResetOtp;
import com.jobportal.authservice.model.RegistrationOtp;
import com.jobportal.authservice.model.Role;
import com.jobportal.authservice.model.User;
import com.jobportal.authservice.repository.PasswordResetOtpRepository;
import com.jobportal.authservice.repository.RegistrationOtpRepository;
import com.jobportal.authservice.repository.UserRepository;
import com.jobportal.authservice.security.JwtService;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RegistrationOtpRepository registrationOtpRepository;
    private final PasswordResetOtpRepository passwordResetOtpRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CloudinaryProfileImageService cloudinaryProfileImageService;
    private final JavaMailSender mailSender;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${auth.otp.expiry-minutes:10}")
    private long otpExpiryMinutes;

    @Value("${auth.otp.max-attempts:5}")
    private int maxOtpAttempts;

    @Value("${auth.reset-token.expiry-minutes:15}")
    private long resetTokenExpiryMinutes;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${spring.mail.host:}")
    private String mailHost;

    public AuthService(
            UserRepository userRepository,
            RegistrationOtpRepository registrationOtpRepository,
            PasswordResetOtpRepository passwordResetOtpRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            CloudinaryProfileImageService cloudinaryProfileImageService,
            JavaMailSender mailSender
    ) {
        this.userRepository = userRepository;
        this.registrationOtpRepository = registrationOtpRepository;
        this.passwordResetOtpRepository = passwordResetOtpRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.cloudinaryProfileImageService = cloudinaryProfileImageService;
        this.mailSender = mailSender;

        logMailConfiguration();
    }

    private void logMailConfiguration() {
        log.info("========== Mail Configuration ==========");
        log.info("SMTP Host: {}", mailHost);
        log.info("SMTP Username: {}", maskEmail(mailUsername));
        log.info("SMTP Password: {}", mailPassword != null && !mailPassword.isEmpty() ? "***SET***" : "NOT SET");
        
        if (mailUsername == null || mailUsername.isEmpty()) {
            log.warn("⚠️  MAIL_USERNAME environment variable is NOT set!");
            log.warn("⚠️  Email sending will FAIL!");
            log.warn("⚠️  Set: export MAIL_USERNAME=jobportall121@gmail.com");
        }
        if (mailPassword == null || mailPassword.isEmpty()) {
            log.warn("⚠️  MAIL_PASSWORD environment variable is NOT set!");
            log.warn("⚠️  Email sending will FAIL!");
            log.warn("⚠️  Set: export MAIL_PASSWORD=tyrwqxhcmvwaxjjq");
        }
        if (mailHost == null || mailHost.isEmpty()) {
            log.warn("⚠️  SMTP Host is not configured!");
        }
        log.info("========================================");
    }

    private String maskEmail(String email) {
        if (email == null || email.isEmpty()) {
            return "NOT SET";
        }
        return email.substring(0, 3) + "****" + email.substring(email.lastIndexOf('@'));
    }

    public OtpMessageResponse requestRegistrationOtp(RegisterRequest request) {
        return requestRegistrationOtp(request, null);
    }

    public OtpMessageResponse requestRegistrationOtp(RegisterRequest request, MultipartFile profileImage) {
        validateRegisterRequest(request);

        if (profileImage != null && !profileImage.isEmpty()) {
            request.setProfileImageUrl(cloudinaryProfileImageService.uploadProfileImage(profileImage));
        }

        String normalizedEmail = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email already exists");
        }

        String otp = generateOtp();
        RegistrationOtp registrationOtp = registrationOtpRepository.findByEmail(normalizedEmail)
                .orElseGet(RegistrationOtp::new);
        registrationOtp.setEmail(normalizedEmail);
        registrationOtp.setName(request.getName().trim());
        registrationOtp.setUsername(resolveUsername(request));
        registrationOtp.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        registrationOtp.setPhone(request.getPhone());
        registrationOtp.setRole(request.getRole() == null ? Role.JOB_SEEKER : request.getRole());
        registrationOtp.setProfileImageUrl(request.getProfileImageUrl());
        registrationOtp.setOtpHash(passwordEncoder.encode(otp));
        registrationOtp.setExpiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes));
        registrationOtp.setAttempts(0);
        registrationOtpRepository.save(registrationOtp);

        log.info("🔐 REGISTRATION OTP: {} (Expires in {} minutes)", otp, otpExpiryMinutes);
        log.info("📧 OTP Email: {}", normalizedEmail);
        
        sendOtpEmail(normalizedEmail, otp, "Registration OTP", "Use this OTP to complete your registration");
        return new OtpMessageResponse("OTP sent to your email");
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = "authUsers", allEntries = true),
            @CacheEvict(cacheNames = "authUserEmails", allEntries = true)
    })
    public UserResponse verifyRegistrationOtp(VerifyRegistrationOtpRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (request.getOtp() == null || request.getOtp().isBlank()) {
            throw new IllegalArgumentException("OTP is required");
        }

        String normalizedEmail = normalizeEmail(request.getEmail());
        RegistrationOtp registrationOtp = registrationOtpRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("OTP is invalid or expired"));

        if (registrationOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            registrationOtpRepository.delete(registrationOtp);
            throw new IllegalArgumentException("OTP has expired");
        }
        if (registrationOtp.getAttempts() >= maxOtpAttempts) {
            registrationOtpRepository.delete(registrationOtp);
            throw new IllegalArgumentException("OTP attempt limit exceeded. Please request a new OTP");
        }
        if (!passwordEncoder.matches(request.getOtp().trim(), registrationOtp.getOtpHash())) {
            registrationOtp.setAttempts(registrationOtp.getAttempts() + 1);
            registrationOtpRepository.save(registrationOtp);
            throw new IllegalArgumentException("Invalid OTP");
        }
        if (userRepository.existsByEmail(normalizedEmail)) {
            registrationOtpRepository.delete(registrationOtp);
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setName(registrationOtp.getName());
        user.setEmail(registrationOtp.getEmail());
        user.setUsername(registrationOtp.getUsername());
        user.setPassword(registrationOtp.getPasswordHash());
        user.setPhone(registrationOtp.getPhone());
        user.setRole(registrationOtp.getRole() == null ? Role.JOB_SEEKER : registrationOtp.getRole());
        user.setProfileImageUrl(registrationOtp.getProfileImageUrl());

        User saved = userRepository.save(user);
        registrationOtpRepository.delete(registrationOtp);

        return new UserResponse(
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getRole(),
                saved.getPhone(),
                saved.getProfileImageUrl()
        );
    }

    public OtpMessageResponse requestForgotPasswordOtp(ForgotPasswordRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        String normalizedEmail = normalizeEmail(request.getEmail());
        userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("User with this email does not exist"));

        String otp = generateOtp();
        PasswordResetOtp passwordResetOtp = passwordResetOtpRepository.findByEmail(normalizedEmail)
                .orElseGet(PasswordResetOtp::new);
        passwordResetOtp.setEmail(normalizedEmail);
        passwordResetOtp.setOtpHash(passwordEncoder.encode(otp));
        passwordResetOtp.setExpiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes));
        passwordResetOtp.setAttempts(0);
        passwordResetOtp.setVerified(false);
        passwordResetOtp.setResetTokenHash(null);
        passwordResetOtp.setResetTokenExpiresAt(null);
        passwordResetOtpRepository.save(passwordResetOtp);

        log.info("🔐 PASSWORD RESET OTP: {} (Expires in {} minutes)", otp, otpExpiryMinutes);
        log.info("📧 OTP Email: {}", normalizedEmail);
        
        sendOtpEmail(normalizedEmail, otp, "Password reset OTP", "Use this OTP to verify your password reset request");
        return new OtpMessageResponse("OTP sent to your email");
    }

    public VerifyForgotPasswordOtpResponse verifyForgotPasswordOtp(VerifyForgotPasswordOtpRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (request.getOtp() == null || request.getOtp().isBlank()) {
            throw new IllegalArgumentException("OTP is required");
        }

        String normalizedEmail = normalizeEmail(request.getEmail());
        PasswordResetOtp passwordResetOtp = passwordResetOtpRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("OTP is invalid or expired"));

        if (passwordResetOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            passwordResetOtpRepository.delete(passwordResetOtp);
            throw new IllegalArgumentException("OTP has expired");
        }
        if (passwordResetOtp.getAttempts() >= maxOtpAttempts) {
            passwordResetOtpRepository.delete(passwordResetOtp);
            throw new IllegalArgumentException("OTP attempt limit exceeded. Please request a new OTP");
        }
        if (!passwordEncoder.matches(request.getOtp().trim(), passwordResetOtp.getOtpHash())) {
            passwordResetOtp.setAttempts(passwordResetOtp.getAttempts() + 1);
            passwordResetOtpRepository.save(passwordResetOtp);
            throw new IllegalArgumentException("Invalid OTP");
        }

        String resetToken = UUID.randomUUID().toString();
        passwordResetOtp.setVerified(true);
        passwordResetOtp.setResetTokenHash(passwordEncoder.encode(resetToken));
        passwordResetOtp.setResetTokenExpiresAt(LocalDateTime.now().plusMinutes(resetTokenExpiryMinutes));
        passwordResetOtpRepository.save(passwordResetOtp);

        return new VerifyForgotPasswordOtpResponse("OTP verified", resetToken);
    }

    @CacheEvict(cacheNames = "authUsers", allEntries = true)
    public OtpMessageResponse resetPassword(ResetPasswordRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (request.getResetToken() == null || request.getResetToken().isBlank()) {
            throw new IllegalArgumentException("Reset token is required");
        }
        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new IllegalArgumentException("New password is required");
        }

        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("User with this email does not exist"));

        PasswordResetOtp passwordResetOtp = passwordResetOtpRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("OTP verification is required before password reset"));

        if (!passwordResetOtp.isVerified() || passwordResetOtp.getResetTokenHash() == null) {
            throw new IllegalArgumentException("OTP verification is required before password reset");
        }
        if (passwordResetOtp.getResetTokenExpiresAt() == null
                || passwordResetOtp.getResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
            passwordResetOtpRepository.delete(passwordResetOtp);
            throw new IllegalArgumentException("Reset token has expired");
        }
        if (!passwordEncoder.matches(request.getResetToken().trim(), passwordResetOtp.getResetTokenHash())) {
            throw new IllegalArgumentException("Invalid reset token");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        passwordResetOtpRepository.delete(passwordResetOtp);
        return new OtpMessageResponse("Password reset successful");
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
        String emailValue = request.getEmail();
        if (emailValue == null || emailValue.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        String email = Objects.requireNonNull(emailValue).trim().toLowerCase();
        int atIndex = email.indexOf('@');
        return atIndex > 0 ? email.substring(0, atIndex) : email;
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase();
    }

    private String generateOtp() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    private void sendOtpEmail(String to, String otp, String subject, String contextLine) {
        try {
            if (mailUsername == null || mailUsername.isEmpty() || mailPassword == null || mailPassword.isEmpty()) {
                log.warn("⚠️  Email configuration incomplete!");
                log.warn("  MAIL_USERNAME: {}", mailUsername != null && !mailUsername.isEmpty() ? "SET" : "NOT SET");
                log.warn("  MAIL_PASSWORD: {}", mailPassword != null && !mailPassword.isEmpty() ? "SET" : "NOT SET");
                log.warn("  Skipping email send to: {}", to);
                log.warn("  OTP (for testing): {}", otp);
                return; // Don't crash, just skip email
            }
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(
                    contextLine
                            + "\n\nOTP: " + otp
                            + "\nValid for " + otpExpiryMinutes + " minutes."
                            + "\nIf you did not initiate this request, please ignore this email."
            );
            mailSender.send(message);
            log.info("✅ OTP email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("❌ Failed to send OTP email to {}: {}", to, e.getMessage());
            log.error("Mail configuration - Username: {}, Password set: {}", 
                mailUsername != null && !mailUsername.isEmpty() ? "SET" : "NOT SET",
                mailPassword != null && !mailPassword.isEmpty() ? "YES" : "NO");
            log.debug("Email error details:", e);
            // Continue without failing - OTP is still stored in DB for verification
        }
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

        request.setEmail(normalizeEmail(request.getEmail()));
    }
}
