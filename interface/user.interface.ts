export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  SCHOOL_ADMIN = 'school_admin',
  STAFF = 'staff',
  PARENT = 'parent',
  STUDENT = 'student',
}

export interface SchoolInfo {
  id: string;
  name: string;
  code: string;
  logo?: string;
}

export interface UserSchoolMembership {
  schoolId: string;
  role: UserRole;
  isPrimary: boolean;
  school: SchoolInfo;
}

export interface UserType {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  phoneNumber?: string;
  profilePicture?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  schools: UserSchoolMembership[];
}
