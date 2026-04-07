# Fix: 400 Bad Request on Registration and Cloudinary Configuration

## Problem 1: 400 Bad Request on `/api/auth/register/request-otp`

### Root Cause
The issue was that when sending `FormData` (multipart form data), the `fetchBaseQuery` was setting a generic `Content-Type` header, but multipart requests require the browser to automatically set `Content-Type: multipart/form-data; boundary=...` with a unique boundary.

### Solution Applied
Updated `frontend/src/services/baseApi.ts` to:
1. Add a custom `fetchFn` that detects FormData
2. Remove the `Content-Type` header for FormData requests
3. Allow the browser to automatically set the proper Content-Type with boundary

## Problem 2: Cloudinary Not Configured

### Root Cause
The backend services (auth-service and application-service) require Cloudinary credentials to be set as environment variables:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

These environment variables are referenced in `services/config-server/src/main/resources/config/auth-service.yml` and similar config files, but they were not being set when starting the services.

### Solution Steps

#### 1. Get Cloudinary Credentials
1. Go to https://cloudinary.com/users/register/free
2. Sign up for a free Cloudinary account
3. Go to your Dashboard: https://cloudinary.com/console/c_dashboard/dashboard
4. Note your **Cloud Name** (in the Dashboard)
5. Note your **API Key** (in the Dashboard)
6. Generate an **API Secret** (in the Dashboard)

#### 2. Set Environment Variables

**Option A: Temporary (for current session only)**

Run this in PowerShell before starting services:
```powershell
$env:CLOUDINARY_CLOUD_NAME = "your-cloud-name"
$env:CLOUDINARY_API_KEY = "your-api-key"
$env:CLOUDINARY_API_SECRET = "your-api-secret"
```

Or use the provided script:
```powershell
cd infrastructure
# Edit setup-cloudinary.ps1 and replace placeholder values
.\setup-cloudinary.ps1
# Then start services
.\start-local.ps1
```

**Option B: Permanent (Windows environment variable)**

```powershell
[Environment]::SetEnvironmentVariable("CLOUDINARY_CLOUD_NAME", "your-cloud-name", "User")
[Environment]::SetEnvironmentVariable("CLOUDINARY_API_KEY", "your-api-key", "User")
[Environment]::SetEnvironmentVariable("CLOUDINARY_API_SECRET", "your-api-secret", "User")
```

Then restart PowerShell for changes to take effect.

**Option C: Permanent (System-wide, admin required)**

```powershell
# Run as Administrator
[Environment]::SetEnvironmentVariable("CLOUDINARY_CLOUD_NAME", "your-cloud-name", "Machine")
[Environment]::SetEnvironmentVariable("CLOUDINARY_API_KEY", "your-api-key", "Machine")
[Environment]::SetEnvironmentVariable("CLOUDINARY_API_SECRET", "your-api-secret", "Machine")
```

Then restart your entire computer for changes to take effect.

#### 3. Verify Configuration
When services start, they log whether Cloudinary is configured. Look for log messages like:
- If configured: Registration/Application service starts successfully with profile image upload support
- If not configured: Services may still work for basic registration, but file uploads will fail with "Cloudinary is not configured"

## Testing the Fix

### Test Registration with Profile Image
1. Start the services with Cloudinary environment variables set
2. Go to `http://localhost:3000/register` (or your frontend URL)
3. Fill in registration form and select a profile image
4. Submit the form
5. You should see "OTP sent to your email" message
6. Check your email for the OTP
7. Verify the registration to complete the process

### Verify Cloudinary Integration
- Profile images uploaded during registration are stored in Cloudinary
- Resumes uploaded with job applications are stored in Cloudinary
- These URLs are stored in the database and can be accessed from the user profile

## Backend Configuration Files

The Cloudinary configuration is injected from environment variables into:
- `services/auth-service/src/main/resources/config/auth-service.yml` - For profile images
- `services/application-service/src/main/resources/config/application-service.yml` - For resumes

If environment variables are not set, they default to empty strings, causing the `cloudinaryConfigured` flag to be false.

## Files Modified

1. **frontend/src/services/baseApi.ts** - Added FormData handling
2. **infrastructure/setup-cloudinary.ps1** - New helper script for Cloudinary setup

## References
- Cloudinary Free Tier: https://cloudinary.com/users/register/free
- Cloudinary API Docs: https://cloudinary.com/documentation

