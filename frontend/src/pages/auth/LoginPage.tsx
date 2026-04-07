import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../app/hooks'
import { useLoginMutation } from '../../features/auth/authApi'
import { setCredentials } from '../../features/auth/authSlice'
import { loginSchema } from '../../validation/authSchemas'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [login, { isLoading, error }] = useLoginMutation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const validation = loginSchema.safeParse({ email, password })
    if (!validation.success) return
    const result = await login(validation.data).unwrap()
    dispatch(setCredentials(result))
    if (result.role === 'ADMIN') navigate('/admin')
    else if (result.role === 'RECRUITER') navigate('/recruiter')
    else navigate('/jobs')
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl shadow-2xl shadow-indigo-100/30 dark:shadow-indigo-900/20">
        {/* Left Illustration */}
        <div className="hidden flex-1 flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 p-12 lg:flex">
          {/* SVG Illustration */}
          <svg viewBox="0 0 340 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-64 opacity-90">
            {/* Background circles */}
            <circle cx="170" cy="140" r="120" fill="white" fillOpacity="0.06" />
            <circle cx="170" cy="140" r="80" fill="white" fillOpacity="0.06" />
            {/* Briefcase */}
            <rect x="90" y="110" width="160" height="110" rx="12" fill="white" fillOpacity="0.15" />
            <rect x="90" y="110" width="160" height="110" rx="12" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
            <rect x="130" y="95" width="80" height="25" rx="8" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
            {/* Handle */}
            <path d="M 148 95 L 148 85 Q 148 78 170 78 Q 192 78 192 85 L 192 95" stroke="white" strokeWidth="2" strokeOpacity="0.6" fill="none" />
            {/* Divider */}
            <line x1="90" y1="148" x2="250" y2="148" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
            {/* Lock icon on briefcase */}
            <circle cx="170" cy="165" r="12" fill="white" fillOpacity="0.3" />
            <circle cx="170" cy="162" r="5" stroke="white" strokeWidth="2" strokeOpacity="0.9" fill="none" />
            <rect x="164" y="164" width="12" height="9" rx="2" fill="white" fillOpacity="0.9" />
            {/* Stars */}
            <circle cx="60" cy="80" r="4" fill="white" fillOpacity="0.5" />
            <circle cx="290" cy="100" r="3" fill="white" fillOpacity="0.4" />
            <circle cx="80" cy="200" r="5" fill="white" fillOpacity="0.3" />
            <circle cx="285" cy="210" r="4" fill="white" fillOpacity="0.5" />
            {/* Floating cards */}
            <rect x="38" y="120" width="45" height="28" rx="6" fill="white" fillOpacity="0.12" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
            <rect x="257" y="130" width="45" height="28" rx="6" fill="white" fillOpacity="0.12" stroke="white" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="45" y1="131" x2="75" y2="131" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />
            <line x1="45" y1="139" x2="65" y2="139" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" />
            <line x1="264" y1="141" x2="294" y2="141" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />
            <line x1="264" y1="149" x2="284" y2="149" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" />
          </svg>

          <div className="mt-8 text-center">
            <h2 className="text-2xl font-bold text-white">Welcome Back!</h2>
            <p className="mt-2 text-sm text-indigo-200">Sign in to access your dashboard and continue your journey.</p>
          </div>

          <div className="mt-10 space-y-3 w-full max-w-xs">
            {[
              { icon: '🎯', text: 'Access your personalized dashboard' },
              { icon: '📋', text: 'Track your job applications' },
              { icon: '🔔', text: 'Get real-time status updates' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                <span className="text-lg">{icon}</span>
                <span className="text-sm text-indigo-100">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Form */}
        <div className="flex flex-1 flex-col justify-center bg-white px-8 py-12 dark:bg-slate-900 lg:px-12">
          {/* Logo mini */}
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Nexus<span className="text-indigo-600">Careers</span>
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Sign in</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
              Create one for free
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {/* Email */}
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

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPass ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                Invalid email or password. Please try again.
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200/50 transition hover:from-indigo-700 hover:to-blue-700 disabled:opacity-60 dark:shadow-indigo-900/20"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2.5">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
