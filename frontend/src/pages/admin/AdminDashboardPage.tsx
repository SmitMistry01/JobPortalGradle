import { useMemo, useState } from 'react'
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import {
  useFinalizeHiringMutation,
  useGetAdminJobsQuery,
  useGetAdminReportsQuery,
  useGetAdminUsersQuery,
  useGetHiringConflictsQuery,
  type HiringConflict,
} from '../../features/admin/adminApi'
import { Button } from '../../components/ui/Button'

function valueToText(value: unknown) {
  if (value === null || value === undefined) {
    return 'N/A'
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return JSON.stringify(value)
}

function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : String(value ?? '')
}

function statusRank(status: string) {
  if (status.toUpperCase() === 'HIRED') {
    return 0
  }
  if (status.toUpperCase() === 'SELECTED') {
    return 1
  }
  return 2
}

function toTimestamp(candidate: Record<string, unknown>) {
  const raw = candidate.appliedAt ?? candidate.createdAt ?? candidate.updatedAt
  if (!raw) {
    return 0
  }
  const value = Date.parse(String(raw))
  return Number.isNaN(value) ? 0 : value
}

export function AdminDashboardPage() {
  const {
    data: report,
    isLoading: isReportLoading,
    isError: isReportError,
  } = useGetAdminReportsQuery()
  const {
    data: users,
    isLoading: isUsersLoading,
    isError: isUsersError,
  } = useGetAdminUsersQuery()
  const {
    data: jobs,
    isLoading: isJobsLoading,
    isError: isJobsError,
  } = useGetAdminJobsQuery()
  const {
    data: conflicts,
    isLoading: isConflictsLoading,
    isError: isConflictsError,
  } = useGetHiringConflictsQuery()
  const [finalizeHiring, { isLoading: isFinalizing }] = useFinalizeHiringMutation()

  const [selectedByJob, setSelectedByJob] = useState<Record<number, number[]>>({})
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [enforceExactOpenings, setEnforceExactOpenings] = useState(true)

  const totalUsers = report?.totalUsers ?? users?.length ?? 0
  const totalJobs = report?.totalJobs ?? jobs?.length ?? 0
  const recruiterCount = (users ?? []).filter((user) => String(user.role ?? '').includes('RECRUITER')).length

  const chartData = [
    { name: 'Users', value: totalUsers },
    { name: 'Jobs', value: totalJobs },
    { name: 'Recruiters', value: recruiterCount },
  ]

  const sortedConflicts = useMemo(
    () =>
      [...(conflicts ?? [])].sort((a, b) => {
        if (b.overflowBy !== a.overflowBy) {
          return b.overflowBy - a.overflowBy
        }
        if (b.selectedCount !== a.selectedCount) {
          return b.selectedCount - a.selectedCount
        }
        return a.jobId - b.jobId
      }),
    [conflicts],
  )

  const isLoading = isReportLoading || isUsersLoading || isJobsLoading
  const hasError = isReportError || isUsersError || isJobsError

  function toggleSelection(conflict: HiringConflict, applicationId: number) {
    setSelectedByJob((prev) => {
      const current = prev[conflict.jobId] ?? []
      const exists = current.includes(applicationId)
      if (!exists && current.length >= conflict.openings) {
        setActionMessage(`You can select at most ${conflict.openings} candidates for this job.`)
        return prev
      }
      return {
        ...prev,
        [conflict.jobId]: exists ? current.filter((id) => id !== applicationId) : [...current, applicationId],
      }
    })
  }

  function canFinalize(conflict: HiringConflict) {
    const selectedIds = selectedByJob[conflict.jobId] ?? []
    if (selectedIds.length === 0 || selectedIds.length > conflict.openings) {
      return false
    }
    if (enforceExactOpenings && selectedIds.length !== conflict.openings) {
      return false
    }
    return true
  }

  function finalizeRequirementText(conflict: HiringConflict) {
    const selectedIds = selectedByJob[conflict.jobId] ?? []
    if (selectedIds.length === 0) {
      return 'Pick at least one candidate to finalize.'
    }
    if (selectedIds.length > conflict.openings) {
      return `Pick at most ${conflict.openings} candidates.`
    }
    if (enforceExactOpenings && selectedIds.length !== conflict.openings) {
      const remaining = conflict.openings - selectedIds.length
      return `Select exactly ${conflict.openings} candidates (${remaining} more needed).`
    }
    return 'Ready to finalize.'
  }

  async function finalizeConflict(conflict: HiringConflict) {
    const selectedIds = selectedByJob[conflict.jobId] ?? []

    if (selectedIds.length === 0) {
      setActionMessage('Select candidates to finalize before submitting.')
      return
    }

    if (selectedIds.length > conflict.openings) {
      setActionMessage(`You can finalize at most ${conflict.openings} candidates for this job.`)
      return
    }

    if (enforceExactOpenings && selectedIds.length !== conflict.openings) {
      setActionMessage(`Select exactly ${conflict.openings} candidates to finalize this job.`)
      return
    }

    try {
      const result = await finalizeHiring({
        jobId: conflict.jobId,
        applicationIds: selectedIds,
        enforceExactOpenings,
      }).unwrap()
      setActionMessage(valueToText(result.message) || 'Hiring finalized successfully.')
      setSelectedByJob((prev) => ({ ...prev, [conflict.jobId]: [] }))
    } catch {
      setActionMessage('Could not finalize hiring. Please retry.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-screen-xl px-6 py-8">
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Platform overview and hiring conflict resolution.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          Admin Mode
        </span>
      </div>

      {actionMessage ? (
        <div className="rounded-lg border border-brand-300 bg-brand-50 p-3 text-sm text-brand-700 dark:border-brand-700 dark:bg-brand-950/30 dark:text-brand-300">
          {actionMessage}
        </div>
      ) : null}

      {hasError && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
          Some admin data failed to load. Please refresh and verify admin-service connectivity.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total Users', value: totalUsers, color: 'from-blue-500 to-indigo-600', icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
          { label: 'Total Jobs', value: totalJobs, color: 'from-violet-500 to-purple-600', icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
          { label: 'Recruiters', value: recruiterCount, color: 'from-emerald-500 to-teal-600', icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>{icon}</div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Platform Overview Chart</h2>
        <div className="h-64">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              <svg className="mr-2 h-5 w-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Loading chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={90} fill="#4f46e5" label />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Hiring Conflicts */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Hiring Conflicts (Admin Control)</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Resolve situations where recruiters have over-selected candidates. Finalized candidates are moved to HIRED; others return to SHORTLISTED.
          </p>
        </div>
        <div className="mb-5">
          <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:checked:bg-indigo-500"
              checked={enforceExactOpenings}
              onChange={(event) => setEnforceExactOpenings(event.target.checked)}
            />
            Require exactly all openings to be finalized
          </label>
        </div>

        {isConflictsLoading ? (
          <div className="flex w-full items-center justify-center py-6 text-sm text-slate-500">
            <svg className="mr-2 h-5 w-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Loading conflicts...
          </div>
        ) : null}
        {isConflictsError ? <p className="text-sm text-rose-600">Could not load hiring conflicts.</p> : null}
        {sortedConflicts.length === 0 && !isConflictsLoading ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            No over-selection conflicts found.
          </div>
        ) : null}

        <div className="space-y-4">
          {sortedConflicts.map((conflict) => {
            const selectedIds = selectedByJob[conflict.jobId] ?? []
            const sortedCandidates = [...conflict.candidates].sort((a, b) => {
              const statusDiff = statusRank(asString(a.status)) - statusRank(asString(b.status))
              if (statusDiff !== 0) {
                return statusDiff
              }
              const timeDiff = toTimestamp(b) - toTimestamp(a)
              if (timeDiff !== 0) {
                return timeDiff
              }
              return toNumber(a.id) - toNumber(b.id)
            })

            return (
              <div key={conflict.jobId} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {conflict.title} <span className="font-normal text-slate-500">({conflict.companyName})</span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className="rounded-md bg-slate-200 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Openings: {conflict.openings}</span>
                    <span className="rounded-md bg-amber-200 px-2 py-1 text-amber-800 dark:bg-amber-900 dark:text-amber-300">Selected: {conflict.selectedCount}</span>
                  </div>
                </div>
                
                <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                  Admin pick progress: <strong className="text-slate-900 dark:text-white">{selectedIds.length}/{conflict.openings}</strong>
                  {enforceExactOpenings ? ' (exact match required)' : ' (partial allowed)'}
                </p>

                <div className="mb-4 space-y-2 rounded-lg border border-white/60 bg-white/60 p-3 dark:border-slate-800/80 dark:bg-slate-900/40">
                  {sortedCandidates.map((candidate) => {
                    const applicationId = Number(candidate.id)
                    const checked = selectedIds.includes(applicationId)
                    return (
                      <label key={applicationId} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1 transition hover:bg-white dark:hover:bg-slate-800">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:checked:bg-indigo-500"
                          checked={checked}
                          onChange={() => toggleSelection(conflict, applicationId)}
                        />
                        <div className="flex flex-1 items-center justify-between text-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{valueToText(candidate.userEmail)}</span>
                          <span className="text-xs text-slate-500">#{applicationId} · {valueToText(candidate.status)}</span>
                        </div>
                      </label>
                    )
                  })}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400/80">{finalizeRequirementText(conflict)}</p>
                  <Button 
                    type="button" 
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50"
                    disabled={isFinalizing || !canFinalize(conflict)} 
                    onClick={() => finalizeConflict(conflict)}
                  >
                    {isFinalizing ? 'Finalizing...' : 'Finalize Hiring'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Users</h2>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">View All →</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2">Account Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {(users ?? []).slice(0, 8).map((user, index) => (
                  <tr key={index} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-2 font-medium text-slate-700 dark:text-slate-300">{valueToText(user.email)}</td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {valueToText(user.role).replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {!isUsersLoading && (users ?? []).length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-slate-500 dark:text-slate-400" colSpan={2}>No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Jobs Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Jobs</h2>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">View All →</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-3 px-2">Job Title</th>
                  <th className="py-3 px-2">Company</th>
                  <th className="py-3 px-2 text-right">Openings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {(jobs ?? []).slice(0, 8).map((job, index) => (
                  <tr key={index} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-2 font-medium text-slate-900 dark:text-white">{valueToText(job.title)}</td>
                    <td className="py-3 px-2 text-slate-600 dark:text-slate-400">{valueToText(job.companyName)}</td>
                    <td className="py-3 px-2 text-right text-slate-600 dark:text-slate-400">{valueToText(job.openings)}</td>
                  </tr>
                ))}
                {!isJobsLoading && (jobs ?? []).length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-slate-500 dark:text-slate-400" colSpan={3}>No jobs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
