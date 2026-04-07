import { baseApi } from '../../services/baseApi'

export type AdminUser = Record<string, unknown>
export type AdminJob = Record<string, unknown>

export interface AdminReport {
  totalUsers?: number
  totalJobs?: number
}

export interface HiringConflict {
  jobId: number
  title: string
  companyName: string
  openings: number
  selectedCount: number
  overflowBy: number
  candidates: Array<Record<string, unknown>>
}

interface FinalizeHiringRequest {
  jobId: number
  applicationIds: number[]
  enforceExactOpenings?: boolean
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminUsers: builder.query<AdminUser[], void>({
      query: () => '/admin/users',
      providesTags: ['Auth'],
    }),
    getAdminJobs: builder.query<AdminJob[], void>({
      query: () => '/admin/jobs',
      providesTags: ['Auth'],
    }),
    getAdminReports: builder.query<AdminReport, void>({
      query: () => '/admin/reports',
      providesTags: ['Auth'],
    }),
    getHiringConflicts: builder.query<HiringConflict[], void>({
      query: () => '/admin/hiring/conflicts',
      providesTags: ['Auth'],
    }),
    finalizeHiring: builder.mutation<Record<string, unknown>, FinalizeHiringRequest>({
      query: (body) => ({
        url: '/admin/hiring/finalize',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
})

export const {
  useGetAdminUsersQuery,
  useGetAdminJobsQuery,
  useGetAdminReportsQuery,
  useGetHiringConflictsQuery,
  useFinalizeHiringMutation,
} = adminApi
