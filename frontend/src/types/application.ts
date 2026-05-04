export type ApplicationStatus = 'APPLIED' | 'SHORTLISTED' | 'REJECTED' | 'SELECTED' | 'HIRED'

export interface JobApplication {
  id: number
  userId: number
  jobId: number
  resumeUrl: string
  status: ApplicationStatus
  userEmail: string
  appliedAt: string
  atsScore?: number
  atsFeedback?: string
}
