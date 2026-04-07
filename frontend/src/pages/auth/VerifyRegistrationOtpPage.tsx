import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { useVerifyRegistrationOtpMutation } from '../../features/auth/authApi'
import { otpVerificationSchema } from '../../validation/authSchemas'

function getErrorMessage(error: unknown) {
  const fallback = 'OTP verification failed. Please check OTP and try again.'
  if (!error || typeof error !== 'object') return fallback
  const apiError = error as FetchBaseQueryError & { data?: { message?: string; error?: string } }
  return apiError?.data?.message || apiError?.data?.error || fallback
}

export function VerifyRegistrationOtpPage() {
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [verifyOtp, { isLoading }] = useVerifyRegistrationOtpMutation()
  const navigate = useNavigate()
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const otp = digits.join('')

  function handleDigit(idx: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[idx] = val
    setDigits(next)
    if (val && idx < 5) refs.current[idx + 1]?.focus()
  }

  function handleKeyDown(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs.current[idx - 1]?.focus()
    if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus()
    if (e.key === 'ArrowRight' && idx < 5) refs.current[idx + 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...text.split(''), ...Array(6 - text.length).fill('')]
    setDigits(next.slice(0, 6))
    refs.current[Math.min(text.length, 5)]?.focus()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrorMessage(null)
    const validation = otpVerificationSchema.safeParse({ email, otp })
    if (!validation.success) { setErrorMessage(validation.error.issues[0]?.message ?? 'Invalid OTP input.'); return }
    try {
      await verifyOtp(validation.data).unwrap()
      navigate('/login', { replace: true })
    } catch (error) { setErrorMessage(getErrorMessage(error)) }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-100/50 dark:border-slate-800 dark:bg-slate-900">
          <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500" />

          <div className="px-8 py-10">
            {/* Icon */}
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30">
              <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Verify Your Email</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              We sent a 6-digit OTP to <span className="font-semibold text-slate-700 dark:text-slate-300">{email || 'your email'}</span>. Enter it below to complete registration.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {/* Email (editable fallback) */}
              {!params.get('email') && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              )}

              {/* OTP digits */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-300">Enter OTP</label>
                <div className="flex justify-between gap-2" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { refs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleDigit(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="h-14 w-14 rounded-xl border-2 border-slate-200 bg-slate-50 text-center text-xl font-bold text-slate-900 caret-indigo-500 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-400">You can paste your OTP directly into the fields.</p>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200/50 transition hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2.5">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Verifying...
                  </span>
                ) : 'Verify & Activate Account →'}
              </button>

              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Didn't receive OTP?{' '}
                <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                  Go back & resend
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
