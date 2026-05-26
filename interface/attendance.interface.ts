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
