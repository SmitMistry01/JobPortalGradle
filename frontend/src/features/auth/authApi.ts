import { baseApi } from '../../services/baseApi'
import type {
  AuthResponse,
  LoginRequest,
  OtpMessageResponse,
  RegistrationVerificationResponse,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UserProfile,
  VerifyForgotPasswordOtpRequest,
  VerifyForgotPasswordOtpResponse,
  VerifyRegistrationOtpRequest,
} from '../../types/auth'

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    requestRegistrationOtp: builder.mutation<OtpMessageResponse, RegisterRequest>({
      query: (body) => ({ url: '/auth/register/request-otp', method: 'POST', body }),
    }),
    requestRegistrationOtpMultipart: builder.mutation<OtpMessageResponse, FormData>({
      query: (body) => ({ url: '/auth/register/request-otp', method: 'POST', body }),
    }),
    verifyRegistrationOtp: builder.mutation<RegistrationVerificationResponse, VerifyRegistrationOtpRequest>({
      query: (body) => ({ url: '/auth/register/verify-otp', method: 'POST', body }),
    }),
    requestForgotPasswordOtp: builder.mutation<OtpMessageResponse, { email: string }>({
      query: (body) => ({ url: '/auth/password/forgot/request-otp', method: 'POST', body }),
    }),
    verifyForgotPasswordOtp: builder.mutation<VerifyForgotPasswordOtpResponse, VerifyForgotPasswordOtpRequest>({
      query: (body) => ({ url: '/auth/password/forgot/verify-otp', method: 'POST', body }),
    }),
    resetPassword: builder.mutation<OtpMessageResponse, ResetPasswordRequest>({
      query: (body) => ({ url: '/auth/password/reset', method: 'POST', body }),
    }),
    getInternalUsers: builder.query<UserProfile[], void>({
      query: () => ({ url: '/auth/internal/users' }),
      providesTags: ['Auth'],
    }),
    updateProfile: builder.mutation<UserProfile, UpdateProfileRequest>({
      query: (body) => ({ url: '/auth/profile', method: 'PUT', body }),
      invalidatesTags: ['Auth'],
    }),
    uploadResume: builder.mutation<UserProfile, FormData>({
      query: (body) => ({ url: '/auth/profile/resume', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
  }),
})

export const {
  useLoginMutation,
  useRequestRegistrationOtpMutation,
  useRequestRegistrationOtpMultipartMutation,
  useVerifyRegistrationOtpMutation,
  useRequestForgotPasswordOtpMutation,
  useVerifyForgotPasswordOtpMutation,
  useResetPasswordMutation,
  useGetInternalUsersQuery,
  useUpdateProfileMutation,
  useUploadResumeMutation,
} = authApi

