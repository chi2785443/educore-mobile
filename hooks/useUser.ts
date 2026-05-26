import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { userService, UpdateProfilePayload, ChangePasswordPayload } from '@/services/user.service';
import { useAuthStore } from '@/store/authStore';
import { UserType } from '@/interface/user.interface';

export function useUpdateProfile(onSuccess?: () => void) {
  const qc = useQueryClient();
  const { user, updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: UpdateProfilePayload) => {
      if (!user?.id) throw new Error('Not authenticated');
      return userService.updateProfile(user.id, data);
    },
    onSuccess: async (result: UserType, variables: UpdateProfilePayload) => {
      const newProfilePicture = variables.profilePictureUri ? result.profilePicture : undefined;

      // Prefetch the new Cloudinary image so it's in cache before we navigate back
      if (newProfilePicture) {
        try { await Image.prefetch(newProfilePicture); } catch { /* ignore */ }
      }

      // Only merge the fields we sent — don't overwrite schools or other auth-only fields
      updateUser({
        firstName: variables.firstName,
        lastName: variables.lastName,
        phoneNumber: variables.phoneNumber,
        ...(newProfilePicture ? { profilePicture: newProfilePicture } : {}),
      });
      qc.invalidateQueries({ queryKey: ['profile'] });
      onSuccess?.();
    },
  });
}

export function useChangePassword(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (data: ChangePasswordPayload) => userService.changePassword(data),
    onSuccess: () => onSuccess?.(),
  });
}
