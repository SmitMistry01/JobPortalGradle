import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { logout } from '../../features/auth/authSlice'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, token } = useAppSelector((state) => state.auth)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const canSeeJobsNav = !user || user.role === 'JOB_SEEKER'

  const handleLogout = () => {
    dispatch(logout())
    setIsProfileOpen(false)
    navigate('/login')
  }

  const getInitials = (email: string) =>
    email.split('@')[0].split('.').map((part) => part[0].toUpperCase()).join('').slice(0, 2)

  const roleBadge: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    RECRUITER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    JOB_SEEKER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  }

  const roleAvatar: Record<string, string> = {
    ADMIN: 'from-red-500 to-red-600',
    RECRUITER: 'from-blue-500 to-indigo-600',
    JOB_SEEKER: 'from-emerald-500 to-teal-600',
  }

  const navLink = 'relative text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-indigo-500 after:transition-all hover:after:w-full'

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/95">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between py-3.5">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-md shadow-indigo-200/50 dark:shadow-indigo-900/30 transition group-hover:shadow-indigo-300/60">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="hidden text-lg font-extrabold tracking-tight text-slate-900 dark:text-white sm:block">
              Nexus<span className="text-indigo-600 dark:text-indigo-400">Careers</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-7 md:flex">
            <Link to="/" className={navLink}>Home</Link>
            {canSeeJobsNav && <Link to="/jobs" className={navLink}>Jobs</Link>}
            {user?.role === 'JOB_SEEKER' && (
              <Link to="/applications" className={navLink}>Applications</Link>
            )}
            {user?.role === 'RECRUITER' && (
              <Link to="/recruiter" className={navLink}>Dashboard</Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className={navLink}>Admin</Link>
            )}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Auth */}
            {token && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-indigo-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 dark:hover:bg-slate-800"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${roleAvatar[user.role] ?? 'from-slate-500 to-slate-600'} text-xs font-bold text-white`}>
                    {getInitials(user.email)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">{user.email.split('@')[0]}</p>
                    <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${roleBadge[user.role] ?? ''}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                  <svg className="h-3.5 w-3.5 text-slate-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.email}</p>
                      <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleBadge[user.role] ?? ''}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/profile"
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        View Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-800 dark:text-slate-300 dark:hover:border-indigo-600 dark:hover:text-indigo-400">
                    Log in
                  </button>
                </Link>
                <Link to="/register">
                  <button className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200/40 transition hover:from-indigo-700 hover:to-blue-700 dark:shadow-indigo-900/20">
                    Sign Up
                  </button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
            >
              {isMenuOpen ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="border-t border-slate-100 py-4 dark:border-slate-800 md:hidden">
            <nav className="flex flex-col gap-1">
              {[
                { to: '/', label: 'Home' },
                ...(canSeeJobsNav ? [{ to: '/jobs', label: 'Jobs' }] : []),
                ...(user?.role === 'JOB_SEEKER' ? [{ to: '/applications', label: 'Applications' }] : []),
                ...(user?.role === 'RECRUITER' ? [{ to: '/recruiter', label: 'Dashboard' }] : []),
                ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: 'Admin' }] : []),
                ...(token && user ? [{ to: '/profile', label: 'Profile' }] : []),
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {label}
                </Link>
              ))}
              {token && user && (
                <button
                  onClick={handleLogout}
                  className="mt-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 text-left dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Logout
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
