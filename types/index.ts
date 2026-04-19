export type OnboardingRole = 'super_admin' | 'staff' | 'parent' | 'student';

export type DocumentType =
  | 'previous_school_result'
  | 'birth_certificate'
  | 'medical_certificate'
  | 'school_leaving_certificate'
  | 'national_id'
  | 'passport'
  | 'recommendation_letter'
  | 'portfolio'
  | 'bece_result'
  | 'waec_result';

export type EnquiryCategory =
  | 'school_fees'
  | 'admission'
  | 'curriculum'
  | 'facilities'
  | 'transport'
  | 'uniform'
  | 'extra_curricular'
  | 'academic_calendar'
  | 'general';

export type GradeLevel =
  | 'pre_school'
  | 'nursery_1'
  | 'nursery_2'
  | 'kg_1'
  | 'kg_2'
  | 'primary_1'
  | 'primary_2'
  | 'primary_3'
  | 'primary_4'
  | 'primary_5'
  | 'primary_6'
  | 'jss_1'
  | 'jss_2'
  | 'jss_3'
  | 'sss_1'
  | 'sss_2'
  | 'sss_3'
  | 'undergraduate'
  | 'postgraduate';

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type SignUpStep = 0 | 1 | 2 | 3;
