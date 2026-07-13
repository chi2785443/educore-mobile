export type AppPlatform = 'android' | 'ios';

export type AppUpdateType = 'critical' | 'optional';

export interface AppRelease {
  id: string;
  platform: AppPlatform;
  version: string;
  versionCode: number;
  updateType: AppUpdateType;
  releaseNotes: string | null;
  fileUrl: string;
  fileSize: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
