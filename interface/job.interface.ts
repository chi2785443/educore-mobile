export interface Job {
  id: string;
  title: string;
  description: string;
  employmentType: string;
  location?: string;
  salary?: string;
  deadline?: string;
  requirements?: string;
  responsibilities?: string;
  slug?: string;
  school: {
    id: string;
    name: string;
    city?: string;
    state?: string;
    logo?: string;
  };
}

export interface MyApplication {
  id: string;
  status: string;
  coverLetter?: string;
  yearsOfExperience: number;
  portfolioUrl?: string;
  education?: string;
  certifications?: string;
  expectedSalary?: number;
  rejectionReason?: string;
  rejectionFeedback?: string;
  submittedAt: string;
  updatedAt: string;
  jobPosting?: {
    id: string;
    title: string;
    employmentType?: string;
  };
  school: {
    id: string;
    name: string;
    logo?: string;
  };
  interviews?: MyInterview[];
}

export interface MyInterview {
  id: string;
  title: string;
  interviewType: string;
  scheduledDate: string;
  durationMinutes: number;
  location?: string;
  meetingLink?: string;
  status: string;
  candidateConfirmed: boolean;
  candidateConfirmedAt?: string;
  application?: {
    id: string;
    jobPosting?: { title: string };
    school: { name: string };
  };
}

export interface ApplyJobPayload {
  schoolId: string;
  jobPostingId: string;
  coverLetter: string;
  yearsOfExperience: number;
  portfolioUrl?: string;
  education?: string;
  resumeUri: string;
  resumeName: string;
  resumeMimeType: string;
}
