import { useMutation, useQuery } from '@tanstack/react-query';
import { enquiryService } from '@/services/enquiry.service';
import { CreateEnquiry } from '@/interface/enquiry.interface';

export function useMyEnquiries() {
  return useQuery({
    queryKey: ['enquiries', 'my'],
    queryFn: () => enquiryService.getMy(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateEnquiry(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (data: CreateEnquiry) => enquiryService.create(data),
    onSuccess: () => onSuccess?.(),
  });
}
