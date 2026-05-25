export interface Enrollment {
  id: string;
  schoolId: string;
  studentId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'under_review';
  trainingInterest: string;
  gradeLevel?: string;
  previousSchool?: string;
  personalStatement?: string;
  document1Url?: string;
  document2Url?: string;
  createdAt: string;
  school?: { id: string; name: string; logo?: string };
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
