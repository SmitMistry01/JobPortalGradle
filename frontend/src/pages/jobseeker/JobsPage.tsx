import { useMemo, useState, type FormEvent, type ReactElement } from 'react'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { useApplyWithResumeMutation, useLazyGetMyApplicationsQuery } from '../../features/applications/applicationsApi'
import { useGetJobsQuery } from '../../features/jobs/jobsApi'
import type { JobSearchFilters, JobType } from '../../types/job'
import { applyResumeSchema } from '../../validation/jobSchemas'

const jobTypes: JobType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE']

const jobTypeIcons: Record<string, ReactElement> = {
  FULL_TIME: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  PART_TIME: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  CONTRACT: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  INTERNSHIP: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
  REMOTE: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
}

function getErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== 'object') return fallback
  const apiError = error as FetchBaseQueryError & { data?: { message?: string; error?: string } }
  const message = apiError.data?.message || apiError.data?.error
  return message ? String(message) : fallback
}

function isServiceUnavailable(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const apiError = error as FetchBaseQueryError & { data?: { message?: string } }
  if (apiError.status === 503) return true
  const message = apiError.data?.message?.toLowerCase() ?? ''
  return message.includes('temporarily unavailable')
}

function avatarColor(name: string) {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
  ]
  return colors[name.charCodeAt(0) % colors.length]
}

export function JobsPage() {
  const [filters, setFilters] = useState<JobSearchFilters>({})
  const [draftFilters, setDraftFilters] = useState<JobSearchFilters>({})
  const { data: jobs = [], isLoading, isFetching, error } = useGetJobsQuery(filters)

  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [applyWithResume, { isLoading: isApplying }] = useApplyWithResumeMutation()
  const [fetchMyApplications] = useLazyGetMyApplicationsQuery()

  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedJobId) ?? null, [jobs, selectedJobId])

  function applyFilters(event: FormEvent) {
    event.preventDefault()
    setFilters(draftFilters)
  }

  function resetFilters() {
    setDraftFilters({})
    setFilters({})
  }

  async function handleApply(event: FormEvent) {
    event.preventDefault()
    setFeedback(null)
    setErrorMessage(null)

    const validation = applyResumeSchema.safeParse({ jobId: selectedJobId, resume: resumeFile })
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message ?? 'Please select a job and upload your resume.')
      return
    }

    try {
      await applyWithResume({ jobId: validation.data.jobId, resume: validation.data.resume }).unwrap()
      setFeedback('Application submitted successfully.')
      setSelectedJobId(null)
      setResumeFile(null)
    } catch (submitError) {
      if (isServiceUnavailable(submitError)) {
        try {
          const myApplications = await fetchMyApplications().unwrap()
          if (myApplications.some((a) => a.jobId === selectedJobId)) {
            setFeedback('Application submitted successfully. Confirmed in your applications list.')
            setSelectedJobId(null)
            setResumeFile(null)
            return
          }
        } catch {
          // ignore
        }
      }
      setErrorMessage(getErrorMessage(submitError, 'Could not submit application. Please try again.'))
    }
  }

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500'

  return (
    <div className="mx-auto w-full max-w-screen-xl px-6 py-8">
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Find Jobs</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {isLoading ? 'Searching...' : `${jobs.length} job${jobs.length !== 1 ? 's' : ''} found — filter to narrow results`}
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          {feedback}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          {errorMessage}
        </div>
      )}

      <div className="flex gap-6">
        {/* ── LEFT FILTER PANEL ── */}
        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <form onSubmit={applyFilters} className="sticky top-24 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Panel Header */}
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <svg className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter By
              </h2>
              <button type="button" onClick={resetFilters} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                Clear all
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Title</label>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  className={`${inputCls} pl-9`}
                  placeholder="e.g. React Developer"
                  value={draftFilters.title ?? ''}
                  onChange={(e) => setDraftFilters((p) => ({ ...p, title: e.target.value || undefined }))}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Location</label>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <input
                  className={`${inputCls} pl-9`}
                  placeholder="e.g. Bangalore"
                  value={draftFilters.location ?? ''}
                  onChange={(e) => setDraftFilters((p) => ({ ...p, location: e.target.value || undefined }))}
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Company</label>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                <input
                  className={`${inputCls} pl-9`}
                  placeholder="Company name"
                  value={draftFilters.companyName ?? ''}
                  onChange={(e) => setDraftFilters((p) => ({ ...p, companyName: e.target.value || undefined }))}
                />
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Salary (INR/mo)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className={inputCls}
                  placeholder="Min"
                  value={draftFilters.minSalary ?? ''}
                  onChange={(e) => setDraftFilters((p) => ({ ...p, minSalary: e.target.value ? Number(e.target.value) : undefined }))}
                />
                <input
                  type="number"
                  className={inputCls}
                  placeholder="Max"
                  value={draftFilters.maxSalary ?? ''}
                  onChange={(e) => setDraftFilters((p) => ({ ...p, maxSalary: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Experience (yrs)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className={inputCls}
                  placeholder="Min"
                  value={draftFilters.minExperience ?? ''}
                  onChange={(e) => setDraftFilters((p) => ({ ...p, minExperience: e.target.value ? Number(e.target.value) : undefined }))}
                />
                <input
                  type="number"
                  className={inputCls}
                  placeholder="Max"
                  value={draftFilters.maxExperience ?? ''}
                  onChange={(e) => setDraftFilters((p) => ({ ...p, maxExperience: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
            </div>

            {/* Job Type */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Job Type</label>
              <div className="space-y-1.5">
                {jobTypes.map((type) => (
                  <label
                    key={type}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      draftFilters.jobType === type
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="jobType"
                      className="sr-only"
                      checked={draftFilters.jobType === type}
                      onChange={() => setDraftFilters((p) => ({ ...p, jobType: type }))}
                    />
                    <span className={draftFilters.jobType === type ? 'text-indigo-500' : 'text-slate-400'}>
                      {jobTypeIcons[type]}
                    </span>
                    <span className="font-medium">{type.replace(/_/g, ' ')}</span>
                    {draftFilters.jobType === type && (
                      <svg className="ml-auto h-4 w-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                ))}
                {draftFilters.jobType && (
                  <button
                    type="button"
                    onClick={() => setDraftFilters((p) => ({ ...p, jobType: undefined }))}
                    className="mt-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    Clear type
                  </button>
                )}
              </div>
            </div>

            {/* Apply Button */}
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200/50 transition hover:from-indigo-700 hover:to-blue-700 dark:shadow-indigo-900/20"
            >
              Apply Filters
            </button>
          </form>
        </aside>

        {/* ── RIGHT JOBS PANEL ── */}
        <div className="min-w-0 flex-1">
          {/* Active Filter Pills */}
          {Object.keys(filters).length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {filters.title && <Chip label={`Title: ${filters.title}`} onRemove={() => setFilters((p) => { const n = { ...p }; delete n.title; return n })} />}
              {filters.location && <Chip label={`📍 ${filters.location}`} onRemove={() => setFilters((p) => { const n = { ...p }; delete n.location; return n })} />}
              {filters.companyName && <Chip label={`🏢 ${filters.companyName}`} onRemove={() => setFilters((p) => { const n = { ...p }; delete n.companyName; return n })} />}
              {filters.jobType && <Chip label={filters.jobType.replace(/_/g, ' ')} onRemove={() => setFilters((p) => { const n = { ...p }; delete n.jobType; return n })} />}
              {filters.minSalary !== undefined && <Chip label={`Min ₹${filters.minSalary}`} onRemove={() => setFilters((p) => { const n = { ...p }; delete n.minSalary; return n })} />}
              {filters.maxSalary !== undefined && <Chip label={`Max ₹${filters.maxSalary}`} onRemove={() => setFilters((p) => { const n = { ...p }; delete n.maxSalary; return n })} />}
            </div>
          )}

          {/* Mobile Filters Summary */}
          <div className="mb-4 lg:hidden">
            <form onSubmit={applyFilters} className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-4">
              <input className={inputCls} placeholder="Title" value={draftFilters.title ?? ''} onChange={(e) => setDraftFilters((p) => ({ ...p, title: e.target.value || undefined }))} />
              <input className={inputCls} placeholder="Location" value={draftFilters.location ?? ''} onChange={(e) => setDraftFilters((p) => ({ ...p, location: e.target.value || undefined }))} />
              <select className={inputCls} value={draftFilters.jobType ?? ''} onChange={(e) => setDraftFilters((p) => ({ ...p, jobType: (e.target.value || undefined) as JobType | undefined }))}>
                <option value="">All types</option>
                {jobTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700">Filter</button>
                <button type="button" onClick={resetFilters} className="rounded-xl border border-slate-200 px-3 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400">Reset</button>
              </div>
            </form>
          </div>

          {/* Loading / Error */}
          {(isLoading || isFetching) && (
            <div className="flex items-center gap-3 py-8 text-sm text-slate-500">
              <svg className="h-5 w-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Loading jobs...
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              Could not fetch jobs. Please try again.
            </div>
          )}

          {/* Job Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <article key={job.id} className="group flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <div className="flex-1 p-5">
                  {/* Card Header */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarColor(job.title)} text-base font-bold text-white`}>
                      {job.title.charAt(0).toUpperCase()}
                    </div>
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                      {(job.jobType ?? 'N/A').replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h2 className="mb-0.5 text-base font-bold text-slate-900 dark:text-white">{job.title}</h2>
                  <p className="mb-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">{job.companyName}</p>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {job.salary ? `₹${job.salary.toLocaleString()}/mo` : 'Not specified'}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      {job.experience ?? 0}+ yrs exp required
                    </div>
                  </div>

                  {job.description && (
                    <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{job.description}</p>
                  )}
                </div>

                <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setSelectedJobId(job.id); setFeedback(null); setErrorMessage(null) }}
                    className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200/50 transition hover:from-indigo-700 hover:to-blue-700 dark:shadow-indigo-900/20"
                  >
                    Apply with Resume
                  </button>
                </div>
              </article>
            ))}

            {jobs.length === 0 && !isLoading && (
              <div className="col-span-full py-20 text-center">
                <svg className="mx-auto mb-4 h-16 w-16 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No jobs matched your filters.</p>
                <p className="mt-1 text-xs text-slate-400">Try adjusting your search criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal / Panel */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" onClick={(e) => { if (e.target === e.currentTarget) setSelectedJobId(null) }}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedJobId(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setSelectedJobId(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Apply: {selectedJob.title}</h3>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{selectedJob.companyName} · {selectedJob.location}</p>
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Upload Resume</label>
                <div className="relative flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/30 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500">
                  <div>
                    <svg className="mx-auto mb-2 h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {resumeFile ? <span className="font-medium text-indigo-600 dark:text-indigo-400">{resumeFile.name}</span> : 'Click to upload or drag & drop'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">PDF, DOC, DOCX up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isApplying || !resumeFile}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50 transition hover:from-indigo-700 hover:to-blue-700"
                >
                  {isApplying ? (
                    <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Submitting...</>
                  ) : 'Submit Application'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedJobId(null)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
      {label}
      <button type="button" onClick={onRemove} className="hover:text-indigo-900 dark:hover:text-indigo-100">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </span>
  )
}
