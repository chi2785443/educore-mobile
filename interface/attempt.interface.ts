export type AttemptStatus = 'in_progress' | 'submitted' | 'auto_submitted';

export interface AnswerSubmission {
  id: string;
  assessmentQuestionId: string;
  answer: string;
  timeTaken?: number;
  markingStatus?: 'CORRECT' | 'INCORRECT' | 'PENDING';
  question?: {
    id: string;
    question: string;
    questionImage?: string | null;
    options?: string[];
    questionType: string;
    marks: number;
  };
}

export interface StudentAttempt {
  id: string;
  assessmentId: string;
  studentId: string;
  status: AttemptStatus;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
  timeSpent?: number;
  answerSubmissions?: AnswerSubmission[];
  student?: { firstName: string; lastName: string; profilePicture?: string };
}

export interface StartAttemptPayload {
  assessmentId: string;
}

export interface SubmitAnswerPayload {
  attemptId: string;
  assessmentQuestionId: string;
  answer: string;
  timeTaken?: number;
}

export interface SubmitAttemptPayload {
  attemptId: string;
  timeRemaining?: number;
}

export interface StudentScore {
  id: string;
  assessmentId: string;
  studentId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  grade: string;
  gradePoint: number;
  correctAnswers: number;
  incorrectAnswers: number;
  questionsAnswered: number;
  remarks?: string;
  gradedAt?: string | null;
  gradedBy?: string | null;
  isReleased?: boolean;
  student?: { firstName: string; lastName: string; profilePicture?: string };
  assessment?: {
    id: string;
    title: string;
    type: string;
    term: string;
    academicYear: string;
    totalMarks: number;
    subject?: { id: string; name: string; color: string };
    classroom?: { id: string; name: string; grade?: string };
  };
}

export interface ClassStats {
  totalStudents: number;
  averageScore: number;
  averagePercentage: number;
  highestScore: number;
  lowestScore: number;
  passCount: number;
  failCount: number;
  passPercentage: number;
  topPerformers?: { firstName: string; lastName: string; score: number }[];
}

export interface RetakeRequest {
  id: string;
  assessmentId: string;
  studentId: string;
  status: 'pending' | 'approved' | 'denied';
  reason: string;
  responseNote?: string;
  createdAt: string;
  student?: { firstName: string; lastName: string };
}

export interface CreateRetakePayload {
  assessmentId: string;
  reason: string;
}

export interface RespondRetakePayload {
  status: 'approved' | 'denied';
  responseNote?: string;
}
