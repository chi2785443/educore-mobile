export type EnquiryStatus = 'pending' | 'in_progress' | 'replied' | 'closed';

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

export interface Enquiry {
  id: string;
  parentId: string;
  schoolId: string | null;
  targetSchoolName: string | null;
  subject: string;
  category: EnquiryCategory | null;
  childName: string | null;
  childAge: number | null;
  childCurrentGrade: string | null;
  message: string;
  specificQuestions: string[] | null;
  reply: string | null;
  schoolInfo: Record<string, string> | null;
  status: EnquiryStatus;
  repliedAt: string | null;
  repliedById: string | null;
  createdAt: string;
  updatedAt: string;
  school?: {
    id: string;
    name: string;
  };
  parent?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  repliedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateEnquiry {
  schoolId?: string;
  targetSchoolName?: string;
  subject: string;
  category?: EnquiryCategory;
  childName?: string;
  childAge?: number;
  childCurrentGrade?: string;
  message: string;
  specificQuestions?: string[];
}

export interface ReplyEnquiry {
  reply: string;
  schoolInfo?: Record<string, string>;
  status?: EnquiryStatus;
}
