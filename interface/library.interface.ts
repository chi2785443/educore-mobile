export type LibraryFileType = 'pdf' | 'word' | 'excel' | 'ppt' | 'image' | 'other';
export type LibraryVisibility = 'all' | 'staff' | 'students' | 'admin';

export interface LibraryDocument {
  id: string;
  schoolId: string;
  title: string;
  description: string | null;
  fileUrl: string;
  filePublicId?: string;
  fileType: LibraryFileType;
  fileSize: number;
  fileExtension: string | null;
  category: string;
  subjectId?: string | null;
  visibility: LibraryVisibility;
  isDownloadable: boolean;
  downloadCount: number;
  tags: string[] | null;
  uploadedById?: string;
  uploadedBy?: { firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}
