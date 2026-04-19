export interface Job {
  id: string;
  title: string;
  description: string;
  employmentType: string;
  location?: string;
  salary?: string;
  deadline?: string;
  school: {
    id: string;
    name: string;
    city?: string;
    logo?: string;
  };
}

export interface JobApplication {
  jobId: string;
  coverLetter: string;
  yearsOfExperience: number;
  portfolioUrl?: string;
  resumeUri?: string;
  resumeName?: string;
  resumeMimeType?: string;
}
