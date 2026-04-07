# Quick Fix Summary

## Issues Fixed

### 1. ✓ 400 Bad Request on Registration
**Fixed:** Frontend now properly sends multipart form data with FormData

**What changed:**
- Updated `frontend/src/services/baseApi.ts` to properly handle FormData requests
- FormData is now sent with correct `multipart/form-data` Content-Type headers

### 2. ⚠ Cloudinary Not Configured
**To fix:** Set Cloudinary environment variables before starting services

## Quick Start

### Step 1: Get Cloudinary Credentials (5 minutes)
1. Go to https://cloudinary.com/users/register/free
2. Create free account
3. In Dashboard, copy your Cloud Name, API Key, and generate API Secret

### Step 2: Set Environment Variables (Choose one method)

**Method A - Current session only (simplest for testing):**
```powershell
$env:CLOUDINARY_CLOUD_NAME = "your-cloud-name-here"
$env:CLOUDINARY_API_KEY = "your-api-key-here"
$env:CLOUDINARY_API_SECRET = "your-api-secret-here"
```

**Method B - Permanent for current user:**
```powershell
[Environment]::SetEnvironmentVariable("CLOUDINARY_CLOUD_NAME", "your-cloud-name-here", "User")
[Environment]::SetEnvironmentVariable("CLOUDINARY_API_KEY", "your-api-key-here", "User")
[Environment]::SetEnvironmentVariable("CLOUDINARY_API_SECRET", "your-api-secret-here", "User")
```
Then restart PowerShell and continue.

### Step 3: Start Services
```powershell
cd infrastructure
.\start-local.ps1
```

The script will now show:
- ✓ Cloudinary is configured (if variables are set)
- ⚠ WARNING about missing variables (if not set)

### Step 4: Test Registration
1. Go to http://localhost:3000/register
2. Fill form and upload a profile image
3. Should work without 400 error
4. Check email for OTP

## Files Changed
- `frontend/src/services/baseApi.ts` - FormData handling fixed
- `infrastructure/start-local.ps1` - Added Cloudinary check and env var passing
- `infrastructure/setup-cloudinary.ps1` - New helper script

## More Details
See `CLOUDINARY_AND_REGISTRATION_FIX.md` for comprehensive documentation

