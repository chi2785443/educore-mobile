export interface School {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  currentSession?: string | null;
  currentTerm?: string | null;
  currency?: string;
}

export interface SchoolSettings {
  id?: string;
  schoolId?: string;
  currentSession?: string;
  currentTerm?: string;
  allowedAssessmentTypes?: string[];
  termType?: string;
}

export interface CreateSchool {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
}
