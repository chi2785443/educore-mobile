import { useQuery } from '@tanstack/react-query';
import { resultsService } from '@/services/results.service';
import { ReportCard } from '@/interface/result.interface';

export const useMyResults = (enabled = true) =>
  useQuery({
    queryKey: ['my-results'],
    queryFn: () => resultsService.getMyResults(),
    enabled,
    staleTime: 5 * 60_000,
  });

export const useResultsFilters = (schoolId: string) =>
  useQuery({
    queryKey: ['results-filters', schoolId],
    queryFn: () => resultsService.getAvailableFilters(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60_000,
  });

export const useSchoolResults = (schoolId: string, term: string, academicYear: string) =>
  useQuery({
    queryKey: ['school-results', schoolId, term, academicYear],
    queryFn: () => resultsService.getSchoolResults(schoolId, term, academicYear),
    enabled: !!schoolId && !!term && !!academicYear,
    staleTime: 2 * 60_000,
  });

export const useClassroomResults = (classroomId: string, term: string, academicYear: string) =>
  useQuery({
    queryKey: ['classroom-results', classroomId, term, academicYear],
    queryFn: () => resultsService.getClassroomResults(classroomId, term, academicYear),
    enabled: !!classroomId && !!term && !!academicYear,
    staleTime: 2 * 60_000,
  });

export const useStudentReportCard = (
  studentId: string | null,
  term: string,
  academicYear: string,
) =>
  useQuery<ReportCard>({
    queryKey: ['report-card', studentId, term, academicYear],
    queryFn: () => resultsService.getStudentReportCard(studentId!, term, academicYear),
    enabled: !!studentId && !!term && !!academicYear,
    staleTime: 2 * 60_000,
  });

export const useStudentAllResults = (studentId: string | undefined) =>
  useQuery({
    queryKey: ['student-all-results', studentId],
    queryFn: () => resultsService.getStudentAllResults(studentId!),
    enabled: !!studentId,
    staleTime: 2 * 60_000,
  });
