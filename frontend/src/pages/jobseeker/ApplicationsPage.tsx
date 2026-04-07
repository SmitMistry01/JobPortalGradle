import { useMemo, useState, type ReactElement } from 'react'
import { useGetMyApplicationsQuery, useReplaceResumeMutation } from '../../features/applications/applicationsApi'
import { useGetJobsQuery } from '../../features/jobs/jobsApi'

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string; icon: ReactElement }> = {
  APPLIED: {
    label: 'Applied',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ),
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
    ),
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ),
  },
  SELECTED: {
    label: 'Selected',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
    ),
  },
  HIRED: {
    label: 'Hired',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
    ),
  },
}

export function ApplicationsPage() {
  const { data: applications = [], isLoading, error } = useGetMyApplicationsQuery()
  const [replaceResume, { isLoading: isReplacingResume }] = useReplaceResumeMutation()
  const [resumeDrafts, setResumeDrafts] = useState<Record<number, File | null>>({})
  const [feedback, setFeedback] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const { data: jobs = [] } = useGetJobsQuery({})

  const jobMap = useMemo(() => {
    const map = new Map<number, { title: string; companyName: string }>()
    for (const job of jobs) map.set(job.id, { title: job.title, companyName: job.companyName })
    return map
  }, [jobs])

  async function handleReplaceResume(applicationId: number) {
    const resume = resumeDrafts[applicationId]
    if (!resume) { setErrorMessage('Please select a resume file first.'); return }
    setFeedback(null)
    setErrorMessage(null)
    try {
      await replaceResume({ applicationId, resume }).unwrap()
      setFeedback('Resume updated successfully.')
      setResumeDrafts((prev) => ({ ...prev, [applicationId]: null }))
    } catch {
      setErrorMessage('Could not update resume. Please try again.')
    }
  }

  const statusOrder = ['APPLIED', 'SHORTLISTED', 'SELECTED', 'HIRED', 'REJECTED']
  const sorted = [...applications].sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status))

  return (
    <div className="mx-auto w-full max-w-screen-xl px-6 py-8">
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Applications</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track your application status and manage uploaded resumes.</p>
        </div>
        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
          {applications.length} total
        </span>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          {feedback}
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-3 py-8 text-sm text-slate-500">
          <svg className="h-5 w-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          Loading your applications...
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          Could not load applications.
        </div>
      )}

      {/* Applications List */}
      <div className="space-y-3">
        {sorted.map((application) => {
          const jobInfo = jobMap.get(application.jobId)
          const cfg = statusConfig[application.status] ?? statusConfig.APPLIED
          const isExpanded = expandedId === application.id

          return (
            <article
              key={application.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Card Top */}
              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-bold text-white">
                    {(jobInfo?.title ?? 'J').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-slate-900 dark:text-white">{jobInfo?.title ?? `Job #${application.jobId}`}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{jobInfo?.companyName ?? 'Company unavailable'}</p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <div className={`hidden items-center gap-1.5 rounded-full ${cfg.bg} ${cfg.text} px-3 py-1 text-xs font-semibold sm:flex`}>
                    {cfg.icon}
                    {cfg.label}
                  </div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : application.id)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  >
                    {isExpanded ? 'Hide' : 'Details'}
                  </button>
                </div>
              </div>

              {/* Status bar */}
              <div className="mx-5 mb-4">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {['APPLIED', 'SHORTLISTED', 'SELECTED', 'HIRED'].map((step, idx) => {
                    const stepOrder = ['APPLIED', 'SHORTLISTED', 'SELECTED', 'HIRED']
                    const currentIdx = stepOrder.indexOf(application.status)
                    const isActive = idx <= currentIdx
                    const isRejected = application.status === 'REJECTED'
                    return (
                      <div key={step} className="flex items-center">
                        <div className={`flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ${
                          isRejected && idx === 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                          isActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' :
                          'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                        }`}>
                          {isActive && !isRejected && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                          {isRejected && idx === 0 && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                          {step.charAt(0) + step.slice(1).toLowerCase()}
                        </div>
                        {idx < 3 && <div className={`mx-1 h-0.5 w-4 rounded-full ${isActive && idx < currentIdx && !isRejected ? 'bg-indigo-300 dark:bg-indigo-700' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                      </div>
                    )
                  })}
                  {application.status === 'REJECTED' && (
                    <div className="ml-2 flex h-7 items-center gap-1.5 rounded-full bg-red-100 px-2.5 text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      Rejected
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                  <div className="mb-4 grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Applied On</p>
                      <p className="mt-1 text-slate-700 dark:text-slate-300">
                        {new Date(application.appliedAt).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Resume</p>
                      <a
                        href={application.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        View Resume
                      </a>
                    </div>
                  </div>

                  {/* Replace Resume */}
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                    <p className="mb-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Replace Resume</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <svg className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        {resumeDrafts[application.id]?.name ?? 'Choose file'}
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            setResumeDrafts((prev) => ({ ...prev, [application.id]: file }))
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        disabled={isReplacingResume || !resumeDrafts[application.id]}
                        onClick={() => handleReplaceResume(application.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isReplacingResume ? (
                          <><svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /></svg>Updating...</>
                        ) : 'Update Resume'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </article>
          )
        })}

        {!isLoading && applications.length === 0 && (
          <div className="py-20 text-center">
            <svg className="mx-auto mb-4 h-16 w-16 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No applications yet.</p>
            <p className="mt-1 text-xs text-slate-400">Browse jobs and apply to get started!</p>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
