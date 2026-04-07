# Validation Checklist

## Problem Verification

### Before Fixes
- [ ] Registration form submission returns 400 Bad Request
- [ ] Error message: "Cloudinary is not configured" when uploading profile image
- [ ] Network request doesn't have proper multipart headers

### After Fixes
- [ ] Registration form submission returns 200 OK (with FormData)
- [ ] Profile image uploads successfully to Cloudinary
- [ ] User receives OTP email
- [ ] Services start with Cloudinary configuration status

## Pre-Deployment Checklist

### 1. Cloudinary Setup
- [ ] Have Cloudinary account created
- [ ] Have Cloud Name copied
- [ ] Have API Key copied
- [ ] Have API Secret copied
- [ ] Environment variables set (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)

### 2. Frontend Code
- [ ] `frontend/src/services/baseApi.ts` has fetchFn with FormData handling
- [ ] `frontend/src/components/layout/Header.tsx` uses `logout` action (not `clearCredentials`)
- [ ] No TypeScript errors in frontend

### 3. Backend Configuration
- [ ] `services/config-server/src/main/resources/config/auth-service.yml` references CLOUDINARY_* env vars
- [ ] `services/config-server/src/main/resources/config/application-service.yml` references CLOUDINARY_* env vars
- [ ] Services start successfully and log their configuration status

### 4. Testing
- [ ] Registration page loads
- [ ] Profile image field accepts images
- [ ] Form submission with FormData doesn't return 400
- [ ] OTP sent to email
- [ ] OTP verification works
- [ ] Profile image stored in Cloudinary

## Troubleshooting

### Registration still returns 400
1. Check browser Network tab - look for Content-Type header
2. Should show: `Content-Type: multipart/form-data; boundary=...`
3. Should NOT show just: `application/json`
4. Check backend logs for validation errors
5. Verify all required fields are filled (name, email, password)

### Cloudinary not configured error
1. Check environment variables are set: `$env:CLOUDINARY_CLOUD_NAME`
2. Verify they're not empty strings
3. Restart PowerShell to pick up new environment variables
4. Check service logs for "Cloudinary is not configured" message

### Profile image still not uploading
1. Verify Cloudinary credentials are correct (test in https://cloudinary.com/console)
2. Check image size < 5MB
3. Check image is valid format (jpg, png, gif, etc.)
4. Check service logs for upload errors
5. Check Cloudinary dashboard to see if images are being uploaded

## Files to Review

- ✓ `frontend/src/services/baseApi.ts` - FormData handling
- ✓ `frontend/src/components/layout/Header.tsx` - logout action
- ✓ `infrastructure/start-local.ps1` - Cloudinary env var setup
- ✓ `infrastructure/setup-cloudinary.ps1` - Helper script
- ✓ `CLOUDINARY_AND_REGISTRATION_FIX.md` - Detailed documentation
- ✓ `QUICK_FIX_GUIDE.md` - Quick reference

## Related Code Files (No changes needed)

- `frontend/src/pages/auth/RegisterPage.tsx` - Already uses FormData correctly
- `frontend/src/features/auth/authApi.ts` - Already has multipart mutation
- `services/auth-service/src/main/.../AuthController.java` - Already expects multipart

