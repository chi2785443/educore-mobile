export interface SubjectResult {
  id: string;
  termResultId?: string;
  subjectId: string;
  testScore?: number | null;
  examScore?: number | null;
  assignmentScore?: number | null;
  quizScore?: number | null;
  projectScore?: number | null;
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
  subject?: { id: string; name: string; code?: string; color: string; icon?: string | null };
}

export interface TermResult {
  id: string;
  studentId: string;
  student?: { id: string; firstName: string; lastName: string; email?: string; profilePicture?: string | null };
  classroomId: string;
  schoolId: string;
  term: string;
  academicYear: string;
  totalMarks?: number;
  totalPossibleMarks?: number;
  overallPercentage: number;
  weightedAverage?: number;
  overallGrade: string | null;
  gpa: number | null;
  classPosition: number | null;
  totalStudents: number | null;
  subjectsTaken: number;
  subjectsPassed: number;
  subjectsFailed: number;
  attendancePercentage?: number | null;
  teacherRemarks: string | null;
  principalRemarks: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  classroom?: { id?: string; name: string; grade?: string; section?: string; academicYear?: string };
  school?: { id?: string; name: string; logo?: string | null; address?: string; principalName?: string };
  subjectResults?: SubjectResult[];
  createdAt?: string;
}

export interface ReportCard {
  termResult: TermResult;
  subjectResults: SubjectResult[];
  studentInfo: {
    studentName: string;
    studentId: string;
    className: string;
    rollNumber: string;
  };
  gradeDistribution: {
    excellent: number;
    good: number;
    average: number;
    belowAverage: number;
    fail: number;
  };
  strengths: string[];
  weaknesses: string[];
  performance: {
    overallPercentage: number;
    gpa: number | null;
    grade: string | null;
    position: number | null;
    totalStudents: number | null;
    subjectsPassed: number;
    subjectsFailed: number;
  };
}
