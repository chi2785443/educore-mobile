export interface Enquiry {
  id: string;
  schoolId?: string;
  subject: string;
  category?: string;
  message: string;
  status: 'open' | 'replied' | 'closed';
  createdAt: string;
}

export interface CreateEnquiry {
  schoolId?: string;
  subject: string;
  category?: string;
  childName?: string;
  childAge?: number;
  childGrade?: string;
  message: string;
  specificQuestions?: string[];
}
