export type Role = 'ADMIN' | 'RECRUITER' | 'JOB_SEEKER'

export interface AuthUser {
  userId: number
  email: string
  role: Role
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  userId: number
  email: string
  role: Role
}

export interface RegisterRequest {
  name: string
  email: string
  username?: string
  password: string
  role: Role
  phone?: string
}

export interface OtpMessageResponse {
  message: string
}

export interface VerifyRegistrationOtpRequest {
  email: string
  otp: string
}

export interface RegistrationVerificationResponse {
  id: number
  name: string
  email: string
  role: Role
  phone?: string
  profileImageUrl?: string
}

export interface VerifyForgotPasswordOtpRequest {
  email: string
  otp: string
}

export interface VerifyForgotPasswordOtpResponse {
  message: string
  resetToken: string
}

export interface ResetPasswordRequest {
  email: string
  resetToken: string
  newPassword: string
}

export interface UserProfile {
  id: number
  name: string
  email: string
  role: Role
  phone?: string
  profileImageUrl?: string
}

export interface UpdateProfileRequest {
  name?: string
  username?: string
  phone?: string
}

