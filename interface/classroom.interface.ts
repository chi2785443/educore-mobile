export interface ClassroomDetail {
  id: string;
  name: string;
  grade?: string;
  section?: string;
  capacity?: number;
  currentStudentCount?: number;
  isActive?: boolean;
  roomNumber?: string;
  schoolId: string;
}

export interface CreateClassroomPayload {
  schoolId: string;
  name: string;
  grade?: string;
  section?: string;
  capacity?: number;
  roomNumber?: string;
}

export interface ClassroomMember {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  email?: string;
  jobTitle?: string;
  role?: string;
}
