# Job Portal Backend (Spring Boot Microservices, Gradle, JDK 21)

This is a complete backend for a Job Portal System using Spring Boot microservices, service discovery, centralized configuration, API Gateway, JWT authentication, Redis caching, RabbitMQ, Zipkin tracing, Prometheus/Grafana/Loki monitoring, SonarQube code-quality analysis, and Gmail SMTP notifications.

## Services

- `config-server` (port `8888`)
- `discovery-server` / Eureka (port `8761`)
- `api-gateway` (port `8080`)
- `auth-service` (port `8081`)
- `job-service` (port `8082`)
- `application-service` (port `8083`)
- `admin-service` (port `8084`)
- `notification-service` (port `8085`)

## Architecture

`Frontend -> API Gateway -> Microservices`

1. `auth-service` handles register/login and JWT generation
2. `job-service` handles recruiter job posting and search
3. `application-service` handles applying and status updates
4. `admin-service` provides admin views/reports
5. `notification-service` consumes RabbitMQ events and sends emails

Service registration and routing are handled with Eureka + Gateway.

## Tech Stack

- Java 21
- Spring Boot 3.3.x
- Spring Cloud 2023.x
- Gradle multi-module
- MySQL
- Redis
- RabbitMQ
- Zipkin
- Prometheus
- Grafana
- Loki
- SonarQube
- Gmail SMTP

## Databases (MySQL)

Configured database names:

- `auth-service` -> `auth_db`
- `application-service` -> `user_db`
- `job-service` -> `job_db`
- `admin_db` and `notification_db` are already created by you and kept available for future extensions

MySQL credentials used in config:

- username: `root`
- password: `smit`

## External Dependencies

Before running services, start:

1. **MySQL** (with your databases created)
2. **RabbitMQ** on default port `5672`

## Quick Start (Windows PowerShell 5.1)

Run from project root `C:\Users\smitm\Downloads\jobsportalgradle`.

### Preflight (run once)

```powershell
java -version
docker --version
docker compose version
.\gradlew --version
```

Expected: Java 21 and Gradle wrapper output should work.

### Start all services (new window per service)

```powershell
powershell -ExecutionPolicy Bypass -File .\infrastructure\start-local.ps1
```

### Stop all services

```powershell
powershell -ExecutionPolicy Bypass -File .\infrastructure\stop-local.ps1
```

### Notes

- Use `powershell.exe`, not `pwsh`, if `pwsh` is not installed.
- Correct Gradle module is `discovery-server` (not `eureka-server`).
- Eureka dashboard: `http://localhost:8761`
- API Gateway: `http://localhost:8080`

### Validate Eureka host fix

This checks that `SMIT.mshome.net` is no longer present in registry data:

```powershell
(Invoke-RestMethod 'http://localhost:8761/eureka/apps' | ConvertTo-Json -Depth 20) | Select-String 'SMIT\.mshome\.net'
```

If command returns no output, hostname resolution issue is fixed.

### Manual startup (single terminal option)

If you want to run service-by-service manually, use this order and commands:

```powershell
.\gradlew :services:config-server:bootRun
.\gradlew :services:discovery-server:bootRun
.\gradlew :services:auth-service:bootRun
.\gradlew :services:job-service:bootRun
.\gradlew :services:application-service:bootRun
.\gradlew :services:admin-service:bootRun
.\gradlew :services:notification-service:bootRun
.\gradlew :services:api-gateway:bootRun
```

Open each command in a separate terminal window if you run all at once.

### Health checks after startup

```powershell
Invoke-WebRequest http://localhost:8888/actuator/health -UseBasicParsing
Invoke-WebRequest http://localhost:8761 -UseBasicParsing
Invoke-WebRequest http://localhost:8080/actuator/health -UseBasicParsing
```

If these pass, test API routing via gateway:

```powershell
Invoke-WebRequest http://localhost:8080/api/jobs -UseBasicParsing
```

## Docker (single command run)

### Start everything

```powershell
docker compose up --build -d
```

On first run, MySQL auto-creates `auth_db`, `job_db`, and `user_db` from `infrastructure/mysql-init/01-create-databases.sql`.

### Check status

```powershell
docker compose ps
docker compose logs -f api-gateway
docker compose logs -f discovery-server
```

### Infra dashboards

- Eureka: `http://localhost:8761`
- Zipkin: `http://localhost:9411`
- Prometheus: `http://localhost:9090`
- Loki: `http://localhost:3100/ready`
- Grafana: `http://localhost:3000` (default login: `admin` / `admin`)
- SonarQube: `http://localhost:9000`

## What Is Implemented and Why

### 1) Redis Caching (implemented)

**What was added**

- `spring-boot-starter-cache` and `spring-boot-starter-data-redis` in business services using cache
- Redis cache config with JSON serializer for safer object serialization
- Cache annotations in:
  - `job-service` (`getAllJobs`, `getJob`, `search`, evict on `createJob`)
  - `auth-service` (`getAllUsers`, `getAllUserEmails`, evict on `register`)
  - `admin-service` (`users`, `jobs`, `reports`)
  - `notification-service` (cached email list fetch via `AuthUserEmailService`)

**Why**

- Reduces repeated DB and cross-service read load
- Improves response latency for high-read endpoints
- Keeps write paths simple and data freshness controlled by TTL + targeted evictions

### 2) Distributed Tracing with Zipkin (implemented)

**What was added**

- Tracing dependencies in all services:
  - `io.micrometer:micrometer-tracing-bridge-brave`
  - `io.zipkin.reporter2:zipkin-reporter-brave`
- Zipkin endpoint configuration in centralized Config Server files
- Local fallback tracing configuration in service-local `application.yml` files
- `zipkin` service in `docker-compose.yml`

**Why**

- Lets you follow one request across gateway + downstream microservices
- Makes root-cause analysis faster for `401/403/500` and latency issues
- Improves observability of async flows (RabbitMQ producer/consumer chains)

### 3) Metrics + Dashboards (Prometheus + Grafana) (implemented)

**What was added**

- `io.micrometer:micrometer-registry-prometheus` in all services
- Actuator exposure for `health`, `info`, `prometheus`
- `prometheus` service with scrape config (`infrastructure/prometheus/prometheus.yml`)
- `grafana` service with provisioned Prometheus datasource

**Why**

- Prometheus stores service metrics over time (RPS, latency, JVM, errors)
- Grafana visualizes trends and helps capacity/performance tuning
- Complements Zipkin: metrics show *what* is wrong; traces show *where*

### 3.1) Centralized Logs with Loki + Promtail (implemented)

**What was added**

- `loki` and `promtail` services in `docker-compose.yml`
- Loki datasource provisioning for Grafana in `infrastructure/grafana/provisioning/datasources/loki.yml`
- Promtail config files:
  - `infrastructure/promtail/promtail-docker.yml` (Docker logs + optional host log files)
  - `infrastructure/promtail/promtail-windows.yml` (Windows host log files)
- File logging configured per service via Config Server (`logging.file.name: logs/<service>.log`)

**Why**

- Lets you search logs across all services from Grafana Explore using LogQL
- Makes debugging `401/403/500` easier by correlating logs with Prometheus metrics and Zipkin traces
- Supports both Docker-based and localhost service runs

### 4) SonarQube (implemented)

**What was added**

- SonarQube + PostgreSQL services in `docker-compose.yml`
- Root Gradle Sonar plugin in `build.gradle`

**Why**

- Continuous static analysis for bugs, code smells, maintainability and security hotspots
- Gives quality gates before merges/releases

### 5) Cloudinary Uploads (implemented)

**What was added**

- `auth-service`: multipart OTP registration request support on `POST /api/auth/register/request-otp` for optional `profileImage`
- `application-service`: multipart apply support on `POST /api/applications` for resume file upload
- Cloudinary config keys in Config Server:
  - `cloudinary.cloud-name`
  - `cloudinary.api-key`
  - `cloudinary.api-secret`
  - folders under `cloudinary.folders.*`

**Why**

- Avoids storing image/resume binary data inside service databases
- Gives stable hosted URLs for profile images and resumes
- Keeps existing JSON APIs backward-compatible while enabling file uploads

### 6) CQRS + Pagination + Saga (implemented)

**CQRS in `job-service`**

- Write path uses `JobCommandService` (`createJob` + cache eviction + event publish)
- Read path uses `JobQueryService` (list/get/search + Redis caching)
- New paginated endpoint: `GET /api/jobs/paged?page=0&size=10&title=java&location=pune`

**Why**

- Read/write responsibilities are separated for easier optimization
- Pagination avoids loading large job lists in one response
- Read-heavy traffic benefits from Redis cache without complicating write logic

**Saga optimization in `application-service`**

- `updateStatus` now creates a saga record (`application_status_saga`) with `PENDING`
- On successful RabbitMQ publish, state becomes `COMPLETED`
- On publish failure, state becomes `FAILED` with retry metadata for debugging/replay
- Event includes `eventId` and `correlationId`

**Idempotent consumer in `notification-service`**

- Deduplicates status-notification events by `eventId` using Redis (`setIfAbsent` with TTL)
- Prevents duplicate emails on retries/redeliveries

### 7) Config Server from GitHub repo (implemented)

`config-server` now supports Git-backed configuration via environment variables.

Default remains `native` (local classpath config). Switch to Git with:

```powershell
$env:CONFIG_SERVER_PROFILE="git"
$env:CONFIG_GIT_URI="https://github.com/<your-org>/<your-config-repo>.git"
$env:CONFIG_GIT_DEFAULT_LABEL="main"
$env:CONFIG_GIT_USERNAME="<optional-username>"
$env:CONFIG_GIT_PASSWORD="<personal-access-token-or-password>"
$env:CONFIG_GIT_CLONE_ON_START="true"
```

Then start `config-server` and verify:

```powershell
Invoke-WebRequest http://localhost:8888/actuator/health -UseBasicParsing
Invoke-WebRequest http://localhost:8888/auth-service/default -UseBasicParsing
```

### Cloudinary setup for local run

Set these in your terminal before starting services (or set as system environment variables):

```powershell
$env:CLOUDINARY_CLOUD_NAME="<your-cloud-name>"
$env:CLOUDINARY_API_KEY="<your-api-key>"
$env:CLOUDINARY_API_SECRET="<your-api-secret>"
```

### Cloudinary API test commands

Request registration OTP with profile image:

```powershell
curl.exe -X POST "http://localhost:8080/api/auth/register/request-otp" `
  -F "name=User One" `
  -F "email=user1@example.com" `
  -F "password=password123" `
  -F "role=JOB_SEEKER" `
  -F "phone=9999999999" `
  -F "profileImage=@C:/path/to/profile.png"
```

Apply for a job with resume upload:

```powershell
curl.exe -X POST "http://localhost:8080/api/applications" `
  -H "Authorization: Bearer <JOB_SEEKER_JWT>" `
  -F "jobId=5" `
  -F "resume=@C:/path/to/resume.pdf"
```

Replace logged-in user's profile image:

```powershell
curl.exe -X PUT "http://localhost:8080/api/auth/profile/image" `
  -H "Authorization: Bearer <JWT>" `
  -F "profileImage=@C:/path/to/new-profile.png"
```

Replace a job seeker's own application resume:

```powershell
curl.exe -X PUT "http://localhost:8080/api/applications/13/resume" `
  -H "Authorization: Bearer <JOB_SEEKER_JWT>" `
  -F "resume=@C:/path/to/new-resume.pdf"
```

## Observability & Quality Quick Start

### 1) Start infrastructure only

```powershell
docker compose up -d mysql rabbitmq redis zipkin prometheus loki promtail grafana sonar-db sonarqube
```

### 2) Start microservices (local)

```powershell
powershell -ExecutionPolicy Bypass -File .\infrastructure\start-local.ps1
```

### 3) Generate sample traffic

```powershell
Invoke-RestMethod "http://localhost:8080/api/jobs"
Invoke-RestMethod "http://localhost:8080/api/jobs/search?title=java&location=pune"
```

### 4) Validate telemetry endpoints

```powershell
Invoke-WebRequest "http://localhost:8080/actuator/prometheus" -UseBasicParsing
Invoke-WebRequest "http://localhost:9090/-/healthy" -UseBasicParsing
Invoke-WebRequest "http://localhost:3100/ready" -UseBasicParsing
Invoke-WebRequest "http://localhost:9411/zipkin/" -UseBasicParsing
```

### Loki in Grafana (logs)

1. Open Grafana: `http://localhost:3000`
2. Go to **Explore**
3. Select datasource **Loki**
4. Try these queries:

```logql
{job="docker"}
{service="api-gateway"}
{service="application-service"} |= "ERROR"
```

If you run services on localhost (not in Docker), Promtail also scrapes `logs/*.log` through the `host-log-files` job.

### Optional: run Loki and Promtail without docker compose

```powershell
docker run -d --name loki -p 3100:3100 -v ${PWD}/infrastructure/loki/loki-config.yml:/etc/loki/loki-config.yml grafana/loki:3.1.1 -config.file=/etc/loki/loki-config.yml
docker run -d --name promtail -v ${PWD}/infrastructure/promtail/promtail-docker.yml:/etc/promtail/promtail.yml -v ${PWD}/logs:/host-logs:ro -v /var/run/docker.sock:/var/run/docker.sock:ro grafana/promtail:3.1.1 -config.file=/etc/promtail/promtail.yml
```

### 5) Run Sonar analysis

```powershell
# first login at http://localhost:9000 and create a token
$env:SONAR_HOST_URL="http://localhost:9000"
$env:SONAR_TOKEN="<YOUR_SONAR_TOKEN>"
.\gradlew sonarqube -Dsonar.token=$env:SONAR_TOKEN
```
### Stop everything

```powershell
docker compose down
```

### Reset containers + volumes (fresh DB)

```powershell
docker compose down -v
```

## Common Errors and Fixes

### 1) `pwsh` not found

Use `powershell.exe` commands/scripts (already used in `infrastructure/start-local.ps1`).

### 2) `UnknownHostException: SMIT.mshome.net`

Restart in correct order (`config-server` first, `discovery-server` second), then restart all business services so they re-register in Eureka.

### 3) `bootRun` exits with code 1

Check logs for first failure line, then verify:

- MySQL is running on `3306`
- RabbitMQ is running on `5672`
- Config Server is reachable on `8888`
- Discovery Server is reachable on `8761`

Quick port check:

```powershell
netstat -ano | findstr ":8888 :8761 :8080 :3306 :5672"
```

### 4) Clean restart

```powershell
powershell -ExecutionPolicy Bypass -File .\infrastructure\stop-local.ps1
.\gradlew --stop
.\gradlew clean
powershell -ExecutionPolicy Bypass -File .\infrastructure\start-local.ps1
```

## Run in IntelliJ IDEA (Alternative)

### 1) Open project

- Open folder: `jobsportalgradle`
- Let IntelliJ import Gradle project
- Ensure project SDK = **JDK 21**

### 2) Start services in this order

1. `ConfigServerApplication`
2. `DiscoveryServerApplication`
3. `ApiGatewayApplication`
4. `AuthServiceApplication`
5. `JobServiceApplication`
6. `ApplicationServiceApplication`
7. `AdminServiceApplication`
8. `NotificationServiceApplication`

### 3) Verify Eureka registrations

Open: `http://localhost:8761`

You should see:

- `API-GATEWAY`
- `AUTH-SERVICE`
- `JOB-SERVICE`
- `APPLICATION-SERVICE`
- `ADMIN-SERVICE`
- `NOTIFICATION-SERVICE`

## Auth & JWT

- Public endpoints:
	- `POST /api/auth/register/request-otp`
	- `POST /api/auth/register/verify-otp`
	- `POST /api/auth/login`
	- `POST /api/auth/password/forgot/request-otp`
	- `POST /api/auth/password/forgot/verify-otp`
	- `POST /api/auth/password/reset`
- All other gateway routes require `Authorization: Bearer <token>`
- Gateway validates JWT and forwards:
	- `X-User-Id`
	- `X-User-Email`
	- `X-User-Role`
- Direct `POST /api/auth/register` is intentionally disabled in strict mode and returns `410 Gone`.

## Required Headers (Important)

### 1) Public auth APIs (No JWT needed)

For OTP registration, login, and forgot-password APIs, send only:

- `Content-Type: application/json`

Do **not** send `Authorization` for these public auth endpoints.

### 2) Protected APIs (JWT needed)

For all other APIs (`/api/jobs/**`, `/api/applications/**`, `/api/admin/**`), send:

- `Content-Type: application/json`
- `Authorization: Bearer <JWT_TOKEN_FROM_LOGIN>`

Do **not** manually send `X-User-Id`, `X-User-Email`, `X-User-Role`; API Gateway adds them automatically after validating JWT.

## Quick API Test Commands

### Registration (strict OTP flow)

```bash
curl --location 'http://localhost:8080/api/auth/register/request-otp' \
--header 'Content-Type: application/json' \
--data-raw '{
	"name": "User One",
	"email": "user1@example.com",
	"username": "user1",
	"password": "password123",
	"role": "JOB_SEEKER",
	"phone": "9999999999"
}'
```

Check your email and verify OTP:

```bash
curl --location 'http://localhost:8080/api/auth/register/verify-otp' \
--header 'Content-Type: application/json' \
--data-raw '{
	"email": "user1@example.com",
	"otp": "123456"
}'
```

Direct register is disabled (expected `410 Gone`):

```bash
curl --location 'http://localhost:8080/api/auth/register' \
--header 'Content-Type: application/json' \
--data-raw '{
	"name": "User One",
	"email": "user1@example.com",
	"password": "password123"
}'
```

### Login

```bash
curl --location 'http://localhost:8080/api/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
	"email": "user1@example.com",
	"password": "password123"
}'
```

Copy `token` from login response.

### Protected Example (Get Jobs)

```bash
curl --location 'http://localhost:8080/api/jobs' \
--header 'Authorization: Bearer <TOKEN>'
```

### Forgot Password (OTP + reset)

Request OTP:

```bash
curl --location 'http://localhost:8080/api/auth/password/forgot/request-otp' \
--header 'Content-Type: application/json' \
--data-raw '{
	"email": "user1@example.com"
}'
```

Verify OTP (returns `resetToken`):

```bash
curl --location 'http://localhost:8080/api/auth/password/forgot/verify-otp' \
--header 'Content-Type: application/json' \
--data-raw '{
	"email": "user1@example.com",
	"otp": "123456"
}'
```

Reset password:

```bash
curl --location 'http://localhost:8080/api/auth/password/reset' \
--header 'Content-Type: application/json' \
--data-raw '{
	"email": "user1@example.com",
	"resetToken": "<RESET_TOKEN_FROM_VERIFY_OTP>",
	"newPassword": "newPass123"
}'
```

### Postman Collection (import and run)

Import this file in Postman:

- `postman/jobsportal-otp-auth.postman_collection.json`

Recommended run order inside the collection:

1. `1) Register - Request OTP`
2. Set `registrationOtp` from your email inbox
3. `2) Register - Verify OTP`
4. `3) Login` (auto-saves `authToken`)
5. `4) Forgot Password - Request OTP`
6. Set `forgotOtp` from your email inbox
7. `5) Forgot Password - Verify OTP` (auto-saves `resetToken`)
8. `6) Forgot Password - Reset Password`
9. `7) Strict Check - Direct Register Disabled (410)`

Notes:

- Collection variable `baseUrl` defaults to `http://localhost:8080`
- OTP values are manual because they arrive by email
- `resetToken` is filled automatically from verify-forgot-otp response

## Main APIs

### Auth Service

- `POST /api/auth/register/request-otp`
- `POST /api/auth/register/verify-otp`
- `POST /api/auth/login`
- `POST /api/auth/password/forgot/request-otp`
- `POST /api/auth/password/forgot/verify-otp`
- `POST /api/auth/password/reset`

### Job Service

- `POST /api/jobs` (Recruiter only)
- `GET /api/jobs`
- `GET /api/jobs/{id}`
- `GET /api/jobs/search?title=&location=`

### Application Service

- `POST /api/applications` (Job Seeker only)
- `GET /api/applications/user`
- `GET /api/applications/job/{jobId}` (Recruiter/Admin)
- `PUT /api/applications/{id}/status?status=SHORTLISTED|REJECTED|UNDER_REVIEW|SELECTED`
- `PUT /api/applications/job/{jobId}/user/{userId}/status?status=SHORTLISTED|REJECTED|UNDER_REVIEW|SELECTED` (Recruiter only, preferred)

### Admin Service

- `GET /api/admin/users` (Admin only)
- `GET /api/admin/jobs` (Admin only)
- `GET /api/admin/reports` (Admin only)

## Notification Flows

1. **Recruiter posts job**
	 - `job-service` publishes `job.posted` event to RabbitMQ
	 - `notification-service` consumes event
	 - It fetches all user emails from `auth-service`
	 - Sends email notification to all users

2. **Recruiter marks applicant as SHORTLISTED or SELECTED**
	 - `application-service` publishes `application.status.changed`
	 - `notification-service` sends email to that specific candidate

## Example Request Payloads

### Register

```json
{
	"name": "Recruiter One",
	"email": "recruiter1@example.com",
	"username": "recruiter1",
	"password": "password123",
	"role": "RECRUITER",
	"phone": "9876543210"
}
```

### Login

```json
{
	"email": "recruiter1@example.com",
	"password": "password123"
}
```

### Post Job

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

### Apply Job

```json
{
	"jobId": 1,
	"resumeUrl": "https://example.com/resume/user1.pdf"
}
```

## Important Notes

- Gmail SMTP is configured using:
	- `jobportall121@gmail.com`
	- app password: `tyrwqxhcmvwaxjjq`
- `auth-service` MySQL DB in config is `auth_db`.
- If your existing `users` table has a non-null `username` column, registration now supports `username` in payload and auto-generates it from email when omitted.
- If you change config files in `config-server`, restart all services in order so they reload updated config.
- For production, move secrets to environment variables or a secret manager.
- If IntelliJ cannot build automatically and your system has no global Gradle installed, install Gradle or generate Gradle Wrapper from IntelliJ Gradle actions.

## Schema Sync and No-Reset Setup

- Service YAML uses `spring.jpa.hibernate.ddl-auto: update`, so schema evolves without dropping tables.
- `auth-service` supports legacy/non-null `username` column and auto-generates username from email if omitted.
- `job-service` writes recruiter identity to both `posted_by` and `recruiter_id` compatible mappings.
- Keep Config Server values as source of truth for DB URLs; avoid editing service-local YAML with conflicting datasource values.

## How Endpoints Were Tested

### Manual end-to-end flow

1. Start services in order (`config-server`, `discovery-server`, `api-gateway`, then business services)
2. Register recruiter and seeker using OTP flow (`/api/auth/register/request-otp` -> `/api/auth/register/verify-otp`)
3. Login and copy JWT token (`/api/auth/login`)
4. Recruiter posts job (`POST /api/jobs` with Bearer token)
5. Seeker gets job list/search (`GET /api/jobs`, `GET /api/jobs/search`)
6. Seeker applies (`POST /api/applications`)
7. Recruiter updates status (`PUT /api/applications/{id}/status?status=SELECTED`)
8. Notification service consumes events for job posting and selected/shortlisted updates

### Header rules used during testing

- Public auth APIs: only `Content-Type: application/json`
- Protected APIs: `Authorization: Bearer <token>` (+ `Content-Type: application/json` for body requests)
- Do not manually pass `X-User-Id`, `X-User-Email`, `X-User-Role` when using gateway

## JUnit Tests Added

- `auth-service`: `AuthControllerTest`
- `job-service`: `JobControllerTest`
- `application-service`: `ApplicationControllerTest`
- `admin-service`: `AdminControllerTest`
- `notification-service`: `NotificationListenerServiceTest`

Run all tests from workspace root:

```bash
.\gradlew test
```

Run module tests only:

```bash
.\gradlew :services:auth-service:test :services:job-service:test :services:application-service:test :services:admin-service:test :services:notification-service:test
```

## CI/CD with GitHub Actions

Workflows added under `.github/workflows`:

- `ci.yml`: runs on push/PR to `main` and `develop`; executes `clean test` and `build`
- `sonar.yml`: runs Sonar analysis on push to `main`/`develop` (and manual trigger)
- `docker-cd.yml`: builds and pushes all service images to GHCR on push to `main` and version tags

### Required GitHub repository secrets

- `SONAR_TOKEN`: SonarQube token (required for `sonar.yml`)
- `SONAR_HOST_URL`: SonarQube server URL (for example: `http://localhost:9000` for self-hosted runner)

### Container registry details

`docker-cd.yml` pushes images to:

- `ghcr.io/<github-owner>/jobsportal-config-server`
- `ghcr.io/<github-owner>/jobsportal-discovery-server`
- `ghcr.io/<github-owner>/jobsportal-api-gateway`
- `ghcr.io/<github-owner>/jobsportal-auth-service`
- `ghcr.io/<github-owner>/jobsportal-job-service`
- `ghcr.io/<github-owner>/jobsportal-application-service`
- `ghcr.io/<github-owner>/jobsportal-admin-service`
- `ghcr.io/<github-owner>/jobsportal-notification-service`

Tags include commit SHA, `latest` (default branch), and Git tag refs.

### Trigger summary

- Open/update PR -> `ci.yml` validates code quality and build health
- Merge to `main` -> `ci.yml` + `sonar.yml` + `docker-cd.yml`
- Push tag like `v1.0.0` -> `docker-cd.yml` publishes versioned images
- Manual run -> `sonar.yml` and `docker-cd.yml` support `workflow_dispatch`

### Notes

- `docker-cd.yml` uses `infrastructure/Dockerfile.service` and builds each service via matrix `SERVICE_MODULE`
- GHCR publish uses built-in `GITHUB_TOKEN` with `packages: write` permission
- For private SonarQube reachable only from local machine, use a self-hosted GitHub runner on that machine

