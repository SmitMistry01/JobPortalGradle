import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { useRequestRegistrationOtpMultipartMutation } from '../../features/auth/authApi'
import type { Role } from '../../types/auth'
import { registerSchema } from '../../validation/authSchemas'

function getErrorMessage(error: unknown) {
  const fallbackMessage = 'Could not send OTP. Please check your details and try again.'
  if (!error || typeof error !== 'object') return fallbackMessage
  const apiError = error as FetchBaseQueryError & { data?: { message?: string; error?: string } }
  const dataMessage = apiError?.data?.message || apiError?.data?.error
  if (dataMessage) return String(dataMessage)
  if ('status' in apiError) {
    if (apiError.status === 'FETCH_ERROR') return 'Network error: Cannot reach backend API.'
    if (apiError.status === 400) return 'Invalid input. Please check all fields.'
  }
  return fallbackMessage
}

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500'
const inputCls2 = 'w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500'

export function RegisterPage() {
  const [requestOtp, { isLoading }] = useRequestRegistrationOtpMultipartMutation()
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', role: 'JOB_SEEKER' as Role, phone: '' })
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setErrorMessage('Image must be less than 5MB'); return }
    if (!file.type.startsWith('image/')) { setErrorMessage('Please select a valid image file'); return }
    setProfileImage(file)
    const reader = new FileReader()
    reader.onloadend = () => setProfileImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const validation = registerSchema.safeParse({ name: form.name, email: form.email, username: form.username, password: form.password, role: form.role, phone: form.phone })
    if (!validation.success) { setErrorMessage(validation.error.issues[0]?.message ?? 'Invalid form data.'); return }
    const payload = new FormData()
    payload.append('name', validation.data.name.trim())
    payload.append('email', validation.data.email.trim())
    payload.append('username', validation.data.username?.trim() || validation.data.email.trim().split('@')[0])
    payload.append('password', validation.data.password)
    payload.append('role', validation.data.role)
    payload.append('phone', validation.data.phone?.trim() ?? '')
    if (profileImage) payload.append('profileImage', profileImage)
    setMessage(null); setErrorMessage(null)
    try {
      const response = await requestOtp(payload).unwrap()
      setMessage(response.message)
      setTimeout(() => navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`), 1000)
    } catch (error) { setErrorMessage(getErrorMessage(error)) }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl shadow-2xl shadow-indigo-100/30 dark:shadow-indigo-900/20">
        {/* Left Panel */}
        <div className="hidden flex-col items-center justify-center bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-12 lg:flex lg:w-80">
          <svg viewBox="0 0 280 280" fill="none" className="w-52 opacity-90">
            {/* Circles */}
            <circle cx="140" cy="140" r="100" fill="white" fillOpacity="0.05" />
            <circle cx="140" cy="140" r="65" fill="white" fillOpacity="0.05" />
            {/* Person */}
            <circle cx="140" cy="90" r="28" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="2" strokeOpacity="0.7" />
            <path d="M80 190 Q80 155 140 155 Q200 155 200 190 L200 210 Q200 225 140 225 Q80 225 80 210 Z" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="2" strokeOpacity="0.7" />
            {/* Checkmarks */}
            <circle cx="58" cy="110" r="16" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
            <path d="M51 110 l5 5 l9 -9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" />
            <circle cx="222" cy="130" r="16" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
            <path d="M215 130 l5 5 l9 -9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" />
            {/* Dots */}
            <circle cx="50" cy="60" r="4" fill="white" fillOpacity="0.4" />
            <circle cx="230" cy="80" r="3" fill="white" fillOpacity="0.3" />
            <circle cx="220" cy="220" r="5" fill="white" fillOpacity="0.4" />
            <circle cx="60" cy="220" r="4" fill="white" fillOpacity="0.3" />
          </svg>

          <div className="mt-6 text-center">
            <h2 className="text-xl font-bold text-white">Join NexusCareers</h2>
            <p className="mt-2 text-xs text-indigo-200">Create your account and start your professional journey today.</p>
          </div>

          <div className="mt-6 w-full space-y-2">
            {['Free to join, forever', 'Find jobs that match your skills', 'Connect with top recruiters'].map((text) => (
              <div key={text} className="flex items-center gap-2.5 text-xs text-indigo-100">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-2.5 w-2.5" fill="white" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Right Form */}
        <div className="flex-1 bg-white px-8 py-10 dark:bg-slate-900">
          {/* Logo */}
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">Nexus<span className="text-indigo-600">Careers</span></span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Already have one?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">Sign in</Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            {/* Two-column grid for name + email */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Full Name *</label>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <input className={inputCls} placeholder="Jane Doe" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrorMessage(null) }} required />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Email Address *</label>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <input type="email" className={inputCls} placeholder="you@example.com" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrorMessage(null) }} required />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Username</label>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                  <input className={inputCls} placeholder="Optional" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Phone</label>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <input className={inputCls} placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Password *</label>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`${inputCls} pr-10`}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                </button>
              </div>
            </div>

            {/* Role & Profile Image row */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">I am a *</label>
                <select
                  className={inputCls2}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                >
                  <option value="JOB_SEEKER">Job Seeker</option>
                  <option value="RECRUITER">Recruiter</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Profile Photo</label>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-xs text-slate-500 transition hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="Preview" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  )}
                  <span>{profileImage?.name ?? 'Upload photo (optional)'}</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                </label>
              </div>
            </div>

            {message && (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                {message}
              </div>
            )}
            {errorMessage && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200/50 transition hover:from-indigo-700 hover:to-blue-700 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Sending OTP...
                </span>
              ) : 'Create Account & Send OTP →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
