import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserType } from '@/interface/user.interface';

interface AuthState {
  user: UserType | null;
  isAuthenticated: boolean;
  selectedSchoolId: string | null;
  login: (user: UserType) => void;
  updateUser: (updates: Partial<UserType>) => void;
  setSelectedSchool: (schoolId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      selectedSchoolId: null,

      login: (user) =>
        set((state) => ({
          user,
          isAuthenticated: true,
          // Auto-select primary school on login; keep existing selection if already set
          selectedSchoolId:
            state.selectedSchoolId ??
            user.schools?.find((s) => s.isPrimary)?.schoolId ??
            user.schools?.[0]?.schoolId ??
            null,
        })),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setSelectedSchool: (schoolId) => set({ selectedSchoolId: schoolId }),

      logout: () => set({ user: null, isAuthenticated: false, selectedSchoolId: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        selectedSchoolId: state.selectedSchoolId,
      }),
    }
  )
);
