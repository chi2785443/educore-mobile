import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '@/services/report.service';
import { CreateReportPayload, RejectReportPayload } from '@/interface/report.interface';

export const useSchoolReports = (schoolId: string | undefined, status?: string) =>
  useQuery({
    queryKey: ['school-reports', schoolId, status],
    queryFn: () => reportService.getSchoolReports(schoolId!, status ? { status } : undefined),
    enabled: !!schoolId,
    staleTime: 60_000,
  });

export const useCreateReport = (schoolId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classroomId, payload }: { classroomId: string; payload: CreateReportPayload }) =>
      reportService.createReport(schoolId, classroomId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school-reports', schoolId] });
    },
  });
};

export const useSubmitReport = (schoolId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => reportService.submitReport(schoolId, reportId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school-reports', schoolId] });
    },
  });
};

export const useApproveReport = (schoolId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => reportService.approveReport(schoolId, reportId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school-reports', schoolId] });
    },
  });
};

export const useRejectReport = (schoolId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, payload }: { reportId: string; payload: RejectReportPayload }) =>
      reportService.rejectReport(schoolId, reportId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school-reports', schoolId] });
    },
  });
};

export const useStudentReports = (studentId: string | undefined) =>
  useQuery({
    queryKey: ['student-reports', studentId],
    queryFn: () => reportService.getStudentReports(studentId!),
    enabled: !!studentId,
    staleTime: 60_000,
  });
