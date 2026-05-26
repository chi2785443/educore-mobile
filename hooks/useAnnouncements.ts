import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementService } from '@/services/announcement.service';
import { CreateAnnouncementPayload } from '@/interface/announcement.interface';

export const useSchoolAnnouncements = (schoolId: string | undefined) =>
  useQuery({
    queryKey: ['announcements', schoolId],
    queryFn: () => announcementService.getSchoolAnnouncements(schoolId!),
    enabled: !!schoolId,
    staleTime: 2 * 60_000,
  });

export const useCreateAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) =>
      announcementService.createAnnouncement(payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['announcements', vars.schoolId] });
      qc.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });
};
