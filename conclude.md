# Project Revision Notes (Evaluation Ready)

This document is your quick revision sheet for the full `jobsportalgradle` backend: what each service does, main request/response contracts, and end-to-end flows (auth, discovery, cache, messaging, tracing, monitoring).

## 1) Big Picture Architecture

Client -> API Gateway (`8080`) -> Microservices

- `config-server` (`8888`): central config for all services.
- `discovery-server` (`8761`): Eureka service registry.
- `api-gateway` (`8080`): single entry point + JWT verification + route forwarding.
- `auth-service` (`8081`): register/login/OTP/password reset/users.
- `job-service` (`8082`): job creation/list/search.
- `application-service` (`8083`): apply to jobs and update application status.
- `admin-service` (`8084`): admin aggregated views/reports from other services.
- `notification-service` (`8085`): RabbitMQ consumers + email notifications.

Infra used:
- MySQL (auth_db, job_db, user_db)
- Redis (caching)
- RabbitMQ (async notifications)
- Zipkin (distributed tracing)
- Prometheus + Grafana (metrics dashboards)
- Loki + Promtail (central logs)
- SonarQube (static code quality)

---

## 2) Startup and Registration Flow (Very Important)

1. `config-server` starts and serves YAML config from `classpath:/config`.
2. `discovery-server` starts (it imports config from config-server).
3. Business services start (`auth/job/application/admin/notification/api-gateway`).
4. Each service registers itself in Eureka.
5. API Gateway routes by service name (`lb://AUTH-SERVICE`, etc.).

If this order breaks:
- services may not register in Eureka,
- gateway can show `No servers available for service ...`,
- API calls fail with 5xx.

---

## 3) API Gateway Role and Security Flow

Class: `services/api-gateway/src/main/java/com/jobportal/apigateway/security/JwtAuthGatewayFilter.java`

Gateway behavior:
- Allows unauthenticated only for paths starting with `/api/auth/`.
- For all other APIs, requires `Authorization: Bearer <jwt>`.
- Parses JWT and injects headers:
  - `X-User-Id`
  - `X-User-Email`
  - `X-User-Role`
- Downstream services use these headers for role checks.

So role authorization is mostly implemented in service controllers using `X-User-Role`.

---

## 4) Service-by-Service Revision

## 4.1 Auth Service (`/api/auth/**`)

What it does:
- Registration with OTP verification (direct register is disabled).
- Login + JWT token issuance.
- Forgot password OTP + reset token flow.
- Internal endpoints for other services (`/internal/users`, `/internal/users/emails`).
- Optional Cloudinary profile image upload.

Main endpoints:
- `POST /api/auth/register/request-otp` (JSON or multipart)
- `POST /api/auth/register/verify-otp`
- `POST /api/auth/login`
- `POST /api/auth/password/forgot/request-otp`
- `POST /api/auth/password/forgot/verify-otp`
- `POST /api/auth/password/reset`
- `GET /api/auth/internal/users`
- `GET /api/auth/internal/users/emails`
- `PUT /api/auth/profile/image` (multipart)

Typical login request:
```json
{
  "email": "user@gmail.com",
  "password": "userPassword"
}
```

Typical login response:
```json
{
  "token": "<jwt>",
  "userId": 12,
  "email": "user@gmail.com",
  "role": "JOB_SEEKER"
}
```

Notes:
- Passwords are BCrypt-hashed.
- OTP rows are temporary (used + deleted / expired + deleted).
- Bad credentials returns `400` with message `Invalid credentials`.

## 4.2 Job Service (`/api/jobs/**`)

What it does:
- Recruiter creates jobs.
- Public list/get/search jobs.
- Publishes `job.posted` event to RabbitMQ.

Endpoints:
- `POST /api/jobs` (requires recruiter role)
- `GET /api/jobs`
- `GET /api/jobs/{id}`
- `GET /api/jobs/search?title=&location=`

Create request:
```json
{
  "title": "Java Backend Developer",
  "companyName": "ABC Pvt Ltd",
  "location": "Pune",
  "salary": 1200000,
  "experience": 3,
  "description": "Spring Boot + Microservices"
}
```

Typical create response (example fields):
```json
{
  "id": 5,
  "title": "Java Backend Developer",
  "companyName": "ABC Pvt Ltd",
  "location": "Pune",
  "salary": 1200000,
  "experience": 3,
  "description": "Spring Boot + Microservices",
  "postedBy": 2,
  "recruiterId": 2,
  "createdAt": "2026-03-30T10:15:00"
}
```

## 4.3 Application Service (`/api/applications/**`)

What it does:
- Job seeker applies to jobs.
- Supports JSON resume URL or multipart resume upload to Cloudinary.
- Recruiter updates status.
- Publishes status event for shortlisted/selected.

Endpoints:
- `POST /api/applications` (JSON)
- `POST /api/applications` (multipart resume)
- `GET /api/applications/user`
- `GET /api/applications/job/{jobId}` (recruiter/admin)
- `PUT /api/applications/{id}/status?status=...` (recruiter)
- `PUT /api/applications/{id}/resume` (job seeker)

Apply JSON request:
```json
{
  "jobId": 5,
  "resumeUrl": "https://res.cloudinary.com/.../resume.pdf"
}
```

Status update examples:
- `APPLIED`
- `UNDER_REVIEW`
- `SHORTLISTED`
- `REJECTED`
- `SELECTED`

Business rules:
- Same user cannot apply to same job twice.
- If resumeUrl missing, returns `400`.
- Status `SHORTLISTED/SELECTED` triggers RabbitMQ notification event.

## 4.4 Admin Service (`/api/admin/**`)

What it does:
- Admin-only aggregate APIs.
- Reads users from auth-service, jobs from job-service.

Endpoints:
- `GET /api/admin/users`
- `GET /api/admin/jobs`
- `GET /api/admin/reports`

`/reports` response example:
```json
{
  "totalUsers": 20,
  "totalJobs": 8
}
```

## 4.5 Notification Service

What it does:
- Listens to RabbitMQ queues:
  - `job.notifications`
  - `application.notifications`
- Sends emails via SMTP.

Consumers:
- `onJobPosted(JobPostedEvent)` -> fetches all user emails (from auth-service) and broadcasts new-job email.
- `onApplicationStatusChanged(ApplicationStatusEvent)` -> sends status update email to specific candidate.

---

## 5) Main End-to-End Flows

## 5.1 Register + Login Flow

1. Client -> `POST /api/auth/register/request-otp`
2. Auth service stores hashed OTP in `registration_otps`.
3. Client -> `POST /api/auth/register/verify-otp`
4. Auth service creates user in `users` table.
5. Client -> `POST /api/auth/login`
6. Auth returns JWT.
7. Client uses JWT for all non-auth APIs.

## 5.2 Post Job + Notification Flow

1. Recruiter calls `POST /api/jobs` with JWT.
2. Gateway validates JWT and injects role/user headers.
3. Job service saves job in `job_db.jobs`.
4. Job service publishes event to exchange `notification.exchange` with routing key `job.posted`.
5. Notification service consumes from `job.notifications` queue.
6. Notification service sends emails to all users.

## 5.3 Apply Job + Status Update Flow

1. Job seeker calls `POST /api/applications` with JWT.
2. Gateway injects identity headers.
3. Application service saves row in `user_db.applications` with status `APPLIED`.
4. Recruiter calls `PUT /api/applications/{id}/status?status=SHORTLISTED`.
5. Application service updates DB and publishes `application.status.changed`.
6. Notification service consumes from `application.notifications` and emails candidate.

---

## 6) Redis: What and Why

Implemented in: `auth-service`, `job-service`, `admin-service`, `notification-service`.

---

## 7) CQRS + Pagination (Job Service)

Classes:
- `JobCommandService`: write side (`createJob`) + cache eviction + RabbitMQ publish
- `JobQueryService`: read side (`getAllJobs`, `getJob`, `search`, `searchPaged`) + Redis cache

Controller endpoint added:
- `GET /api/jobs/paged?page=0&size=10&title=java&location=pune`

Why interviewer-friendly:
- Clear read/write separation
- Easy to scale read operations independently
- Pagination prevents heavy full-table response payloads

---

## 8) Saga Optimization (Application Status)

When recruiter updates application status to `SHORTLISTED` or `SELECTED`:

1. Application row is updated in `applications` table.
2. Saga row is created in `application_status_saga` with state `PENDING`.
3. Event is published to RabbitMQ with `eventId` + `correlationId`.
4. If publish succeeds -> saga state `COMPLETED`.
5. If publish fails -> saga state `FAILED`, `retryCount` incremented, `lastError` stored.

Consumer-side protection:
- `notification-service` uses Redis `setIfAbsent` with `eventId` to avoid duplicate emails.

---

## 9) Config Server from Git Repo

`config-server` supports both:
- `native` profile (default, classpath config)
- `git` profile (GitHub repo as config source)

Environment variables for git mode:
- `CONFIG_SERVER_PROFILE=git`
- `CONFIG_GIT_URI=https://github.com/<org>/<repo>.git`
- `CONFIG_GIT_DEFAULT_LABEL=main`
- `CONFIG_GIT_USERNAME` / `CONFIG_GIT_PASSWORD` (if private repo)
- `CONFIG_GIT_CLONE_ON_START=true`

This lets you change credentials/configs in one Git repo without code rebuild.

Where caching is used:
- Auth:
  - cache user lists and emails (`authUsers`, `authUserEmails`)
  - evict on register/reset changes.
- Job:
  - cache job list/detail/search (`jobsAll`, `jobsById`, `jobsSearch`)
  - evict when new job is created.
- Admin:
  - cache aggregated `users/jobs/reports`.
- Notification:
  - cache fetched user email list (`notificationUserEmails`).

Why Redis is used:
- Reduce repeated DB/service calls for read-heavy endpoints.
- Faster response times.
- Lower load on MySQL and inter-service REST calls.
- Better scalability for demo and production-like behavior.

Important clarification:
- Redis is not used for every function.
- It is intentionally applied to expensive/repeated reads.
- Writes still go to main databases for consistency.

---

## 7) RabbitMQ: What and Why

Exchange/queues/routing:
- Exchange: `notification.exchange` (Direct)
- Queue: `job.notifications` <- routing key `job.posted`
- Queue: `application.notifications` <- routing key `application.status.changed`

Why RabbitMQ is used:
- Makes notifications asynchronous.
- User-facing API response is not blocked by email sending.
- Decouples producer services (`job/application`) from consumer (`notification-service`).

---

## 8) Zipkin: What and Why

Configuration key used by all services:
- `management.zipkin.tracing.endpoint` (default `http://localhost:9411/api/v2/spans`)

What it gives:
- A trace id across gateway + downstream services for one request.
- Helps debug 401/403/500 path across services.
- Helps identify latency hotspots.

If Zipkin is down:
- You see connection-refused warnings in logs,
- core business APIs still continue to work.

---

## 9) Prometheus, Grafana, Loki, SonarQube (Revision)

Prometheus:
- Scrapes `/actuator/prometheus` from services.
- Stores metrics time-series.

Grafana:
- Visualizes Prometheus metrics.
- Also uses Loki datasource for logs.

Loki + Promtail:
- Promtail ships logs to Loki.
- In Grafana Explore, use LogQL to inspect cross-service logs.

SonarQube:
- Static analysis for bugs, smells, maintainability.
- Gradle plugin configured in root `build.gradle`.
- Task available: `sonar`.

---

## 10) Common HTTP Status Meaning in This Project

- `200`: successful request.
- `400`: validation/business error (e.g., invalid credentials, duplicate apply, bad OTP).
- `401`: missing/invalid JWT at gateway.
- `403`: JWT valid but role is not allowed for endpoint.
- `500`: unhandled exception (global exception handler returns `Unexpected error occurred`).

---

## 11) Quick Viva Checklist (Tomorrow)

1. Explain startup order: Config -> Discovery -> business services -> Gateway.
2. Explain JWT path: login -> token -> gateway validates -> inject headers -> service role checks.
3. Show one recruiter flow: create job -> RabbitMQ event -> notification emails.
4. Show one job seeker flow: apply job -> status update -> candidate notification.
5. Explain Redis use with exact cache names and eviction points.
6. Explain Zipkin vs Prometheus: trace path vs metric trends.
7. Explain why async messaging is needed (non-blocking user APIs).
8. Mention cloud uploads: profile image in auth, resume in application.

---

## 12) Ready-Made Demo API Sequence (Gateway)

1) Register OTP request (JSON)
```json
POST /api/auth/register/request-otp
{
  "name": "Demo User",
  "email": "demo.user@gmail.com",
  "password": "Demo@123",
  "role": "JOB_SEEKER",
  "phone": "9999999999"
}
```

2) Verify OTP
```json
POST /api/auth/register/verify-otp
{
  "email": "demo.user@gmail.com",
  "otp": "123456"
}
```

3) Login
```json
POST /api/auth/login
{
  "email": "demo.user@gmail.com",
  "password": "Demo@123"
}
```

4) Use returned token in `Authorization: Bearer <token>` for:
- `GET /api/jobs`
- `POST /api/applications`

---

## 13) Final One-Line Conclusion for Evaluation

This project is a production-style microservices backend where gateway-secured APIs are service-discovered via Eureka, centrally configured via Config Server, optimized with Redis caching, decoupled with RabbitMQ async events, and fully observable through Zipkin traces, Prometheus/Grafana metrics, and Loki logs.

