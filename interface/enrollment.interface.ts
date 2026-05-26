export type EnrollmentStatus =
  | 'pending'
  | 'under_review'
  | 'accepted'
  | 'declined'
  | 'waitlisted';

export interface EnrollmentDocument {
  url: string;
  publicId: string;
  name: string;
  fileSize?: number;
  fileExtension?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  schoolId: string | null;
  schoolName: string | null;
  trainingInterest: string;
  gradeLevel: string | null;
  previousSchool: string | null;
  personalStatement: string | null;
  document1: EnrollmentDocument | null;
  document2: EnrollmentDocument | null;
  documentsDeleted: boolean;
  status: EnrollmentStatus;
  responseMessage: string | null;
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  school?: {
    id: string;
    name: string;
    logo?: string;
  };
}

export interface CreateEnrollment {
  schoolId: string;
  trainingInterest: string;
  gradeLevel?: string;
  previousSchool?: string;
  personalStatement?: string;
  document1Name: string;
  document2Name: string;
  document1Type: string;
  document2Type: string;
  document1Uri: string;
  document1FileName: string;
  document1MimeType: string;
  document2Uri: string;
  document2FileName: string;
  document2MimeType: string;
}
