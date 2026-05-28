import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, Linking,
  RefreshControl, Modal, TextInput, Alert,
} from 'react-native';
import { toast } from '@/components/ui/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import * as DocumentPicker from 'expo-document-picker';
import { useAuthStore } from '@/store/authStore';
import {
  useMyDocuments, usePublicDocuments, useAllMemberDocuments,
  useAdminUploadMemberDocument, useDeleteMemberDocument, useRequestUploadLink,
} from '@/hooks/useMemberDocuments';
import { useSchoolMembers } from '@/hooks/useSchool';
import { memberDocumentService } from '@/services/member-document.service';
import { MemberDocument } from '@/interface/document.interface';
import { LibraryFileType } from '@/interface/library.interface';
import { UserRole } from '@/interface/user.interface';
import { SchoolMember } from '@/services/school.service';

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

/* ── Member picker modal ─────────────────────────────────────────── */
function MemberPickerModal({
  visible,
  members,
  onSelect,
  onClose,
}: {
  visible: boolean;
  members: SchoolMember[];
  onSelect: (m: SchoolMember) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return members.slice(0, 50);
    const s = search.toLowerCase();
    return members.filter(m =>
      `${m.user.firstName} ${m.user.lastName}`.toLowerCase().includes(s) ||
      m.user.email.toLowerCase().includes(s),
    ).slice(0, 50);
  }, [members, search]);

  const handleClose = () => { setSearch(''); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <Pressable onPress={handleClose} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={18} color="#374151" />
          </Pressable>
          <Text style={{ flex: 1, fontSize: 17, fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>Select Member</Text>
          <View style={{ width: 34 }} />
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Ionicons name="search-outline" size={16} color="#9ca3af" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or email…"
              placeholderTextColor="#9ca3af"
              style={{ flex: 1, fontSize: 14, color: '#0f172a', paddingVertical: 0 }}
              autoFocus
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color="#9ca3af" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Member list */}
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
              <Ionicons name="person-outline" size={32} color="#d1d5db" />
              <Text style={{ fontSize: 14, color: '#9ca3af' }}>No members found</Text>
            </View>
          ) : (
            filtered.map((m, idx) => (
              <Pressable
                key={m.userId}
                onPress={() => { setSearch(''); onSelect(m); }}
                style={({ pressed }) => ({ backgroundColor: pressed ? '#f8fafc' : '#fff' })}
              >
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingHorizontal: 16, paddingVertical: 13,
                  borderBottomWidth: idx < filtered.length - 1 ? 1 : 0,
                  borderBottomColor: '#f1f5f9',
                }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Text style={{ color: '#4C3FC4', fontWeight: '800', fontSize: 14 }}>
                      {`${m.user.firstName[0] ?? ''}${m.user.lastName[0] ?? ''}`.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                      {m.user.firstName} {m.user.lastName}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }} numberOfLines={1}>
                      {m.user.email} · {m.role}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#d1d5db" />
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* ── Admin upload modal ─────────────────────────────────────────── */
interface UploadDocModalProps {
  visible: boolean;
  schoolId: string;
  onClose: () => void;
}

function UploadDocModal({ visible, schoolId, onClose }: UploadDocModalProps) {
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SchoolMember | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [file, setFile] = useState<{ uri: string; name: string; mimeType: string } | null>(null);

  const { data: members = [] } = useSchoolMembers(schoolId);
  const { mutate: upload, isPending } = useAdminUploadMemberDocument(schoolId);

  const reset = () => {
    setSelectedMember(null); setTitle('');
    setDescription(''); setVisibility('private'); setFile(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setFile({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/octet-stream' });
    }
  };

  const handleSubmit = () => {
    if (!selectedMember) { toast.error('Select a member'); return; }
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!file) { toast.error('Please select a file'); return; }
    upload({
      schoolId, userId: selectedMember.userId, title: title.trim(),
      description: description.trim() || undefined, visibility,
      fileUri: file.uri, fileName: file.name, fileMimeType: file.mimeType,
    }, {
      onSuccess: () => { toast.success('Document uploaded'); reset(); onClose(); },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Upload failed'),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
            <Pressable onPress={handleClose} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={18} color="#374151" />
            </Pressable>
            <Text style={{ flex: 1, fontSize: 17, fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>Upload for Member</Text>
            <View style={{ width: 34 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">

            {/* Member dropdown selector */}
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Member *</Text>
              {selectedMember ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E8F5EE', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#86efac' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#4C3FC4', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                      {`${selectedMember.user.firstName[0] ?? ''}${selectedMember.user.lastName[0] ?? ''}`.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                      {selectedMember.user.firstName} {selectedMember.user.lastName}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>{selectedMember.user.email}</Text>
                  </View>
                  <Pressable onPress={() => setSelectedMember(null)} hitSlop={8}>
                    <Ionicons name="close-circle" size={22} color="#9ca3af" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setShowMemberPicker(true)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, padding: 14, backgroundColor: '#fafafa' }}>
                    <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="person-outline" size={18} color="#9ca3af" />
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, color: '#9ca3af' }}>Select a member…</Text>
                    <Ionicons name="chevron-down" size={16} color="#9ca3af" />
                  </View>
                </Pressable>
              )}
            </View>

            {/* Title */}
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>Document title *</Text>
              <TextInput
                value={title} onChangeText={setTitle}
                placeholder="e.g. Staff Contract 2025"
                placeholderTextColor="#9ca3af"
                style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a', backgroundColor: '#fafafa' }}
              />
            </View>

            {/* Description */}
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>Description</Text>
              <TextInput
                value={description} onChangeText={setDescription} multiline numberOfLines={3}
                placeholder="Optional notes..."
                placeholderTextColor="#9ca3af"
                style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a', backgroundColor: '#fafafa', minHeight: 72, textAlignVertical: 'top' }}
              />
            </View>

            {/* Visibility */}
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Visibility</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {(['private', 'public'] as const).map(v => {
                  const active = visibility === v;
                  return (
                    <Pressable key={v} onPress={() => setVisibility(v)}
                      style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: active ? '#d97706' : '#f3f4f6', borderWidth: 1, borderColor: active ? '#d97706' : '#e5e7eb' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{v === 'private' ? 'Private' : 'Public'}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* File picker */}
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>File *</Text>
              <Pressable onPress={pickFile} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                <View style={{ borderWidth: 2, borderColor: file ? '#d97706' : '#e5e7eb', borderStyle: 'dashed', borderRadius: 14, padding: 16, alignItems: 'center', gap: 6, backgroundColor: file ? '#fffbeb' : '#fafafa' }}>
                  <Ionicons name={file ? 'document-attach' : 'cloud-upload-outline'} size={28} color={file ? '#d97706' : '#9ca3af'} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: file ? '#d97706' : '#6b7280' }}>
                    {file ? file.name : 'Tap to select file'}
                  </Text>
                  {file && <Text style={{ fontSize: 11, color: '#9ca3af' }}>Tap to change</Text>}
                </View>
              </Pressable>
            </View>

            <Pressable onPress={handleSubmit} disabled={isPending} style={({ pressed }) => ({ opacity: pressed || isPending ? 0.75 : 1 })}>
              <View style={{ backgroundColor: '#d97706', borderRadius: 14, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                {isPending && <ActivityIndicator size="small" color="#fff" />}
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{isPending ? 'Uploading…' : 'Upload Document'}</Text>
              </View>
            </Pressable>
          </ScrollView>

          <MemberPickerModal
            visible={showMemberPicker}
            members={members}
            onSelect={(m) => { setSelectedMember(m); setShowMemberPicker(false); }}
            onClose={() => setShowMemberPicker(false)}
          />
        </SafeAreaView>
      </Modal>
  );
}

/* ── Request upload link modal ──────────────────────────────────── */
interface RequestLinkModalProps {
  visible: boolean;
  schoolId: string;
  onClose: () => void;
}

function RequestLinkModal({ visible, schoolId, onClose }: RequestLinkModalProps) {
  const [email, setEmail] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [message, setMessage] = useState('');
  const { mutate: request, isPending } = useRequestUploadLink();

  const reset = () => { setEmail(''); setDocTitle(''); setMessage(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    if (!email.trim()) { toast.error('Recipient email is required'); return; }
    if (!docTitle.trim()) { toast.error('Document title is required'); return; }
    request({
      schoolId, recipientEmail: email.trim(),
      documentTitle: docTitle.trim(),
      message: message.trim() || undefined,
    }, {
      onSuccess: () => { toast.success('Upload link sent'); reset(); onClose(); },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to send'),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <Pressable onPress={handleClose} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={18} color="#374151" />
          </Pressable>
          <Text style={{ flex: 1, fontSize: 17, fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>Request Document</Text>
          <View style={{ width: 34 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
          <View style={{ backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Ionicons name="information-circle-outline" size={18} color="#2563eb" style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontSize: 13, color: '#1d4ed8', lineHeight: 19 }}>
              An upload link will be emailed to the member. They can use it to upload the requested document directly.
            </Text>
          </View>

          <View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>Recipient email *</Text>
            <TextInput
              value={email} onChangeText={setEmail}
              placeholder="member@school.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address" autoCapitalize="none"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a', backgroundColor: '#fafafa' }}
            />
          </View>

          <View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>Document title *</Text>
            <TextInput
              value={docTitle} onChangeText={setDocTitle}
              placeholder="e.g. WAEC Certificate"
              placeholderTextColor="#9ca3af"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a', backgroundColor: '#fafafa' }}
            />
          </View>

          <View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 }}>Message to member</Text>
            <TextInput
              value={message} onChangeText={setMessage} multiline numberOfLines={3}
              placeholder="Please upload your WAEC certificate..."
              placeholderTextColor="#9ca3af"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a', backgroundColor: '#fafafa', minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>

          <Pressable onPress={handleSubmit} disabled={isPending} style={({ pressed }) => ({ opacity: pressed || isPending ? 0.75 : 1 })}>
            <View style={{ backgroundColor: '#0284c7', borderRadius: 14, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              {isPending && <ActivityIndicator size="small" color="#fff" />}
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{isPending ? 'Sending…' : 'Send Upload Link'}</Text>
            </View>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* ── Document row ───────────────────────────────────────────────── */
function DocRow({ doc, isAdmin, onDelete, hideMember = false }: { doc: MemberDocument; isAdmin: boolean; onDelete: (id: string) => void; hideMember?: boolean }) {
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

  const confirmDelete = () => {
    Alert.alert('Delete document', `Remove "${doc.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(doc.id) },
    ]);
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
          {!hideMember && doc.user && (
            <Text style={{ fontSize: 11, color: '#4C3FC4', marginTop: 1 }} numberOfLines={1}>
              {doc.user.firstName} {doc.user.lastName}
            </Text>
          )}
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

        {/* Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {isAdmin && (
            <Pressable onPress={confirmDelete} hitSlop={8}
              style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="trash-outline" size={15} color="#dc2626" />
            </Pressable>
          )}
          {opening
            ? <ActivityIndicator size="small" color="#d97706" />
            : <Ionicons name="open-outline" size={17} color="#cbd5e1" />}
        </View>
      </View>
    </Pressable>
  );
}

/* ── Main screen ────────────────────────────────────────────────── */
type TabKey = 'mine' | 'public' | 'all';

export default function DocumentsScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const primary = (user?.schools ?? []).find(m => m.schoolId === selectedSchoolId)
    ?? (user?.schools ?? [])[0];
  const schoolId = primary?.schoolId ?? '';

  const role = primary?.role ?? '';
  const isAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN || !!user?.isAdmin;

  const [tab, setTab] = useState<TabKey>('mine');
  const [showUpload, setShowUpload] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  const { data: myDocs = [], isLoading: loadingMine, refetch: refetchMine } = useMyDocuments(schoolId);
  const { data: publicDocs = [], isLoading: loadingPublic, refetch: refetchPublic } = usePublicDocuments(
    tab === 'public' ? schoolId : undefined,
  );
  const { data: allDocs = [], isLoading: loadingAll, refetch: refetchAll } = useAllMemberDocuments(
    isAdmin && tab === 'all' ? schoolId : undefined,
  );
  const { mutate: deleteDoc } = useDeleteMemberDocument(schoolId);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchMine(), refetchPublic(), refetchAll()]);
    setRefreshing(false);
  }, [refetchMine, refetchPublic, refetchAll]);

  const docs = tab === 'mine' ? myDocs : tab === 'public' ? publicDocs : allDocs;
  const isLoading = tab === 'mine' ? loadingMine : tab === 'public' ? loadingPublic : loadingAll;

  // Group allDocs by member for the "All Members" tab
  const memberGroups = useMemo(() => {
    if (tab !== 'all') return [];
    const map = new Map<string, { userId: string; name: string; email: string; profilePicture?: string | null; docs: typeof allDocs }>();
    allDocs.forEach(doc => {
      const key = doc.userId;
      if (!map.has(key)) {
        map.set(key, {
          userId: key,
          name: doc.user ? `${doc.user.firstName} ${doc.user.lastName}` : 'Unknown',
          email: doc.user?.email ?? '',
          profilePicture: doc.user?.profilePicture,
          docs: [],
        });
      }
      map.get(key)!.docs.push(doc);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tab, allDocs]);

  const handleDelete = useCallback((id: string) => {
    deleteDoc(id, {
      onSuccess: () => toast.success('Document deleted'),
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to delete'),
    });
  }, [deleteDoc]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'mine', label: 'My Documents' },
    { key: 'public', label: 'School Public' },
    ...(isAdmin ? [{ key: 'all' as TabKey, label: 'All Members' }] : []),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#1c1005', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>My Documents</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
              {docs.length} document{docs.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Admin action buttons */}
          {isAdmin && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={() => setShowRequest(true)} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="mail-outline" size={18} color="#93c5fd" />
                </View>
              </Pressable>
              <Pressable onPress={() => setShowUpload(true)} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#d97706', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}>
                  <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Upload</Text>
                </View>
              </Pressable>
            </View>
          )}

          {!isAdmin && <Ionicons name="document-text-outline" size={22} color="#fbbf24" />}
        </View>
      </View>

      {/* Tab pills */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
        {tabs.map(t => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={{
              flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center',
              backgroundColor: tab === t.key ? '#d97706' : '#f3f4f6',
              borderWidth: 1, borderColor: tab === t.key ? '#d97706' : '#e5e7eb',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: tab === t.key ? '#fff' : '#6b7280' }}>
              {t.label}
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
            {tab === 'mine' ? 'No documents yet' : tab === 'public' ? 'No public documents' : 'No member documents'}
          </Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            {tab === 'mine'
              ? 'Documents uploaded by your school admin will appear here.'
              : tab === 'public'
              ? 'School-wide public documents will appear here.'
              : 'Upload a document for a member using the Upload button.'}
          </Text>
        </View>
      ) : tab === 'all' ? (
        /* ── Grouped by member ── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d97706" colors={['#d97706']} />}
        >
          {memberGroups.map(group => {
            const initials = group.name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '?';
            return (
              <View key={group.userId} style={{ marginBottom: 18 }}>
                {/* Member header */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  paddingVertical: 10, paddingHorizontal: 14,
                  backgroundColor: '#4C3FC4',
                  borderRadius: 14,
                  marginBottom: 2,
                }}>
                  {group.profilePicture ? (
                    <Image
                      source={{ uri: group.profilePicture }}
                      style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>{initials}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>{group.name}</Text>
                    {group.email ? (
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)', marginTop: 1 }} numberOfLines={1}>{group.email}</Text>
                    ) : null}
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>
                      {group.docs.length} doc{group.docs.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>

                {/* Doc rows for this member */}
                <View style={{ backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 }}>
                  {group.docs.map(doc => <DocRow key={doc.id} doc={doc} isAdmin={isAdmin} onDelete={handleDelete} hideMember />)}
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        /* ── Flat list for mine / public ── */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d97706" colors={['#d97706']} />}>
          <View style={{ backgroundColor: '#fff', marginTop: 12, marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 }}>
            {docs.map(doc => <DocRow key={doc.id} doc={doc} isAdmin={isAdmin} onDelete={handleDelete} />)}
          </View>
        </ScrollView>
      )}

      <UploadDocModal visible={showUpload} schoolId={schoolId} onClose={() => setShowUpload(false)} />
      <RequestLinkModal visible={showRequest} schoolId={schoolId} onClose={() => setShowRequest(false)} />
    </SafeAreaView>
  );
}
