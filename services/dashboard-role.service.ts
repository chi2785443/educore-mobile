import { apiClient } from './axios.service';

export interface DashboardAnnouncement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  priority: string;
  type: string;
}

export interface DashboardEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  eventType: string;
  color: string;
  isHoliday: boolean;
  location?: string;
}

export interface AdminDashboardData {
  counts: { totalStudents: number; totalStaff: number; totalParents: number; totalClassrooms: number; totalSubjects: number; totalAnnouncements: number };
  pendingActions: { enrollments: number; enquiries: number; jobApplications: number; reports: number };
  finance: { totalIncome: number; totalExpenses: number; netBalance: number; outstandingFees: number };
  attendance: { presentToday: number; absentToday: number; flaggedRecords: number };
  recentAnnouncements: DashboardAnnouncement[];
  upcomingEvents: DashboardEvent[];
  recentEnrollments: Array<{ id: string; status: string; createdAt: string; trainingInterest: string }>;
}

export interface StaffDashboardData {
  myClassrooms: Array<{ id: string; name: string; grade?: string; section?: string; capacity?: number }>;
  counts: { totalClassrooms: number; totalStudents: number; totalAssessments: number; publishedAssessments: number; draftAssessments: number; myReports: number; pendingReports: number };
  todayTimetable: Array<{ id: string; startTime: string; endTime: string; subject: string; classroom: string; room?: string }>;
  myAttendanceToday: { clockedIn: boolean; time: string | null; flagged: boolean };
  recentAssessments: Array<{ id: string; title: string; status: string; createdAt: string; totalMarks: number; type: string }>;
  recentAnnouncements: DashboardAnnouncement[];
  upcomingEvents: DashboardEvent[];
}

export interface StudentDashboardData {
  myClassrooms: Array<{ id: string; name: string; grade?: string; section?: string }>;
  counts: { totalClassrooms: number; totalScored: number; passedCount: number; avgScore: number; daysAttendedThisMonth: number; outstandingFees: number };
  todayTimetable: Array<{ id: string; startTime: string; endTime: string; subject: string; classroom: string; room?: string }>;
  clockedInToday: boolean;
  latestResult: { id: string; term: string; academicYear: string; overallPercentage: number; overallGrade: string; classPosition: number; totalStudents: number } | null;
  recentScores: Array<{ id: string; percentage: number; passed: boolean; grade: string; title: string; type: string; totalMarks: number; createdAt: string }>;
  upcomingAssessments: Array<{ id: string; title: string; assessmentType: string; totalMarks: number; createdAt: string; status: string }>;
  recentAnnouncements: DashboardAnnouncement[];
  upcomingEvents: DashboardEvent[];
}

export interface ParentDashboardData {
  enquiries: { total: number; open: number; replied: number; closed: number };
  recentEnquiries: Array<{ id: string; subject: string; status: string; createdAt: string; repliedAt: string | null }>;
  linkedStudents: Array<{ userId: string; firstName: string; lastName: string; profilePicture?: string }>;
  recentAnnouncements: DashboardAnnouncement[];
  upcomingEvents: DashboardEvent[];
}

export const getAdminDashboard = (schoolId: string): Promise<AdminDashboardData> =>
  apiClient.get(`/dashboard/admin?schoolId=${schoolId}`).then(r => r.data);

export const getStaffDashboard = (schoolId: string): Promise<StaffDashboardData> =>
  apiClient.get(`/dashboard/staff?schoolId=${schoolId}`).then(r => r.data);

export const getStudentDashboard = (schoolId: string): Promise<StudentDashboardData> =>
  apiClient.get(`/dashboard/student?schoolId=${schoolId}`).then(r => r.data);

export const getParentDashboard = (schoolId: string): Promise<ParentDashboardData> =>
  apiClient.get(`/dashboard/parent?schoolId=${schoolId}`).then(r => r.data);
