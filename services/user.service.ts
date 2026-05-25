import { apiClient } from './axios.service';
import { UserType } from '@/interface/user.interface';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePictureUri?: string;
  profilePictureFileName?: string;
  profilePictureMimeType?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const userService = {
  updateProfile: async (userId: string, data: UpdateProfilePayload): Promise<UserType> => {
    if (data.profilePictureUri) {
      const formData = new FormData();
      if (data.firstName) formData.append('firstName', data.firstName);
      if (data.lastName) formData.append('lastName', data.lastName);
      if (data.phoneNumber !== undefined) formData.append('phoneNumber', data.phoneNumber);
      formData.append('profilePicture', {
        uri: data.profilePictureUri,
        name: data.profilePictureFileName ?? 'profile.jpg',
        type: data.profilePictureMimeType ?? 'image/jpeg',
      } as unknown as Blob);
      const response = await apiClient.patch<UserType>(`/users/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      return response.data;
    }
    const response = await apiClient.patch<UserType>(`/users/${userId}`, {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
    });
    return response.data;
  },

  changePassword: async (data: ChangePasswordPayload): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>('/auth/change-password', data);
    return response.data;
  },
};
