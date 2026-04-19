export interface Enrollment {
  id: string;
  schoolId: string;
  studentId: string;
  status: 'pending' | 'approved' | 'rejected';
  trainingInterest: string;
  gradeLevel?: string;
  previousSchool?: string;
  personalStatement?: string;
  document1Url?: string;
  document2Url?: string;
  createdAt: string;
}

export interface CreateEnrollment {
  schoolId: string;
  trainingInterest: string;
  gradeLevel?: string;
  previousSchool?: string;
  personalStatement?: string;
  document1Type: string;
  document2Type: string;
  document1Uri: string;
  document1Name: string;
  document1MimeType: string;
  document2Uri: string;
  document2Name: string;
  document2MimeType: string;
}
