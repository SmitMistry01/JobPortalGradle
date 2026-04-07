import { z } from 'zod'

export const createJobSchema = z.object({
  title: z.string().trim().min(2, 'Job title is required'),
  companyName: z.string().trim().min(2, 'Company name is required'),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE']),
  location: z.string().trim().min(2, 'Location is required'),
  salary: z.number().nonnegative('Salary cannot be negative').optional(),
  experience: z.number().int('Experience must be a whole number').nonnegative('Experience cannot be negative').optional(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  openings: z.number().int('Openings must be a whole number').min(1, 'Openings must be at least 1').max(100, 'Openings cannot exceed 100'),
})

export const applyResumeSchema = z.object({
  jobId: z.number().int().positive(),
  resume: z
    .instanceof(File, { message: 'Resume file is required' })
    .refine((file) => file.size <= 5 * 1024 * 1024, 'Resume must be <= 5MB'),
})

export type CreateJobValues = z.infer<typeof createJobSchema>

