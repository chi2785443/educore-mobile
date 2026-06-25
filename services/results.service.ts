import { apiClient } from './axios.service';
import { TermResult, ReportCard } from '@/interface/result.interface';

const exList = <T>(d: unknown): T[] => {
  if (d && typeof d === 'object' && 'data' in d) {
    const inner = (d as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  if (Array.isArray(d)) return d as T[];
  return [];
};

export interface SchoolResultsFilters {
  terms: string[];
  academicYears: string[];
}

export interface ClassroomResultSummary {
  classroomId: string;
  classroomName: string;
  totalStudents: number;
  classAverage: number;
  passCount: number;
  topStudent?: { studentId: string; overallPercentage: number; classPosition?: number; student?: { firstName: string; lastName: string } };
}

export interface SchoolResultsSummary {
  schoolId: string;
  term: string;
  academicYear: string;
  totalStudents: number;
  overallAverage: number;
  totalPassed: number;
  passPercentage: number;
  classrooms: ClassroomResultSummary[];
}

export const resultsService = {
  getMyResults: async (): Promise<TermResult[]> => {
    const res = await apiClient.get('/results/student/my-results');
    return exList<TermResult>(res.data);
  },

  getAvailableFilters: async (schoolId: string): Promise<SchoolResultsFilters> => {
    const res = await apiClient.get(`/results/school/${schoolId}/available-filters`);
    const d = res.data as { data?: SchoolResultsFilters } | SchoolResultsFilters;
    return ('data' in d && d.data ? d.data : d) as SchoolResultsFilters;
  },

  getSchoolResults: async (schoolId: string, term: string, academicYear: string): Promise<SchoolResultsSummary> => {
    const res = await apiClient.get(`/results/school/${schoolId}`, { params: { term, academicYear } });
    const d = res.data as { data?: SchoolResultsSummary } | SchoolResultsSummary;
    return ('data' in d && d.data ? d.data : d) as SchoolResultsSummary;
  },

  getClassroomResults: async (classroomId: string, term: string, academicYear: string): Promise<TermResult[]> => {
    const res = await apiClient.get(`/results/classroom/${classroomId}`, { params: { term, academicYear } });
    // Backend returns { classroomId, ..., results: [...] } (possibly wrapped in { data: ... })
    const raw = res.data as { data?: { results?: unknown[] }; results?: unknown[] } | { results?: unknown[] };
    const payload = ('data' in raw && raw.data ? raw.data : raw) as { results?: unknown[] };
    const items: unknown[] = Array.isArray(payload.results) ? payload.results : [];
    return items.map((r: unknown) => {
      const item = r as Record<string, unknown>;
      return {
        ...item,
        // Backend sends `position`, interface expects `classPosition`
        classPosition: (item.classPosition ?? item.position ?? null) as number | null,
        // Backend sends `grade`, interface expects `overallGrade`
        overallGrade: (item.overallGrade ?? item.grade ?? null) as string | null,
        // Backend sends flat `studentName`/`studentPicture`, reconstruct `student` object
        student: item.student ?? (item.studentName
          ? {
              id: item.studentId as string,
              firstName: (item.studentName as string).split(' ')[0] ?? '',
              lastName: (item.studentName as string).split(' ').slice(1).join(' ') ?? '',
              email: (item.studentEmail as string | undefined) ?? undefined,
              profilePicture: (item.studentPicture as string | null) ?? null,
            }
          : undefined),
      } as TermResult;
    });
  },

  getStudentReportCard: async (studentId: string, term: string, academicYear: string): Promise<ReportCard> => {
    const res = await apiClient.get(`/results/student/${studentId}/report-card`, { params: { term, academicYear } });
    const d = res.data as { data?: ReportCard } | ReportCard;
    return ('data' in d && d.data ? d.data : d) as ReportCard;
  },

  getStudentAllResults: async (studentId: string): Promise<TermResult[]> => {
    const res = await apiClient.get(`/results/student/${studentId}/all-results`);
    return exList<TermResult>(res.data);
  },

  generateResults: async (dto: {
    schoolId: string;
    classroomId?: string;
    term: string;
    academicYear: string;
  }): Promise<TermResult[]> => {
    const res = await apiClient.post('/results/generate', dto);
    return exList<TermResult>(res.data);
  },

  submitForApproval: async (classroomId: string, term: string, academicYear: string): Promise<void> => {
    await apiClient.patch(`/results/classroom/${classroomId}/submit`, {}, { params: { term, academicYear } });
  },
};
