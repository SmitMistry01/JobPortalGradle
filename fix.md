# Docker Compose Failure Analysis and Fix

## Scope
Checked historical startup failures from `docker compose up --build -d`, identified whether they were code/build errors or non-code errors, applied fixes, and revalidated service status.

## Classification
- **Not a Java compile/build error**.
- **Runtime startup/configuration issue** caused by missing runtime properties when Config Server was temporarily unavailable during service boot.

## Evidence from terminal logs
- `auth-service`, `job-service`, `application-service`:
  - `Access denied for user 'root' ... (using password: NO)`
- `notification-service`:
  - `No qualifying bean of type 'org.springframework.mail.javamail.JavaMailSender' available`
- `api-gateway`:
  - `Could not resolve placeholder 'security.jwt.secret'`
- Repeated startup-time warnings:
  - `ConfigServerConfigDataLoader ... Connection refused` (to `http://config-server:8888` / `http://localhost:8888`)

## Root cause
During container startup, services attempted to load config from Config Server before it was reachable. Because `spring.config.import` is optional, services continued with local/incomplete config, which omitted required values (DB password, JWT secret, mail host/credentials), leading to runtime bean and datasource failures.

## Fix applied
Updated `docker-compose.yml` to provide fallback environment variables for critical startup properties:

- `auth-service`
  - `SPRING_DATASOURCE_USERNAME=root`
  - `SPRING_DATASOURCE_PASSWORD=smit`
  - `SECURITY_JWT_SECRET=my-super-secret-jwt-key-my-super-secret-jwt-key`
- `job-service`
  - `SPRING_DATASOURCE_USERNAME=root`
  - `SPRING_DATASOURCE_PASSWORD=smit`
- `application-service`
  - `SPRING_DATASOURCE_USERNAME=root`
  - `SPRING_DATASOURCE_PASSWORD=smit`
- `notification-service`
  - `SPRING_MAIL_HOST=smtp.gmail.com`
  - `SPRING_MAIL_PORT=587`
  - `SPRING_MAIL_USERNAME=jobportall121@gmail.com`
  - `SPRING_MAIL_PASSWORD=tyrwqxhcmvwaxjjq`
  - `SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true`
  - `SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true`
- `api-gateway`
  - `SECURITY_JWT_SECRET=my-super-secret-jwt-key-my-super-secret-jwt-key`

## Revalidation
Executed:
- `docker compose up -d --build`
- `docker compose ps -a`

Result:
- **All services are `Up`**.
- **No containers are in `Exited/Dead/Restarting` state**.

## Final note
This failure was primarily a **startup sequencing/config availability** issue, not a source-code compile error. The compose fallback env values now make startup resilient even when Config Server is briefly unavailable.