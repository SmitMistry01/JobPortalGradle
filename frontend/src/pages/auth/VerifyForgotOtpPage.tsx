import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { useVerifyForgotPasswordOtpMutation } from '../../features/auth/authApi'
import { otpVerificationSchema } from '../../validation/authSchemas'

function getErrorMessage(error: unknown) {
  const fallback = 'OTP verification failed. Please try again.'
  if (!error || typeof error !== 'object') return fallback
  const apiError = error as FetchBaseQueryError & { data?: { message?: string; error?: string } }
  return apiError?.data?.message || apiError?.data?.error || fallback
}

export function VerifyForgotOtpPage() {
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [verifyOtp, { isLoading }] = useVerifyForgotPasswordOtpMutation()
  const navigate = useNavigate()
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const otp = digits.join('')

  function handleDigit(idx: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]; next[idx] = val; setDigits(next)
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
    if (!validation.success) { setErrorMessage(validation.error.issues[0]?.message ?? 'Invalid OTP.'); return }
    try {
      await verifyOtp(validation.data).unwrap()
      navigate('/login', { replace: true })
    } catch (error) { setErrorMessage(getErrorMessage(error)) }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />

          <div className="px-8 py-10">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
              <svg className="h-8 w-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Verify Reset OTP</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Enter the 6-digit OTP sent to <span className="font-semibold text-slate-700 dark:text-slate-300">{email || 'your email'}</span>.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {!params.get('email') && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
              )}

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
                      className="h-14 w-14 rounded-xl border-2 border-slate-200 bg-slate-50 text-center text-xl font-bold text-slate-900 caret-amber-500 transition focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  ))}
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
                disabled={isLoading || otp.length < 6}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-200/50 transition hover:from-amber-600 hover:to-orange-600 disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2.5">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Verifying...
                  </span>
                ) : 'Verify OTP →'}
              </button>

              {/* Progress */}
              <div className="flex items-center justify-center gap-2">
                {['Enter Email', 'Verify OTP', 'New Password'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i === 1 ? 'bg-amber-500 text-white' : i < 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400 dark:bg-slate-700'}`}>
                      {i < 1 ? <svg className="h-3 w-3" fill="white" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : i + 1}
                    </div>
                    <span className={`text-xs ${i === 1 ? 'font-semibold text-amber-600 dark:text-amber-400' : i < 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{step}</span>
                    {i < 2 && <div className="h-px w-4 bg-slate-200 dark:bg-slate-700" />}
                  </div>
                ))}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
