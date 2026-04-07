export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'REMOTE'

export interface Job {
  id: number
  title: string
  companyName: string
  jobType?: string
  location: string
  salary?: number
  experience?: number
  description: string
  openings?: number
  postedBy?: number
  recruiterId?: number
  createdAt?: string
}

export interface CreateJobRequest {
  title: string
  companyName: string
  jobType: JobType
  location: string
  salary?: number
  experience?: number
  description: string
  openings?: number
}

export interface JobSearchFilters {
  title?: string
  location?: string
  jobType?: string
  companyName?: string
  minSalary?: number
  maxSalary?: number
  minExperience?: number
  maxExperience?: number
}
