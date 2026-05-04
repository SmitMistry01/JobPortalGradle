import { useMemo, useState, type FormEvent } from 'react'
import { useAppSelector } from '../../app/hooks'
import {
  useGetApplicationsByJobQuery,
  useUpdateApplicationStatusMutation,
} from '../../features/applications/applicationsApi'
import {
  useCreateJobMutation,
  useDeleteJobMutation,
  useGetJobsQuery,
  useGetRecruiterJobsQuery,
  useUpdateJobMutation,
} from '../../features/jobs/jobsApi'
import type { ApplicationStatus } from '../../types/application'
import type { CreateJobRequest, JobType } from '../../types/job'
import { createJobSchema } from '../../validation/jobSchemas'

const jobTypes: JobType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE']
const statuses: ApplicationStatus[] = ['APPLIED', 'SHORTLISTED', 'REJECTED', 'SELECTED']

function isSelectedLikeStatus(status: ApplicationStatus) {
  return status === 'SELECTED' || status === 'HIRED'
}

const defaultJobForm: CreateJobRequest = {
  title: '',
  companyName: '',
  jobType: 'FULL_TIME',
  location: '',
  salary: undefined,
  experience: undefined,
  description: '',
  openings: 1,
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  APPLIED: { label: 'Applied', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  SHORTLISTED: { label: 'Shortlisted', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  REJECTED: { label: 'Rejected', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  SELECTED: { label: 'Selected', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  HIRED: { label: 'Hired', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
}

function getInitials(email: string) {
  return email.split('@')[0].slice(0, 2).toUpperCase()
}

function avatarColor(email: string) {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
  ]
  const idx = email.charCodeAt(0) % colors.length
  return colors[idx]
}

export function RecruiterDashboardPage() {
  const user = useAppSelector((state) => state.auth.user)
  const recruiterId = user?.userId ?? 0

  const {
    data: recruiterJobs = [],
    isLoading: isLoadingJobs,
    error: jobsError,
  } = useGetRecruiterJobsQuery(recruiterId, { skip: !recruiterId })

  const { data: allJobs = [] } = useGetJobsQuery(undefined, { skip: !recruiterId || !jobsError })

  const [form, setForm] = useState<CreateJobRequest>(defaultJobForm)
  const [editingJobId, setEditingJobId] = useState<number | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [createMessage, setCreateMessage] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [showPostForm, setShowPostForm] = useState(false)

  const [createJob, { isLoading: isCreating }] = useCreateJobMutation()
  const [updateJob, { isLoading: isUpdatingJob }] = useUpdateJobMutation()
  const [deleteJob, { isLoading: isDeletingJob }] = useDeleteJobMutation()
  const [updateStatus, { isLoading: isUpdating }] = useUpdateApplicationStatusMutation()

  const {
    data: applications = [],
    isFetching: isLoadingApplications,
    error: applicationsError,
  } = useGetApplicationsByJobQuery(selectedJobId ?? 0, { skip: !selectedJobId })

  const jobs = useMemo(() => {
    if (!jobsError) return recruiterJobs
    return allJobs.filter((job) => job.recruiterId === recruiterId || job.postedBy === recruiterId)
  }, [allJobs, jobsError, recruiterId, recruiterJobs])

  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedJobId) ?? null, [jobs, selectedJobId])

  const selectedLikeCount = useMemo(
    () => applications.filter((a) => isSelectedLikeStatus(a.status)).length,
    [applications],
  )

  const selectedOpenings = selectedJob?.openings ?? 1
  const remainingSlots = Math.max(0, selectedOpenings - selectedLikeCount)

  const shortlistedCount = applications.filter((a) => a.status === 'SHORTLISTED').length
  const hiredCount = applications.filter((a) => a.status === 'HIRED' || a.status === 'SELECTED').length

  async function handleCreateJob(event: FormEvent) {
    event.preventDefault()
    setCreateMessage(null)
    setCreateError(null)

    const validation = createJobSchema.safeParse({
      title: form.title,
      companyName: form.companyName,
      jobType: form.jobType,
      location: form.location,
      salary: form.salary,
      experience: form.experience,
      description: form.description,
      openings: form.openings ?? 1,
    })

    if (!validation.success) {
      setCreateError(validation.error.issues[0]?.message ?? 'Invalid job form data.')
      return
    }

    try {
      const payload = {
        ...validation.data,
        title: validation.data.title.trim(),
        companyName: validation.data.companyName.trim(),
        location: validation.data.location.trim(),
        description: validation.data.description.trim(),
      }

      if (editingJobId) {
        await updateJob({ id: editingJobId, body: payload }).unwrap()
        setCreateMessage('Job updated successfully.')
      } else {
        await createJob(payload).unwrap()
        setCreateMessage('Job posted successfully.')
      }

      setForm(defaultJobForm)
      setEditingJobId(null)
      setShowPostForm(false)
    } catch {
      setCreateError(editingJobId ? 'Could not update job.' : 'Could not post job. Please try again.')
    }
  }

  function handleEditJob(jobId: number) {
    const job = jobs.find((item) => item.id === jobId)
    if (!job) return
    setEditingJobId(jobId)
    setCreateMessage(null)
    setCreateError(null)
    setShowPostForm(true)
    setForm({
      title: job.title,
      companyName: job.companyName,
      jobType: (job.jobType as JobType) || 'FULL_TIME',
      location: job.location,
      salary: job.salary,
      experience: job.experience,
      description: job.description,
      openings: job.openings ?? 1,
    })
  }

  async function handleDeleteJob(jobId: number) {
    setCreateMessage(null)
    setCreateError(null)
    try {
      await deleteJob(jobId).unwrap()
      if (editingJobId === jobId) { setEditingJobId(null); setForm(defaultJobForm) }
      if (selectedJobId === jobId) setSelectedJobId(null)
      setCreateMessage('Job deleted successfully.')
    } catch {
      setCreateError('Could not delete job. Please try again.')
    }
  }

  async function handleStatusChange(applicationId: number, status: ApplicationStatus, currentStatus: ApplicationStatus) {
    if (status === 'SELECTED' && !isSelectedLikeStatus(currentStatus) && selectedLikeCount >= selectedOpenings) {
      setSelectionError(`Cannot mark more than ${selectedOpenings} candidates as SELECTED/HIRED.`)
      return
    }
    setSelectionError(null)
    try {
      await updateStatus({ applicationId, status }).unwrap()
    } catch {
      // no-op
    }
  }

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:bg-slate-800'
  const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'

  return (
    <div className="mx-auto w-full max-w-screen-xl px-6 py-8">
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recruiter Hiring Pipeline</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Post jobs, review applicants, and manage application status.</p>
        </div>
        <button
          onClick={() => { setShowPostForm((v) => !v); setEditingJobId(null); setForm(defaultJobForm); setCreateMessage(null); setCreateError(null) }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-700 hover:to-blue-700 dark:shadow-indigo-900/30"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showPostForm ? 'Hide Form' : 'Post New Job'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Active Jobs', value: jobs.length, icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          ), color: 'from-blue-500 to-indigo-600', light: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
          { label: 'Total Applicants', value: applications.length, icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          ), color: 'from-violet-500 to-purple-600', light: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400' },
          { label: 'Shortlisted', value: shortlistedCount, icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          ), color: 'from-amber-500 to-orange-500', light: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
          { label: 'Hired', value: hiredCount, icon: (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
          ), color: 'from-emerald-500 to-teal-500', light: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' },
        ].map((stat, idx) => (
          <div key={idx} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${stat.light}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Feedback Toasts */}
      {createMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          {createMessage}
        </div>
      )}
      {createError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          {createError}
        </div>
      )}

      {/* Post / Edit Job Form */}
      {showPostForm && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {editingJobId ? `Edit Job #${editingJobId}` : 'Post a New Job'}
            </h2>
            {editingJobId && <p className="mt-0.5 text-xs text-amber-500">Editing existing listing</p>}
          </div>

          <form onSubmit={handleCreateJob} className="p-6">
            <div className="mx-auto max-w-2xl space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Job Title *</label>
                  <input className={inputCls} placeholder="e.g. Senior React Developer" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Company Name *</label>
                  <input className={inputCls} placeholder="e.g. Tech Innovations Pvt Ltd" value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Job Type</label>
                  <select className={inputCls} value={form.jobType} onChange={(e) => setForm((p) => ({ ...p, jobType: e.target.value as JobType }))}>
                    {jobTypes.map((type) => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Location *</label>
                  <div className="relative">
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <input className={`${inputCls} pl-9`} placeholder="e.g. Bangalore, Remote" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Salary (INR / month)</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
                    <input type="number" className={`${inputCls} pl-7`} placeholder="e.g. 80000" value={form.salary ?? ''} onChange={(e) => setForm((p) => ({ ...p, salary: e.target.value ? Number(e.target.value) : undefined }))} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Experience (years)</label>
                  <input type="number" className={inputCls} placeholder="e.g. 3" value={form.experience ?? ''} onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value ? Number(e.target.value) : undefined }))} />
                </div>
                <div>
                  <label className={labelCls}>No. of Openings</label>
                  <input type="number" min={1} className={inputCls} value={form.openings ?? 1} onChange={(e) => setForm((p) => ({ ...p, openings: e.target.value ? Number(e.target.value) : 1 }))} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Job Description *</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={5}
                  placeholder="Describe the role, responsibilities, requirements, and benefits..."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isCreating || isUpdatingJob}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 dark:shadow-indigo-900/20"
                >
                  {(isCreating || isUpdatingJob) ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  )}
                  {editingJobId ? 'Save Changes' : 'Post Job'}
                </button>
                {editingJobId && (
                  <button
                    type="button"
                    onClick={() => { setEditingJobId(null); setForm(defaultJobForm); setCreateMessage(null); setCreateError(null); setShowPostForm(false) }}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        </section>
      )}

      {/* My Jobs — Table Style */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Your Job Listings
            <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{jobs.length}</span>
          </h2>
        </div>
        {isLoadingJobs && (
          <div className="flex items-center gap-3 px-6 py-8 text-sm text-slate-500">
            <svg className="h-4 w-4 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Loading jobs...
          </div>
        )}
        {!isLoadingJobs && jobs.length === 0 && (
          <div className="py-16 text-center">
            <svg className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            <p className="text-sm font-medium text-slate-500">No jobs posted yet.</p>
            <p className="mt-1 text-xs text-slate-400">Click "Post New Job" to create your first listing.</p>
          </div>
        )}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {jobs.map((job) => (
            <div key={job.id} className={`flex flex-col gap-3 px-6 py-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between ${selectedJobId === job.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-bold text-white">
                  {job.title.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">{job.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{job.companyName}</span>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {job.location}
                    </div>
                    {job.salary && (
                      <>
                        <span>·</span>
                        <span>₹{job.salary.toLocaleString()}/mo</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                  {(job.jobType ?? 'N/A').replace(/_/g, ' ')}
                </span>
                <button
                  onClick={() => setSelectedJobId(selectedJobId === job.id ? null : job.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-600 dark:hover:text-indigo-400"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0" /></svg>
                  Applicants
                </button>
                <button
                  onClick={() => handleEditJob(job.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteJob(job.id)}
                  disabled={isDeletingJob}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Applicants Panel */}
      {selectedJob && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Applicants
                <span className="text-slate-400 dark:text-slate-500">for</span>
                <span className="text-indigo-600 dark:text-indigo-400">{selectedJob.title}</span>
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Selected/Hired: <strong>{selectedLikeCount}</strong>/{selectedOpenings} &nbsp;·&nbsp;
                {remainingSlots > 0 ? `${remainingSlots} slots remaining` : 'No slots left'}
              </p>
            </div>
            {selectedLikeCount > selectedOpenings && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                Over-selected by {selectedLikeCount - selectedOpenings}
              </div>
            )}
          </div>

          {selectionError && (
            <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {selectionError}
            </div>
          )}

          {isLoadingApplications && (
            <div className="flex items-center gap-3 px-6 py-8 text-sm text-slate-500">
              <svg className="h-4 w-4 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Loading applicants...
            </div>
          )}
          {applicationsError && (
            <p className="px-6 py-4 text-sm text-red-600 dark:text-red-400">Could not load applicants.</p>
          )}

          {/* Applicant Rows */}
          {applications.length > 0 && (
            <>
              {/* Table Header */}
              <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-slate-100 px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:grid">
                <span>Candidate</span>
                <span className="text-center">Resume</span>
                <span className="text-center">Applied</span>
                <span className="text-center">ATS Score</span>
                <span className="text-center">Status</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {applications.map((application) => {
                  const cfg = statusConfig[application.status] ?? statusConfig.APPLIED
                  return (
                    <div key={application.id} className="grid gap-3 px-6 py-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/20 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                      {/* Candidate */}
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(application.userEmail)} text-sm font-bold text-white`}>
                          {getInitials(application.userEmail)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{application.userEmail.split('@')[0]}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{application.userEmail}</p>
                        </div>
                      </div>

                      {/* Resume */}
                      <div className="flex justify-start sm:justify-center">
                        <a
                          href={application.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          View CV
                        </a>
                      </div>

                      {/* Applied date */}
                      <div className="text-xs text-slate-500 dark:text-slate-400 sm:text-center">
                        {new Date(application.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>

                      {/* ATS Score */}
                      <div className="flex flex-col items-center justify-center sm:text-center">
                        {application.atsScore !== undefined && application.atsScore !== null ? (
                          <div className="group relative flex items-center gap-1.5">
                            <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              application.atsScore >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                              application.atsScore >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {application.atsScore}%
                            </span>
                            {application.atsFeedback && (
                              <div className="absolute bottom-full left-1/2 mb-2 hidden w-48 -translate-x-1/2 rounded-lg bg-slate-800 p-2 text-xs text-white shadow-xl group-hover:block dark:bg-slate-700 z-10">
                                {application.atsFeedback}
                                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </div>

                      {/* Status dropdown */}
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full ${cfg.bg} ${cfg.text} px-3 py-1 text-xs font-semibold`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        {application.status !== 'HIRED' && (
                          <select
                            className="rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-7 text-xs text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            value={application.status}
                            onChange={(e) => handleStatusChange(application.id, e.target.value as ApplicationStatus, application.status)}
                            disabled={isUpdating}
                          >
                            {statuses.map((s) => (
                              <option
                                key={s}
                                value={s}
                                disabled={s === 'SELECTED' && selectedLikeCount >= selectedOpenings && !isSelectedLikeStatus(application.status)}
                              >
                                {s}
                              </option>
                            ))}
                          </select>
                        )}
                        {application.status === 'HIRED' && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">Locked</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {!isLoadingApplications && applications.length === 0 && (
            <div className="py-16 text-center">
              <svg className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <p className="text-sm text-slate-500">No applications yet for this job.</p>
            </div>
          )}
        </section>
      )}
    </div>
    </div>
  )
}
