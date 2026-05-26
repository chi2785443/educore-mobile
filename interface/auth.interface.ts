import { UserType } from './user.interface';

export interface Register {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface Login {
  email: string;
  password: string;
}

export interface ForgotPassword {
  email: string;
}

export interface ResetPassword {
  token: string;
  newPassword: string;
}

export interface SendOtpResponse {
  message: string;
  otp?: string;
}

export interface VerifyOtpResponse {
  message: string;
}

export interface AuthUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  profilePicture?: string;
  isActive: boolean;
  emailVerified: boolean;
  schools: UserType['schools'];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: AuthUserData;
  expiresIn?: string;
}
