import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enquiryService } from '@/services/enquiry.service';
import { CreateEnquiry, EnquiryStatus, ReplyEnquiry } from '@/interface/enquiry.interface';

export function useMyEnquiries() {
  return useQuery({
    queryKey: ['enquiries', 'my'],
    queryFn: () => enquiryService.getMy(),
    staleTime: 60 * 1000,
  });
}

export function useCreateEnquiry(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEnquiry) => enquiryService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enquiries', 'my'] });
      onSuccess?.();
    },
  });
}

export function useSchoolEnquiries(schoolId: string, status?: EnquiryStatus) {
  return useQuery({
    queryKey: ['enquiries', 'school', schoolId, status ?? 'all'],
    queryFn: () => enquiryService.getBySchool(schoolId, status),
    enabled: !!schoolId,
    staleTime: 30 * 1000,
  });
}

export function useReplyEnquiry(schoolId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReplyEnquiry }) =>
      enquiryService.reply(schoolId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enquiries', 'school', schoolId] });
      onSuccess?.();
    },
  });
}

export function useCloseEnquiry(schoolId: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enquiryService.close(schoolId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enquiries', 'school', schoolId] });
      onSuccess?.();
    },
  });
}
