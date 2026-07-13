import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UpdateState {
  skippedVersionCode: number | null;
  setSkippedVersionCode: (versionCode: number) => void;
}

export const useUpdateStore = create<UpdateState>()(
  persist(
    (set) => ({
      skippedVersionCode: null,
      setSkippedVersionCode: (versionCode) => set({ skippedVersionCode: versionCode }),
    }),
    {
      name: 'update-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
