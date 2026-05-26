import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enquiryService } from '@/services/enquiry.service';
import { CreateEnquiry } from '@/interface/enquiry.interface';

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
