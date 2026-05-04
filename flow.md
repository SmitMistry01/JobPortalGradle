# Frontend -> Backend -> Database Flow

This document explains how requests move from the React frontend to Spring Boot microservices and finally to MySQL in this project.

## 1) High-Level Architecture

```text
React (Vite + RTK Query)
   |
   | HTTP (Bearer JWT)
   v
API Gateway (Spring Cloud Gateway, port 8080)
   |
   | Route by path (/api/auth/**, /api/jobs/**, /api/applications/**)
   | + JWT validation + user headers
   v
Auth Service / Job Service / Application Service
   |
   | Spring Data JPA repositories
   v
MySQL databases (auth_db, job_db, user_db)
```

## 2) Frontend Wiring

### Entry point and providers

`frontend/src/main.tsx`

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)
```

- `Provider` gives Redux store access.
- `RouterProvider` gives route/page navigation.
- `ThemeProvider` controls UI theme.

### Store + API middleware

`frontend/src/app/store.ts`

```ts
export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
})
```

- `auth` slice stores token/user.
- RTK Query middleware executes API calls and caching.

### Base API client

`frontend/src/services/baseApi.ts`

```ts
const DEFAULT_API_BASE_URL = '/api'

baseQuery: fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = state.auth.token ?? localStorage.getItem('jp_token')
    if (isLikelyJwt(token)) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})
```

- All feature APIs share this base client.
- In local development, Vite proxies `/api` to `http://localhost:8080`.
- JWT is automatically attached as `Authorization: Bearer <token>`.
- Multipart requests are handled by stripping manual `Content-Type` so browser sets boundary correctly.

## 3) How Frontend Calls Backend Endpoints

### Auth endpoints (frontend)

`frontend/src/features/auth/authApi.ts`

```ts
requestRegistrationOtp: builder.mutation({
  query: (body) => ({ url: '/auth/register/request-otp', method: 'POST', body }),
}),
verifyRegistrationOtp: builder.mutation({
  query: (body) => ({ url: '/auth/register/verify-otp', method: 'POST', body }),
}),
login: builder.mutation({
  query: (body) => ({ url: '/auth/login', method: 'POST', body }),
}),
```

With base URL ending in `/api`, frontend requests become:
- `POST /api/auth/register/request-otp`
- `POST /api/auth/register/verify-otp`
- `POST /api/auth/login`

### Jobs endpoints (frontend)

`frontend/src/features/jobs/jobsApi.ts`

```ts
getJobs: builder.query({
  query: (filters) => ({ url: '/jobs/search', params: sanitizeFilters(filters) }),
}),
createJob: builder.mutation({
  query: (body) => ({ url: '/jobs', method: 'POST', body }),
}),
```

### Application endpoints (frontend)

`frontend/src/features/applications/applicationsApi.ts`

```ts
applyWithResume: builder.mutation({
  query: ({ jobId, resume }) => {
    const formData = new FormData()
    formData.append('jobId', String(jobId))
    formData.append('resume', resume)
    return { url: '/applications', method: 'POST', body: formData }
  },
}),
```

## 4) Gateway Layer (Routing + Security)

### Route mapping

`services/config-server/src/main/resources/config/api-gateway.yml`

```yml
spring:
  cloud:
    gateway:
      routes:
        - id: auth-service
          uri: lb://AUTH-SERVICE
          predicates:
            - Path=/api/auth/**
        - id: job-service
          uri: lb://JOB-SERVICE
          predicates:
            - Path=/api/jobs/**
        - id: application-service
          uri: lb://APPLICATION-SERVICE
          predicates:
            - Path=/api/applications/**
```

- Gateway selects service by URL path.
- `lb://...` means service discovery/load balancing via Eureka.

### JWT validation and identity propagation

`services/api-gateway/src/main/java/com/jobportal/apigateway/security/JwtAuthGatewayFilter.java`

```java
if (path.startsWith("/api/auth/") || path.startsWith("/fallback/") || path.startsWith("/actuator/")) {
    return chain.filter(exchange);
}

String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
// ... parse JWT claims ...
ServerHttpRequest request = exchange.getRequest().mutate()
    .header("X-User-Id", claims.getSubject())
    .header("X-User-Email", claims.get("email", String.class))
    .header("X-User-Role", claims.get("role", String.class))
    .build();
```

- Auth endpoints are open for login/register.
- Other paths require valid JWT.
- Gateway injects `X-User-*` headers used by downstream services for authorization/business logic.

## 5) Backend Service -> Database Flow

## A) Login flow (auth-service)

1. Frontend calls `POST /api/auth/login`.
2. Gateway routes to `AUTH-SERVICE`.
3. Controller delegates to service.
4. Service queries user from DB and validates password.

Controller:

`services/auth-service/src/main/java/com/jobportal/authservice/controller/AuthController.java`

```java
@PostMapping("/login")
public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
    return ResponseEntity.ok(authService.login(request));
}
```

Service:

`services/auth-service/src/main/java/com/jobportal/authservice/service/AuthService.java`

```java
public AuthResponse login(LoginRequest request) {
    User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
        throw new IllegalArgumentException("Invalid credentials");
    }

    String token = jwtService.generateToken(user);
    return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole().name());
}
```

Repository:

`services/auth-service/src/main/java/com/jobportal/authservice/repository/UserRepository.java`

```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

## B) Create/list jobs flow (job-service)

Controller:

`services/job-service/src/main/java/com/jobportal/jobservice/controller/JobController.java`

```java
@PostMapping
public ResponseEntity<Job> createJob(@RequestBody CreateJobRequest request,
                                     @RequestHeader("X-User-Role") String role,
                                     @RequestHeader("X-User-Id") Long userId) {
    if (!hasRole(role, "RECRUITER")) {
        return ResponseEntity.status(403).build();
    }
    return ResponseEntity.ok(jobCommandService.createJob(request, userId));
}

@GetMapping("/search")
public ResponseEntity<List<Job>> search(...) {
    return ResponseEntity.ok(jobQueryService.search(...));
}
```

Repository:

`services/job-service/src/main/java/com/jobportal/jobservice/repository/JobRepository.java`

```java
public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {
    List<Job> findByRecruiterIdOrderByCreatedAtDesc(Long recruiterId);
}
```

## C) Apply with resume flow (application-service)

Controller accepts multipart resume and user headers from gateway:

`services/application-service/src/main/java/com/jobportal/applicationservice/controller/ApplicationController.java`

```java
@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<JobApplication> applyWithResume(
        @RequestParam Long jobId,
        @RequestPart("resume") MultipartFile resume,
        @RequestHeader("X-User-Id") Long userId,
        @RequestHeader("X-User-Email") String userEmail,
        @RequestHeader("X-User-Role") String role
) {
    if (!hasRole(role, "JOB_SEEKER")) {
        return ResponseEntity.status(403).build();
    }
    return ResponseEntity.ok(service.applyWithResume(jobId, resume, userId, userEmail));
}
```

Domain service uploads file to Cloudinary, then saves application to DB:

`services/application-service/src/main/java/com/jobportal/applicationservice/service/ApplicationDomainService.java`

```java
public JobApplication applyWithResume(Long jobId, MultipartFile resume, Long userId, String userEmail) {
    ApplyJobRequest request = new ApplyJobRequest();
    request.setJobId(jobId);
    request.setResumeUrl(cloudinaryResumeService.uploadResume(resume));
    return apply(request, userId, userEmail);
}

public JobApplication apply(ApplyJobRequest request, Long userId, String userEmail) {
    if (repository.existsByUserIdAndJobId(userId, request.getJobId())) {
        throw new IllegalArgumentException("You already applied for this job");
    }
    JobApplication application = new JobApplication();
    application.setUserId(userId);
    application.setJobId(request.getJobId());
    application.setResumeUrl(request.getResumeUrl());
    application.setUserEmail(userEmail);
    application.setStatus(ApplicationStatus.APPLIED);
    return repository.save(application);
}
```

Repository:

`services/application-service/src/main/java/com/jobportal/applicationservice/repository/JobApplicationRepository.java`

```java
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    boolean existsByUserIdAndJobId(Long userId, Long jobId);
    List<JobApplication> findByUserId(Long userId);
    List<JobApplication> findByJobId(Long jobId);
}
```

## 6) Database Connections and Schema Mapping

### Service datasource config

- Auth service -> `auth_db`
  - `services/config-server/src/main/resources/config/auth-service.yml`
  - `spring.datasource.url: .../auth_db`

- Job service -> `job_db`
  - `services/config-server/src/main/resources/config/job-service.yml`
  - `spring.datasource.url: .../job_db`

- Application service -> `user_db`
  - `services/config-server/src/main/resources/config/application-service.yml`
  - `spring.datasource.url: .../user_db`

### DB creation script

`infrastructure/mysql-init/01-create-databases.sql`

```sql
CREATE DATABASE IF NOT EXISTS auth_db;
CREATE DATABASE IF NOT EXISTS job_db;
CREATE DATABASE IF NOT EXISTS user_db;
```

## 7) End-to-End Example Sequence (Register + Login + Apply)

1. **Register OTP request** from frontend (`authApi.requestRegistrationOtp`) to `POST /api/auth/register/request-otp`.
2. **Gateway route** sends to auth-service (`Path=/api/auth/**`).
3. **Auth service** stores OTP record in DB (`registration_otps`) via JPA repository.
4. **Verify OTP** creates user in `auth_db.users`.
5. **Login** returns JWT token.
6. Frontend stores token in Redux + localStorage (`authSlice.setCredentials`).
7. **Apply with resume** sends multipart to `POST /api/applications`.
8. Gateway validates JWT, injects `X-User-Id/X-User-Email/X-User-Role`.
9. Application service uploads resume URL and persists application in MySQL.

---

If you want, I can also add a second document `flow-sequence.mmd` with Mermaid sequence diagrams for login, job posting, and apply-with-resume so you can render diagrams directly in Markdown viewers.

