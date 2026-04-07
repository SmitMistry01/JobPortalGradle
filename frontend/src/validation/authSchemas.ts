import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  username: z.string().trim().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['JOB_SEEKER', 'RECRUITER']),
  phone: z.string().trim().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
})

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  resetToken: z.string().trim().min(6, 'Reset token is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
})

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^[0-9+()\-\s]{7,20}$/.test(value), 'Enter a valid phone number'),
})

export const otpVerificationSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  otp: z
    .string()
    .trim()
    .min(4, 'OTP must be at least 4 characters')
    .max(10, 'OTP is too long'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
