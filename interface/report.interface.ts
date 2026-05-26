export type ReportType = 'baseline' | 'weekly' | 'monthly' | 'term_end' | 'session_end';
export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type ReportTerm = 'FIRST_TERM' | 'SECOND_TERM' | 'THIRD_TERM';

export interface ReportSubjectEntry {
  subjectName: string;
  performance: string;
  notes?: string;
  grade?: string;
}

export interface CreateReportPayload {
  studentId: string;
  reportType: ReportType;
  title?: string;
  academicYear?: string;
  term?: ReportTerm;
  weekNumber?: number;
  monthName?: string;
  generalRemarks: string;
  behaviorRating?: number;
  behaviorNotes?: string;
  characterNotes?: string;
  strengths?: string[];
  areasForImprovement?: string[];
  attendanceSummary?: { present: number; absent: number; late: number };
  subjectEntries?: ReportSubjectEntry[];
}

export interface StudentReport {
  id: string;
  schoolId: string;
  classroomId: string;
  teacherId: string;
  studentId: string;
  reportType: ReportType;
  status: ReportStatus;
  title?: string;
  generalRemarks: string;
  behaviorRating?: number;
  rejectionReason?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  student?: { id: string; firstName: string; lastName: string; profilePicture?: string };
  classroom?: { id: string; name: string };
  teacher?: { id: string; firstName: string; lastName: string };
}

export interface RejectReportPayload {
  rejectionReason?: string;
}
