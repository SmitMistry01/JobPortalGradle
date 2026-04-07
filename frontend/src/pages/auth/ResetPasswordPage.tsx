import { useState, type FormEvent } from 'react'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { Link, useSearchParams } from 'react-router-dom'
import { useResetPasswordMutation } from '../../features/auth/authApi'
import { resetPasswordSchema } from '../../validation/authSchemas'

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') return 'Could not reset password. Please try again.'
  const apiError = error as FetchBaseQueryError & { data?: { message?: string; error?: string } }
  return String(apiError.data?.message || apiError.data?.error || 'Could not reset password. Please try again.')
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [resetToken, setResetToken] = useState(params.get('resetToken') ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [resetPassword, { isLoading, isSuccess }] = useResetPasswordMutation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrorMessage(null)
    if (newPassword !== confirmPassword) { setErrorMessage('Passwords do not match.'); return }
    const validation = resetPasswordSchema.safeParse({ email, resetToken, newPassword })
    if (!validation.success) { setErrorMessage(validation.error.issues[0]?.message ?? 'Invalid reset request.'); return }
    try { await resetPassword(validation.data).unwrap() }
    catch (error) { setErrorMessage(getErrorMessage(error)) }
  }

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500'

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500" />

          <div className="px-8 py-10">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30">
              <svg className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Set New Password</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Create a strong new password for your account.
            </p>

            {isSuccess ? (
              <div className="mt-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Password Updated!</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your password has been reset successfully.</p>
                <Link to="/login" className="mt-6 inline-block w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-bold text-white text-center hover:from-indigo-700 hover:to-blue-700">
                  Sign In →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                  <div className="relative">
                    <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
                  </div>
                </div>

                {/* Reset Token */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Reset Token</label>
                  <div className="relative">
                    <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    <input placeholder="Token from your email" value={resetToken} onChange={(e) => setResetToken(e.target.value)} required className={inputCls} />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                  <div className="relative">
                    <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <input type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className={`${inputCls} pr-12`} />
                    <button type="button" tabIndex={-1} onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPass ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} /></svg>
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm Password</label>
                  <div className="relative">
                    <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <input type={showPass ? 'text' : 'password'} placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={`${inputCls} border-${confirmPassword && confirmPassword === newPassword ? 'emerald' : 'slate'}-200`} />
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
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200/50 transition hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2.5">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Resetting...
                    </span>
                  ) : 'Reset Password →'}
                </button>

                {/* Progress */}
                <div className="flex items-center justify-center gap-2">
                  {['Enter Email', 'Verify OTP', 'New Password'].map((step, i) => (
                    <div key={step} className="flex items-center gap-2">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i === 2 ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'}`}>
                        {i < 2 ? <svg className="h-3 w-3" fill="white" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : i + 1}
                      </div>
                      <span className={`text-xs ${i === 2 ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{step}</span>
                      {i < 2 && <div className="h-px w-4 bg-slate-200 dark:bg-slate-700" />}
                    </div>
                  ))}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
