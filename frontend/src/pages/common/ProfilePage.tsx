import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { useAppSelector } from '../../app/hooks'
import { useGetInternalUsersQuery, useUpdateProfileMutation } from '../../features/auth/authApi'
import { profileUpdateSchema } from '../../validation/authSchemas'

function getErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== 'object') return fallback
  const apiError = error as FetchBaseQueryError & { data?: { message?: string; error?: string } }
  return String(apiError.data?.message || apiError.data?.error || fallback)
}

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500'

export function ProfilePage() {
  const authUser = useAppSelector((state) => state.auth.user)
  const { data: users = [], isLoading, error } = useGetInternalUsersQuery()
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation()

  const profile = useMemo(() => {
    if (!authUser) return null
    return users.find((user) => user.id === authUser.userId) ?? null
  }, [authUser, users])

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    setName(profile.name ?? '')
    setPhone(profile.phone ?? '')
  }, [profile])

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setFeedback(null)
    setErrorMessage(null)
    const validation = profileUpdateSchema.safeParse({ name, phone })
    if (!validation.success) { setErrorMessage(validation.error.issues[0]?.message ?? 'Invalid profile details.'); return }
    try {
      await updateProfile({ name: validation.data.name.trim(), phone: validation.data.phone?.trim() || undefined }).unwrap()
      setFeedback('Profile updated successfully.')
    } catch (saveError) {
      setErrorMessage(getErrorMessage(saveError, 'Could not update profile. Please try again.'))
    }
  }

  const roleColors: Record<string, { bg: string; text: string; dot: string }> = {
    ADMIN: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
    RECRUITER: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
    JOB_SEEKER: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  }
  const roleAvatarGradient: Record<string, string> = {
    ADMIN: 'from-red-500 to-rose-600',
    RECRUITER: 'from-blue-500 to-indigo-600',
    JOB_SEEKER: 'from-emerald-500 to-teal-600',
  }

  const role = authUser?.role ?? 'JOB_SEEKER'
  const roleCfg = roleColors[role] ?? roleColors.JOB_SEEKER
  const avatarGradient = roleAvatarGradient[role] ?? 'from-slate-500 to-slate-600'
  const initials = authUser?.email ? authUser.email.split('@')[0].slice(0, 2).toUpperCase() : 'ME'

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Manage your personal information and account settings.</p>
      </div>

      <div className="space-y-5">
        {/* Profile Card / Avatar */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-br from-indigo-500 via-blue-600 to-blue-700" />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-10 mb-4 flex items-end gap-4">
              <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${avatarGradient} text-xl font-extrabold text-white shadow-lg ring-4 ring-white dark:ring-slate-900`}>
                {initials}
              </div>
              {authUser && (
                <div className="mb-1">
                  <p className="font-bold text-slate-900 dark:text-white">{profile?.name || authUser.email.split('@')[0]}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleCfg.bg} ${roleCfg.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${roleCfg.dot}`} />
                      {role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Read-only info */}
            {authUser && (
              <div className="mb-5 grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60 sm:grid-cols-2">
                <div>
                  <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Email Address</p>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{authUser.email}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Account Type</p>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{role.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading / Error */}
            {isLoading && (
              <div className="mb-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <svg className="h-4 w-4 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Loading profile data...
              </div>
            )}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                Could not load profile. Please refresh.
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setFeedback(null); setErrorMessage(null) }}
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setFeedback(null); setErrorMessage(null) }}
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              {feedback && (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                  <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  {feedback}
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
                disabled={isSaving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200/50 transition hover:from-indigo-700 hover:to-blue-700 disabled:opacity-60 dark:shadow-indigo-900/20"
              >
                {isSaving ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Account Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-300">Account Activity</h2>
          <div className="space-y-2">
            {[
              { label: 'Account Status', value: 'Active', icon: '🟢' },
              { label: 'Member Since', value: new Date().getFullYear().toString(), icon: '📅' },
              { label: 'Portal Access', value: role === 'ADMIN' ? 'Full Admin' : role === 'RECRUITER' ? 'Recruiter Portal' : 'Job Seeker Portal', icon: '🔑' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center justify-between rounded-lg px-3 py-2.5 odd:bg-slate-50 dark:odd:bg-slate-800/50">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span>{icon}</span>
                  {label}
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
