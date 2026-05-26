export interface SubjectResult {
  id: string;
  termResultId?: string;
  subjectId: string;
  testScore?: number | null;
  examScore?: number | null;
  assignmentScore?: number | null;
  quizScore?: number | null;
  weightedScore: number;
  percentage: number;
  grade: string | null;
  gradePoint?: number | null;
  isPassed: boolean;
  position?: number | null;
  classHighest?: number | null;
  classLowest?: number | null;
  classAverage?: number | null;
  remarks: string | null;
  subject?: { id: string; name: string; color: string };
}

export interface TermResult {
  id: string;
  studentId: string;
  classroomId: string;
  schoolId: string;
  term: string;
  academicYear: string;
  totalMarks?: number;
  totalPossibleMarks?: number;
  overallPercentage: number;
  overallGrade: string | null;
  gpa: number | null;
  classPosition: number | null;
  totalStudents: number | null;
  subjectsTaken: number;
  subjectsPassed: number;
  subjectsFailed: number;
  teacherRemarks: string | null;
  principalRemarks: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  classroom?: { name: string; grade?: string; section?: string };
  school?: { name: string; logo?: string };
  subjectResults?: SubjectResult[];
  createdAt?: string;
}
