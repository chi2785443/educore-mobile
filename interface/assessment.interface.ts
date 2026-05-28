export type AssessmentType = 'exam' | 'test' | 'quiz' | 'assignment';
export type QuestionType = 'objective' | 'theory' | 'mixed';
export type AssessmentStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface Assessment {
  id: string;
  title: string;
  type: AssessmentType;
  questionType: QuestionType;
  status: AssessmentStatus;
  totalMarks: number;
  passingMarks: number;
  duration?: number;
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  term: string;
  academicYear: string;
  subjectId: string;
  classroomId?: string;
  schoolId?: string;
  targetStudentIds?: string[] | null;
  instructions?: string;
  questionCount?: number;
  isActive?: boolean;
  subject?: { name: string; color: string };
  classroom?: { name: string; grade?: string; section?: string };
  creator?: { firstName: string; lastName: string };
}

export interface CreateAssessmentPayload {
  title: string;
  type: AssessmentType;
  questionType: QuestionType;
  totalMarks: number;
  passingMarks: number;
  duration?: number;
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  term: string;
  academicYear: string;
  subjectId: string;
  classroomId: string;
  schoolId: string;
  instructions?: string;
}

export type UpdateAssessmentPayload = Partial<CreateAssessmentPayload>;

export interface Subject {
  id: string;
  name: string;
  color: string;
  code?: string;
}

export interface AssessmentQuestion {
  id: string;
  assessmentId: string;
  questionId: string;
  marks: number;
  questionOrder: number;
  question: {
    id: string;
    questionText: string;
    questionImage: string | null;
    type: 'objective' | 'theory';
    options?: string[] | null;
    correctAnswer?: string | null;
  };
}
