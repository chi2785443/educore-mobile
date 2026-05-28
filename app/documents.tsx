import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, Linking, RefreshControl,
} from 'react-native';
import { toast } from '@/components/ui/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { useMyDocuments, usePublicDocuments } from '@/hooks/useMemberDocuments';
import { memberDocumentService } from '@/services/member-document.service';
import { MemberDocument } from '@/interface/document.interface';
import { LibraryFileType } from '@/interface/library.interface';

/* ── File config ────────────────────────────────────────────────── */
const FILE_CONFIG: Record<LibraryFileType, { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string; label: string }> = {
  pdf:   { icon: 'document-text-outline', color: '#dc2626', bg: '#fef2f2',  label: 'PDF' },
  word:  { icon: 'document-outline',      color: '#2563eb', bg: '#eff6ff',  label: 'Word' },
  excel: { icon: 'grid-outline',          color: '#16a34a', bg: '#f0fdf4',  label: 'Excel' },
  ppt:   { icon: 'easel-outline',         color: '#d97706', bg: '#fffbeb',  label: 'PPT' },
  image: { icon: 'image-outline',         color: '#7c3aed', bg: '#f5f3ff',  label: 'Image' },
  other: { icon: 'attach-outline',        color: '#64748b', bg: '#f8fafc',  label: 'File' },
};

const SOURCE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  enrollment:       { label: 'Enrollment', color: '#0284c7', bg: '#dbeafe' },
  job_application:  { label: 'Application', color: '#7c3aed', bg: '#ede9fe' },
  admin:            { label: 'Admin',       color: '#d97706', bg: '#fef3c7' },
  self:             { label: 'Self',        color: '#059669', bg: '#d1fae5' },
};

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

/* ── Document row ───────────────────────────────────────────────── */
function DocRow({ doc }: { doc: MemberDocument }) {
  const cfg = FILE_CONFIG[doc.fileType] ?? FILE_CONFIG.other;
  const sourceSt = doc.source ? SOURCE_LABELS[doc.source] : null;
  const [opening, setOpening] = useState(false);

  const handleOpen = async () => {
    setOpening(true);
    try {
      const url = await memberDocumentService.getSignedViewUrl(doc.fileUrl);
      await Linking.openURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open file');
    } finally {
      setOpening(false);
    }
  };

  return (
    <Pressable onPress={handleOpen} style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 13, paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
      }}>
        {/* Icon */}
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ionicons name={cfg.icon} size={22} color={cfg.color} />
        </View>

        {/* Info */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>{doc.title}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 11, color: '#9ca3af' }}>{cfg.label} · {formatSize(doc.fileSize)}</Text>
            {sourceSt && (
              <View style={{ backgroundColor: sourceSt.bg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: sourceSt.color }}>{sourceSt.label}</Text>
              </View>
            )}
            {doc.visibility === 'public' && (
              <View style={{ backgroundColor: '#dcfce7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#16a34a' }}>Public</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 11, color: '#d1d5db', marginTop: 2 }}>
            {format(new Date(doc.createdAt), 'd MMM yyyy')}
          </Text>
        </View>

        {/* Open indicator */}
        {opening
          ? <ActivityIndicator size="small" color="#d97706" />
          : <Ionicons name="open-outline" size={17} color="#cbd5e1" />}
      </View>
    </Pressable>
  );
}

/* ── Main screen ────────────────────────────────────────────────── */
export default function DocumentsScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const primary = (user?.schools ?? []).find(m => m.schoolId === selectedSchoolId)
    ?? (user?.schools ?? [])[0];
  const schoolId = primary?.schoolId ?? '';

  const [tab, setTab] = useState<'mine' | 'public'>('mine');

  const { data: myDocs = [], isLoading: loadingMine, refetch: refetchMine } = useMyDocuments(schoolId);
  const { data: publicDocs = [], isLoading: loadingPublic, refetch: refetchPublic } = usePublicDocuments(
    tab === 'public' ? schoolId : undefined,
  );
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchMine(), refetchPublic()]);
    setRefreshing(false);
  }, [refetchMine, refetchPublic]);

  const docs = tab === 'mine' ? myDocs : publicDocs;
  const isLoading = tab === 'mine' ? loadingMine : loadingPublic;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#1c1005', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>My Documents</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
              {docs.length} document{docs.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Ionicons name="document-text-outline" size={22} color="#fbbf24" />
        </View>
      </View>

      {/* Tab pills */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
        {(['mine', 'public'] as const).map(t => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={{
              flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center',
              backgroundColor: tab === t ? '#d97706' : '#f3f4f6',
              borderWidth: 1, borderColor: tab === t ? '#d97706' : '#e5e7eb',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: tab === t ? '#fff' : '#6b7280' }}>
              {t === 'mine' ? 'My Documents' : 'School Public'}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#d97706" size="large" />
        </View>
      ) : docs.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <Ionicons name="document-outline" size={48} color="#d1d5db" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', textAlign: 'center' }}>
            {tab === 'mine' ? 'No documents yet' : 'No public documents'}
          </Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            {tab === 'mine'
              ? 'Documents uploaded by your school admin will appear here.'
              : 'School-wide public documents will appear here.'}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d97706" colors={['#d97706']} />}>
          {/* Group by date if needed — simple flat list for now */}
          <View style={{ backgroundColor: '#fff', marginTop: 12, marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 }}>
            {docs.map(doc => <DocRow key={doc.id} doc={doc} />)}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
