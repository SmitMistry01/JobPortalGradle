import { useState, type FormEvent } from 'react'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { useNavigate } from 'react-router-dom'
import { useRequestForgotPasswordOtpMutation } from '../../features/auth/authApi'
import { forgotPasswordSchema } from '../../validation/authSchemas'

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') return 'Could not send OTP. Please try again.'
  const apiError = error as FetchBaseQueryError & { data?: { message?: string; error?: string } }
  return String(apiError.data?.message || apiError.data?.error || 'Could not send OTP. Please try again.')
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [requestOtp, { isLoading }] = useRequestForgotPasswordOtpMutation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrorMessage(null)
    const validation = forgotPasswordSchema.safeParse({ email })
    if (!validation.success) { setErrorMessage(validation.error.issues[0]?.message ?? 'Please enter a valid email.'); return }
    try {
      await requestOtp({ email: validation.data.email }).unwrap()
      navigate(`/verify-forgot-otp?email=${encodeURIComponent(validation.data.email)}`)
    } catch (error) { setErrorMessage(getErrorMessage(error)) }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-100/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-900/50">
          {/* Top gradient strip */}
          <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500" />

          <div className="px-8 py-10">
            {/* Icon */}
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30">
              <svg className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Forgot Password?</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Enter your registered email address. We'll send you a one-time password to reset your account.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200/50 transition hover:from-indigo-700 hover:to-blue-700 disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2.5">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Sending OTP...
                  </span>
                ) : 'Send Reset OTP →'}
              </button>

              <div className="mt-2 text-center">
                <a href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Back to sign in
                </a>
              </div>
            </form>

            {/* Progress steps */}
            <div className="mt-8 flex items-center justify-center gap-2">
              {['Enter Email', 'Verify OTP', 'New Password'].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400 dark:bg-slate-700'}`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs ${i === 0 ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>{step}</span>
                  {i < 2 && <div className="h-px w-4 bg-slate-200 dark:bg-slate-700" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
