import { baseApi } from '../../services/baseApi'
import type { CreateJobRequest, Job, JobSearchFilters } from '../../types/job'

function sanitizeFilters(filters?: JobSearchFilters) {
  if (!filters) {
    return undefined
  }

  const params: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') {
      continue
    }
    params[key] = value
  }
  return params
}

export const jobsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJobs: builder.query<Job[], JobSearchFilters | undefined>({
      query: (filters) => ({
        url: '/jobs/search',
        params: sanitizeFilters(filters),
      }),
      providesTags: ['Auth'],
    }),
    getJobById: builder.query<Job, number>({
      query: (id) => `/jobs/${id}`,
      providesTags: ['Auth'],
    }),
    getRecruiterJobs: builder.query<Job[], number>({
      query: (recruiterId) => `/jobs/recruiter/${recruiterId}`,
      providesTags: ['Auth'],
    }),
    createJob: builder.mutation<Job, CreateJobRequest>({
      query: (body) => ({
        url: '/jobs',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
    updateJob: builder.mutation<Job, { id: number; body: CreateJobRequest }>({
      query: ({ id, body }) => ({
        url: `/jobs/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
    deleteJob: builder.mutation<void, number>({
      query: (id) => ({
        url: `/jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Auth'],
    }),
    getRecommendedJobs: builder.query<Job[], string[]>({
      query: (skills) => ({
        url: '/jobs/recommended',
        params: { skills: skills.join(',') },
      }),
      providesTags: ['Auth'],
    }),
  }),
})

export const {
  useGetJobsQuery,
  useGetJobByIdQuery,
  useGetRecruiterJobsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useGetRecommendedJobsQuery,
} = jobsApi


