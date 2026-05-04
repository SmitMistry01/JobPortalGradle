# Frontend Implementation Guide (React + TypeScript)

This frontend lives in `frontend/` and is built for local development against your backend gateway on localhost:

- Base API: `http://localhost:8080/api` or the proxied relative path `/api`
- Env key: `VITE_API_BASE_URL`

## 1) Implemented Scope (Phase 1)

- Authentication flow with OTP:
  - Register request OTP
  - Verify registration OTP
  - Login
  - Forgot password request OTP
  - Forgot password verify OTP
  - Reset password
- Role-based route protection (Admin / Recruiter / Job Seeker)
- Global dark mode (toggle + persisted preference)
- Redux Toolkit + RTK Query architecture
- Basic dashboard placeholders with chart integration (`recharts`)
- Initial test coverage for auth state reducer

## 2) API Endpoints Used

All endpoints are called through `${VITE_API_BASE_URL}`.

- `POST /auth/login`
- `POST /auth/register/request-otp`
- `POST /auth/register/verify-otp`
- `POST /auth/password/forgot/request-otp`
- `POST /auth/password/forgot/verify-otp`
- `POST /auth/password/reset`

## 3) Folder Structure

```text
frontend/
  src/
    app/
      hooks.ts
      router.tsx
      store.ts
    components/
      layout/
        AppShell.tsx
        ThemeToggle.tsx
      routing/
        ProtectedRoute.tsx
      ui/
        Button.tsx
        Input.tsx
    features/
      auth/
        authApi.ts
        authSlice.ts
        authSlice.test.ts
    pages/
      admin/
      auth/
      common/
      jobseeker/
      recruiter/
    services/
      baseApi.ts
    test/
      setup.ts
    theme/
      ThemeProvider.tsx
    types/
      auth.ts
```

## 4) State Management Flow

- `authSlice` stores session token + current user in Redux and localStorage.
- `baseApi` (RTK Query):
  - Reads token/user from Redux
  - Injects headers:
    - `Authorization: Bearer <token>`
    - `X-User-Id`
    - `X-User-Email`
    - `X-User-Role`
- `authApi` exposes auth mutations for all Phase 1 endpoints.

## 5) Routing and RBAC

Configured in `src/app/router.tsx`.

- Public routes:
  - `/`
  - `/login`
  - `/register`
  - `/verify-otp`
  - `/forgot-password`
  - `/verify-forgot-otp`
  - `/reset-password`
- Protected routes:
  - `JOB_SEEKER`: `/applications`
  - `RECRUITER`: `/recruiter`
  - `ADMIN`: `/admin`
  - Shared authenticated: `/jobs`

`ProtectedRoute` redirects:

- Unauthenticated -> `/login`
- Unauthorized role -> `/forbidden`

## 6) Theming and UI

- Tailwind CSS configured with `darkMode: 'class'`
- Theme persisted via `localStorage` key: `jp_theme`
- `ThemeProvider` manages document dark class

## 7) How to Run

1. Copy env example:

```bash
cd frontend
cp .env.example .env
```

2. Set API gateway URL in `.env` for local development:

```dotenv
VITE_API_BASE_URL=/api
```

3. Install and run:

```bash
npm install
npm run dev
```

4. Build for production:

```bash
npm run build
npm run preview
```

5. Run tests:

```bash
npm run test
```

## 8) Implementation Notes

- Backend registration endpoint `/auth/register` is intentionally disabled in your backend. Frontend uses OTP-first registration flow.
- Current dashboard/job pages are phase-ready placeholders and already wired with role-safe routing.
- Chart library (`recharts`) is integrated for recruiter/admin dashboards.

## 9) Next Phase Suggestions

- Add persistent user profile fetch after login (`/auth/profile` if available)
- Add feature slices for jobs, applications, recruiter workflows
- Add endpoint error mapping and toast notifications
- Add more tests for route guards and auth forms
- Add code-splitting by route to reduce initial bundle size