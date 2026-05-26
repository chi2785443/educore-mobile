import { LibraryFileType } from './library.interface';

export interface MemberDocument {
  id: string;
  schoolId: string;
  userId: string;
  title: string;
  description: string | null;
  fileUrl: string;
  filePublicId?: string;
  fileType: LibraryFileType;
  fileSize: number;
  fileExtension: string | null;
  visibility: 'public' | 'private';
  uploadedById?: string;
  source: string | null;
  sourceEntityId?: string | null;
  user?: { firstName: string; lastName: string; email: string; profilePicture?: string | null };
  uploadedBy?: { firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}
