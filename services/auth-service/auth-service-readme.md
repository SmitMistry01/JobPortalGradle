# Auth Service - Detailed Documentation

The **Auth Service** is a central microservice for the Job Portal platform. It is responsible for user identity management, authentication operations, email verifications, and securing credentials. It uses JSON Web Tokens (JWT) for stateless authentication.

This document breaks down the design and code specifics of the major components powering the service.

---

## 1. Controller Layer (`AuthController.java`)
This is a Spring `@RestController` the acts as the entry point for authentication and user profile APIs.

### The Registration Anti-Pattern Block
To ensure systems integrity and verify emails, the simple `/register` endpoint throws an `HttpStatus.GONE`. It enforces that the frontend *must* use the robust 2-step OTP flow (`/register/request-otp` and `/register/verify-otp`) instead of allowing raw creation of users directly:

```java
@PostMapping("/register")
public ResponseEntity<OtpMessageResponse> register(@RequestBody RegisterRequest request) {
    return ResponseEntity.status(HttpStatus.GONE)
            .body(new OtpMessageResponse("Direct registration is disabled. Use /api/auth/register/request-otp and /api/auth/register/verify-otp"));
}
```

### Profile Images with `MultipartFile`
The controller explicitly breaks out fields when handling profile image uploads through the `consumes = MediaType.MULTIPART_FORM_DATA_VALUE`. 
```java
@PostMapping(value = "/register/request-otp", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<OtpMessageResponse> requestRegistrationOtpWithProfileImage(
        @RequestParam String name,
        @RequestParam String email,
        @RequestParam String password,
        @RequestPart(name = "profileImage", required = false) MultipartFile profileImage
) {
    // ... Maps params to DTO and passes to service
}
```

---

## 2. Business Logic Layer (`AuthService.java`)
This handles the heavy lifting, security encoding, caching, and state transitions.

### OTP Generation & Cryptography
Uses `SecureRandom` to prevent predictable OTP generation. It stores the generated OTP encoded into the Database using `passwordEncoder.encode(otp)` so that even database admins cannot see the raw OTP dispatched via Email.

```java
// Securing the OTP inside requestRegistrationOtp()
String otp = String.format("%06d", secureRandom.nextInt(1_000_000));
RegistrationOtp registrationOtp = registrationOtpRepository.findByEmail(normalizedEmail)
        .orElseGet(RegistrationOtp::new);

// ... populating user details
registrationOtp.setOtpHash(passwordEncoder.encode(otp)); // Safely stored as BCrypt Hash
```

### The Role Resolver
The method `resolveRegistrationRole` restricts users from trying to maliciously assign themselves as `ADMIN`.
```java
private Role resolveRegistrationRole(Role requestedRole) {
    if (requestedRole == null) {
        return Role.JOB_SEEKER;
    }
    if (requestedRole == Role.ADMIN) {
        throw new IllegalArgumentException("Admin registration is not allowed");
    }
    return requestedRole;
}
```

### Redis Caching Magic
It makes beautiful use of Spring `@Caching` annotations. When a new user completes registration or updates their profile, the method triggers a cache eviction. This automatically tells Redis to flush its cache so the other microservices get the absolute most up-to-date user lists.

```java
@Caching(evict = {
        @CacheEvict(cacheNames = "authUsers", allEntries = true),
        @CacheEvict(cacheNames = "authUserEmails", allEntries = true)
})
public UserResponse verifyRegistrationOtp(VerifyRegistrationOtpRequest request) {
    // ... validates OTP, creates primary User record in MySQL, deletes RegistrationOtp record
}
```

---

## 3. JWT Token Generation (`JwtService.java`)
Tokens are generated using `io.jsonwebtoken`. Once a user has successfully logged in, this service signs a token that contains their fundamental identity to be read by the API Gateway and other microservices.

```java
public String generateToken(User user) {
    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    Instant now = Instant.now();

    return Jwts.builder()
            .subject(user.getId().toString())              // ID used for downstream queries
            .claim("email", user.getEmail())                 // Email Claim
            .claim("role", user.getRole().name())            // Crucial Role Claim (JOB_SEEKER vs EMPLOYER)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusMillis(expirationMs)))
            .signWith(key)
            .compact();
}
```

---

## 4. Security Configuration (`SecurityConfig.java`)
Spring Security acts as a massive filter for web requests. Since this is an uncoupled microservice architecture, the **API Gateway** assumes the role of strict token validation rather than this individual backend logic. 

As a result, your security config overrides the standard restrictive behavior:

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable()) // Disabled for stateless APIs
            .authorizeHttpRequests(authorize -> authorize.anyRequest().permitAll()) // Permit all incoming requests
            .httpBasic(Customizer.withDefaults());
    return http.build();
}

@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(); // Globally defined bean utilized by AuthService
}
```

---

## 5. Password Reset Flow Architecture
The forgotten password code isn't just one method—it's a synchronized state transition to prevent hacking, mapped to three specific functions in `AuthService.java`:

1. **`requestForgotPasswordOtp`:** Checks the `UserRepository` to ensure the email exists. Saves a `PasswordResetOtp` record tying that email to an OTP hash.
2. **`verifyForgotPasswordOtp`:** Decodes the incoming OTP. If it matches, the clever part happens—it *doesn't* reset the password here. Instead, it flags `setVerified(true)`, generates a massive random `UUID` string (`resetToken`), saves it to the OTP row, and replies with it.
   ```java
   String resetToken = UUID.randomUUID().toString();
   passwordResetOtp.setVerified(true);
   passwordResetOtp.setResetTokenHash(passwordEncoder.encode(resetToken));
   // ... returns the raw UUID to the user
   ```
3. **`resetPassword`:** Your client must then send that UUID `resetToken` *AND* the `newPassword` inside the final `/password/reset` call. The system validates the token against the `resetTokenHash` and finalizes the password reset, preventing any immediate brute forcing based purely on 6-digit OTPs.

---

## Application Properties
Crucial configurations heavily depend on environmental properties (such as `.env` files fed to `docker-compose.yml` or Spring Cloud Config):

```yaml
auth:
  otp:
    expiry-minutes: ${AUTH_OTP_EXPIRY_MINUTES:10}
    max-attempts: ${AUTH_OTP_MAX_ATTEMPTS:5}
  reset-token:
    expiry-minutes: ${AUTH_RESET_TOKEN_EXPIRY_MINUTES:15}
```
*Note: A lack of `SPRING_MAIL_HOST`, `SPRING_MAIL_USERNAME`, and `SPRING_MAIL_PASSWORD` variables will hard-crash the email dispatching sequence when `JavaMailSender` reaches out to the SMTP server limit.*
