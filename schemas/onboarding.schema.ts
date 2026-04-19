import { z } from 'zod';

export const schoolRegistrationSchema = z.object({
  name: z.string().min(2, 'School name must be at least 2 characters'),
  code: z
    .string()
    .min(2, 'School code must be at least 2 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, hyphens and underscores'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
});

export const jobApplicationSchema = z.object({
  jobId: z.string().uuid('Select a job'),
  coverLetter: z.string().min(20, 'Cover letter must be at least 20 characters'),
  yearsOfExperience: z.coerce
    .number({ invalid_type_error: 'Enter a valid number' })
    .min(0, 'Cannot be negative'),
  portfolioUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
});

export const studentEnrollmentSchema = z.object({
  schoolId: z.string().uuid('Select a school'),
  trainingInterest: z.string().min(2, 'Training interest is required'),
  gradeLevel: z.string().optional(),
  previousSchool: z.string().optional(),
  personalStatement: z.string().optional(),
  document1Type: z.string().min(1, 'Select document type'),
  document2Type: z.string().min(1, 'Select document type'),
});

export const parentEnquirySchema = z.object({
  schoolId: z.string().uuid('Select a school').optional(),
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject too long'),
  category: z.string().optional(),
  childName: z.string().optional(),
  childAge: z.coerce.number().min(1).max(25).optional(),
  childGrade: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  specificQuestions: z.array(z.string()).optional(),
});

export type SchoolRegistrationFormData = z.infer<typeof schoolRegistrationSchema>;
export type JobApplicationFormData = z.infer<typeof jobApplicationSchema>;
export type StudentEnrollmentFormData = z.infer<typeof studentEnrollmentSchema>;
export type ParentEnquiryFormData = z.infer<typeof parentEnquirySchema>;
