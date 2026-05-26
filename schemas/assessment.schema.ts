import { z } from 'zod';

export const createAssessmentSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(300, 'Title is too long'),
    type: z.enum(['exam', 'test', 'quiz', 'assignment'], {
      required_error: 'Select an assessment type',
    }),
    questionType: z.enum(['objective', 'theory', 'mixed'], {
      required_error: 'Select a question type',
    }),
    subjectId: z.string().uuid('Select a subject'),
    totalMarks: z
      .number({ required_error: 'Total marks are required' })
      .positive('Total marks must be positive'),
    passingMarks: z
      .number({ required_error: 'Passing marks are required' })
      .nonnegative('Passing marks cannot be negative'),
    duration: z.number().positive().optional(),
    scheduledDate: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    term: z.string().min(1, 'Term is required'),
    academicYear: z.string().min(1, 'Academic year is required'),
    instructions: z.string().optional(),
  })
  .refine((d) => d.passingMarks <= d.totalMarks, {
    message: 'Passing marks cannot exceed total marks',
    path: ['passingMarks'],
  });

export type CreateAssessmentFormValues = z.infer<typeof createAssessmentSchema>;
