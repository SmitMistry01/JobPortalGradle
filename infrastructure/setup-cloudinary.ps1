# Cloudinary Configuration Setup Script
# This script sets up Cloudinary environment variables required for file uploads
#
# IMPORTANT: You must obtain Cloudinary credentials from https://cloudinary.com
#
# Steps:
# 1. Go to https://cloudinary.com/users/register/free
# 2. Create a free account
# 3. Go to your Dashboard: https://cloudinary.com/console/c_dashboard/dashboard
# 4. You'll see your Cloud Name, API Key, and can generate an API Secret
# 5. Replace the placeholders below with your actual credentials

# Set your Cloudinary credentials here
$env:CLOUDINARY_CLOUD_NAME = "your-cloud-name"
$env:CLOUDINARY_API_KEY = "your-api-key"
$env:CLOUDINARY_API_SECRET = "your-api-secret"

# Verify the variables are set
Write-Host "Cloudinary environment variables have been set:"
Write-Host "CLOUDINARY_CLOUD_NAME: $($env:CLOUDINARY_CLOUD_NAME)"
Write-Host "CLOUDINARY_API_KEY: $($env:CLOUDINARY_API_KEY)"
Write-Host "CLOUDINARY_API_SECRET: (set)" # Don't display secret for security

# To make these permanent (Windows 10/11), use:
# [Environment]::SetEnvironmentVariable("CLOUDINARY_CLOUD_NAME", "your-cloud-name", "User")
# [Environment]::SetEnvironmentVariable("CLOUDINARY_API_KEY", "your-api-key", "User")
# [Environment]::SetEnvironmentVariable("CLOUDINARY_API_SECRET", "your-api-secret", "User")

