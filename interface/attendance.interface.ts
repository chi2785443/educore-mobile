export interface TodayStatus {
  clockedIn: boolean;
  clockedOut: boolean;
  clockInTime: string | null;
  clockOutTime: string | null;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  schoolId: string;
  classroomId?: string | null;
  type: 'clock_in' | 'clock_out';
  method: 'qr_code' | 'manual';
  recordedAt: string;
  isFlagged: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalNote?: string | null;
  isExtraHours: boolean;
  payrollDeductionApplied: boolean;
  deductionAmount?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  isWithinArea?: boolean | null;
  distanceMeters?: number | null;
  createdAt: string;
}

export interface AttendanceListResponse {
  records: AttendanceRecord[];
  total: number;
  todayStatus?: TodayStatus;
}

export interface AttendanceSettings {
  id: string;
  schoolId: string;
  trackAttendance: boolean;
  locationType: 'school' | 'class';
  useQRCode: boolean;
  qrRefreshSeconds: number;
  allowedRadiusMeters: number;
  trackStaff: boolean;
  trackStudents: boolean;
  trackAdmins: boolean;
}

export interface ClockPayload {
  type: 'clock_in' | 'clock_out';
  method: 'qr_code' | 'manual';
  latitude?: number;
  longitude?: number;
  qrToken?: string;
  classroomId?: string;
}

// ─── Daily Attendance ─────────────────────────────────────────────────────────

export type DayStatus = 'present' | 'partial' | 'absent';

export interface DailyClockEvent {
  id: string;
  recordedAt: string;
  latitude?: number | null;
  longitude?: number | null;
  isFlagged: boolean;
  isWithinArea?: boolean | null;
  distanceMeters?: number | null;
  method: 'qr_code' | 'manual';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalNote?: string | null;
  isExtraHours: boolean;
}

export interface DailyAttendanceSummary {
  date: string; // YYYY-MM-DD
  clockIn: DailyClockEvent | null;
  clockOut: DailyClockEvent | null;
  hoursWorked: number | null;
  status: DayStatus;
  isFlagged: boolean;
  hasPendingReview: boolean;
  payrollDeductionApplied: boolean;
  deductionAmount: number | null;
}

export interface DailyStats {
  daysPresent: number;
  daysPartial: number;
  totalHours: number;
  flaggedDays: number;
}

export interface DailyAttendanceResponse {
  days: DailyAttendanceSummary[];
  stats: DailyStats;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string | null;
  };
}

export interface StaffTodayStatus {
  userId: string;
  firstName: string;
  lastName: string;
  profilePicture?: string | null;
  jobTitle?: string | null;
  clockedIn: boolean;
  clockedOut: boolean;
  clockInTime: string | null;
  clockOutTime: string | null;
}

export interface AdminTodayAttendanceResponse {
  date: string;
  summary: { total: number; present: number; absent: number };
  staff: StaffTodayStatus[];
}
