# Job Portal Backend (Spring Boot Microservices, Gradle, JDK 21)

This is a complete backend for a Job Portal System using Spring Boot microservices, service discovery, centralized configuration, API Gateway, JWT authentication, RabbitMQ, and Gmail SMTP notifications.

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
- RabbitMQ
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
docker composJete logs -f api-gateway
docker compose logs -f discovery-server
```
j
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
	- `POST /api/auth/register`
	- `POST /api/auth/login`
- All other gateway routes require `Authorization: Bearer <token>`
- Gateway validates JWT and forwards:
	- `X-User-Id`
	- `X-User-Email`
	- `X-User-Role`

## Required Headers (Important)

### 1) Register/Login (No JWT needed)

For `POST /api/auth/register` and `POST /api/auth/login`, send only:

- `Content-Type: application/json`

Do **not** send `Authorization` for these two public endpoints.

### 2) Protected APIs (JWT needed)

For all other APIs (`/api/jobs/**`, `/api/applications/**`, `/api/admin/**`), send:

- `Content-Type: application/json`
- `Authorization: Bearer <JWT_TOKEN_FROM_LOGIN>`

Do **not** manually send `X-User-Id`, `X-User-Email`, `X-User-Role`; API Gateway adds them automatically after validating JWT.

## Quick API Test Commands

### Register

```bash
curl --location 'http://localhost:8080/api/auth/register' \
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

## Main APIs

### Auth Service

- `POST /api/auth/register`
- `POST /api/auth/login`

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
- `auth-service` MySQL DB in config is `auth_ab` (as per your DB setup).
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
2. Register recruiter and seeker (`/api/auth/register`)
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