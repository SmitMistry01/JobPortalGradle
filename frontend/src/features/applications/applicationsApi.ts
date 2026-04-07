import { baseApi } from '../../services/baseApi'
import type { ApplicationStatus, JobApplication } from '../../types/application'

interface ApplyWithResumeRequest {
  jobId: number
  resume: File
}

interface UpdateStatusRequest {
  applicationId: number
  status: ApplicationStatus
}

interface ReplaceResumeRequest {
  applicationId: number
  resume: File
}

export const applicationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    applyWithResume: builder.mutation<JobApplication, ApplyWithResumeRequest>({
      query: ({ jobId, resume }) => {
        const formData = new FormData()
        formData.append('jobId', String(jobId))
        formData.append('resume', resume)

        return {
          url: '/applications',
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: ['Auth'],
    }),
    getMyApplications: builder.query<JobApplication[], void>({
      query: () => '/applications/user',
      providesTags: ['Auth'],
    }),
    getApplicationsByJob: builder.query<JobApplication[], number>({
      query: (jobId) => `/applications/job/${jobId}`,
      providesTags: ['Auth'],
    }),
    updateApplicationStatus: builder.mutation<JobApplication, UpdateStatusRequest>({
      query: ({ applicationId, status }) => ({
        url: `/applications/${applicationId}/status`,
        method: 'PUT',
        params: { status },
      }),
      invalidatesTags: ['Auth'],
    }),
    replaceResume: builder.mutation<JobApplication, ReplaceResumeRequest>({
      query: ({ applicationId, resume }) => {
        const formData = new FormData()
        formData.append('resume', resume)
        return {
          url: `/applications/${applicationId}/resume`,
          method: 'PUT',
          body: formData,
        }
      },
      invalidatesTags: ['Auth'],
    }),
  }),
})

export const {
  useApplyWithResumeMutation,
  useGetMyApplicationsQuery,
  useLazyGetMyApplicationsQuery,
  useGetApplicationsByJobQuery,
  useUpdateApplicationStatusMutation,
  useReplaceResumeMutation,
} = applicationsApi

