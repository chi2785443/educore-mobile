export type QuestionType = 'objective' | 'theory';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  schoolId: string;
  subjectId: string;
  createdBy: string;
  type: QuestionType;
  questionText: string;
  questionImage: string | null;
  options: string[] | null;
  correctAnswer: string | null;
  explanation: string | null;
  difficulty: Difficulty;
  category: string | null;
  tags: string[] | null;
  hint: string | null;
  usageCount: number;
  isActive: boolean;
  isVerified: boolean;
  subject?: { id: string; name: string; color: string };
  creator?: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateObjectivePayload {
  schoolId: string;
  subjectId: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: Difficulty;
  category?: string;
  tags?: string[];
  hint?: string;
  questionImage?: string;
}

export interface CreateTheoryPayload {
  schoolId: string;
  subjectId: string;
  questionText: string;
  explanation?: string;
  difficulty?: Difficulty;
  category?: string;
  tags?: string[];
  hint?: string;
  questionImage?: string;
}

export interface QuestionFilters {
  subjectId?: string;
  type?: QuestionType;
  difficulty?: Difficulty;
  category?: string;
}
