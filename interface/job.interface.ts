export type JobStatus = 'draft' | 'active' | 'paused' | 'closed' | 'filled';
export type ApplicationStatus =
  | 'submitted' | 'under_review' | 'shortlisted'
  | 'interview_scheduled' | 'interviewed' | 'offered'
  | 'accepted' | 'rejected' | 'withdrawn';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship';
export type ExperienceLevel = 'entry' | 'intermediate' | 'senior' | 'expert';
export type SchoolJobRole =
  | 'teacher' | 'assistant_teacher' | 'head_teacher' | 'principal' | 'vice_principal'
  | 'counselor' | 'librarian' | 'lab_technician' | 'admin_staff' | 'accountant'
  | 'security' | 'janitor' | 'driver' | 'nurse' | 'it_support' | 'other';
export type InterviewType = 'phone' | 'video' | 'in_person' | 'technical' | 'panel' | 'final';

// ─── Staff / public browse ────────────────────────────────────────────────────

export interface Job {
  id: string;
  title: string;
  description: string;
  employmentType: string;
  status?: string;
  location?: string;
  salary?: string;
  deadline?: string;
  requirements?: string;
  responsibilities?: string;
  slug?: string;
  school: { id: string; name: string; city?: string; state?: string; logo?: string };
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
  jobPosting?: { id: string; title: string; employmentType?: string };
  school: { id: string; name: string; logo?: string };
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

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  niceToHave?: string;
  role: SchoolJobRole;
  department?: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  location: string;
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  showSalary?: boolean;
  applicationDeadline?: string;
  positionsAvailable?: number;
  minYearsExperience?: number;
  status: JobStatus;
  applicationsCount?: number;
  slug?: string;
  createdAt: string;
  school: { id: string; name: string; logo?: string };
}

export interface JobApplication {
  id: string;
  status: ApplicationStatus;
  coverLetter?: string;
  yearsOfExperience: number;
  portfolioUrl?: string;
  education?: string;
  certifications?: string;
  expectedSalary?: number;
  notes?: string;
  rejectionReason?: string;
  rejectionFeedback?: string;
  rating?: number;
  submittedAt: string;
  updatedAt: string;
  jobPosting?: { id: string; title: string; employmentType?: string };
  applicant?: { id: string; firstName: string; lastName: string; email: string; phoneNumber?: string };
  resume?: { url: string; publicId: string; name?: string };
  interviews?: JobInterview[];
}

export interface JobInterview {
  id: string;
  title: string;
  interviewType: InterviewType;
  scheduledDate: string;
  durationMinutes: number;
  location?: string;
  meetingLink?: string;
  status: string;
  candidateConfirmed: boolean;
  notes?: string;
  application?: {
    id: string;
    jobPosting?: { title: string };
    applicant?: { firstName: string; lastName: string; email: string };
  };
}

export interface CreateJobPosting {
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  role: SchoolJobRole;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  location: string;
  department?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  applicationDeadline?: string;
  positionsAvailable?: number;
  status?: 'draft' | 'active';
}

export interface UpdateApplicationStatus {
  status?: ApplicationStatus;
  notes?: string;
  rejectionReason?: string;
  rejectionFeedback?: string;
  rating?: number;
}

export interface ScheduleInterviewPayload {
  applicationId: string;
  interviewType: InterviewType;
  title: string;
  scheduledDate: string;
  durationMinutes?: number;
  location?: string;
  meetingLink?: string;
}
