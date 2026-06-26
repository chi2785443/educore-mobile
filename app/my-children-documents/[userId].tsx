import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking, Alert } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useChildMemberDocuments } from '@/hooks/useMemberDocuments';
import { useAuthStore } from '@/store/authStore';
import { MemberDocument } from '@/interface/document.interface';
import { LibraryFileType } from '@/interface/library.interface';
import { memberDocumentService } from '@/services/member-document.service';

const FILE_CONFIG: Record<LibraryFileType, {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bg: string;
  label: string;
}> = {
  pdf:   { icon: 'document-text-outline', color: '#dc2626', bg: '#fef2f2', label: 'PDF' },
  word:  { icon: 'document-outline',      color: '#2563eb', bg: '#eff6ff', label: 'Word' },
  excel: { icon: 'grid-outline',          color: '#16a34a', bg: '#f0fdf4', label: 'Excel' },
  ppt:   { icon: 'easel-outline',         color: '#d97706', bg: '#fffbeb', label: 'PPT' },
  image: { icon: 'image-outline',         color: '#7c3aed', bg: '#f5f3ff', label: 'Image' },
  other: { icon: 'attach-outline',        color: '#64748b', bg: '#f8fafc', label: 'File' },
};

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

async function openDocument(doc: MemberDocument) {
  try {
    const signedUrl = await memberDocumentService.getSignedViewUrl(doc.fileUrl);
    const url = typeof signedUrl === 'string' ? signedUrl : doc.fileUrl;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Cannot open', 'No app available to open this file.');
    }
  } catch {
    const canOpen = await Linking.canOpenURL(doc.fileUrl);
    if (canOpen) await Linking.openURL(doc.fileUrl);
    else Alert.alert('Error', 'Could not open this file.');
  }
}

function DocRow({ doc }: { doc: MemberDocument }) {
  const cfg = FILE_CONFIG[doc.fileType] ?? FILE_CONFIG.other;
  const isPublic = doc.visibility === 'public';

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderColor: '#f8fafc', gap: 12,
    }}>
      {/* File icon */}
      <View style={{
        width: 42, height: 42, borderRadius: 13,
        backgroundColor: cfg.bg,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Ionicons name={cfg.icon} size={19} color={cfg.color} />
      </View>

      {/* Info */}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>
          {doc.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 10, color: '#94a3b8' }}>{cfg.label}</Text>
          {doc.fileSize > 0 && (
            <Text style={{ fontSize: 10, color: '#94a3b8' }}>· {formatSize(doc.fileSize)}</Text>
          )}
          <View style={{
            backgroundColor: isPublic ? '#dcfce7' : '#fef3c7',
            borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1,
          }}>
            <Text style={{
              fontSize: 9, fontWeight: '700',
              color: isPublic ? '#16a34a' : '#d97706',
            }}>
              {isPublic ? 'Public' : 'Private'}
            </Text>
          </View>
        </View>
      </View>

      {/* Open button */}
      <Pressable
        onPress={() => openDocument(doc)}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <View style={{
          width: 34, height: 34, borderRadius: 10,
          backgroundColor: '#f0fdf4',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="open-outline" size={16} color="#059669" />
        </View>
      </Pressable>
    </View>
  );
}

export default function ChildDocumentsScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const user = useAuthStore(s => s.user);

  const primary = (user?.schools ?? []).find(m => m.schoolId === selectedSchoolId)
    ?? (user?.schools ?? [])[0];
  const schoolId = primary?.schoolId ?? '';

  const { data: docs = [], isLoading } = useChildMemberDocuments(schoolId, userId);

  const member = docs[0]?.user;
  const memberName = member ? `${member.firstName} ${member.lastName}` : 'Student';
  const publicCount = docs.filter(d => d.visibility === 'public').length;
  const privateCount = docs.filter(d => d.visibility === 'private').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{
        backgroundColor: '#059669',
        paddingHorizontal: 16, paddingTop: 18, paddingBottom: 28,
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View style={{
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }} numberOfLines={1}>
              {memberName}&apos;s Documents
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>
              School documents & files
            </Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Profile card */}
        <View style={{ margin: 16, marginBottom: 0 }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9',
            overflow: 'hidden',
          }}>
            <View style={{ height: 6, backgroundColor: '#059669' }} />
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                {member?.profilePicture ? (
                  <Image
                    source={{ uri: member.profilePicture }}
                    style={{ width: 52, height: 52, borderRadius: 16 }}
                    contentFit="cover"
                  />
                ) : (
                  <View style={{
                    width: 52, height: 52, borderRadius: 16,
                    backgroundColor: '#111827',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>
                      {memberName.charAt(0)}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }} numberOfLines={1}>
                    {memberName}
                  </Text>
                  {member?.email && (
                    <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }} numberOfLines={1}>
                      {member.email}
                    </Text>
                  )}
                </View>
              </View>

              {!isLoading && (
                <View style={{
                  flexDirection: 'row', marginTop: 16, paddingTop: 14,
                  borderTopWidth: 1, borderColor: '#f8fafc',
                }}>
                  {[
                    { label: 'Total Docs', value: docs.length, color: '#0f172a' },
                    { label: 'Public',     value: publicCount,  color: '#059669' },
                    { label: 'Private',    value: privateCount, color: '#d97706' },
                  ].map(s => (
                    <View key={s.label} style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontSize: 22, fontWeight: '900', color: s.color }}>{s.value}</Text>
                      <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Documents list */}
        <View style={{ margin: 16 }}>
          {isLoading ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#059669" />
            </View>
          ) : docs.length === 0 ? (
            <View style={{
              alignItems: 'center', paddingVertical: 48,
              backgroundColor: '#fff', borderRadius: 18,
              borderWidth: 2, borderColor: '#d1fae5', borderStyle: 'dashed',
            }}>
              <View style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: '#f0fdf4', marginBottom: 12,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="folder-open-outline" size={22} color="#6ee7b7" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>No documents for this student</Text>
            </View>
          ) : (
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 18, borderWidth: 1, borderColor: '#f1f5f9',
              overflow: 'hidden',
            }}>
              {/* Column header */}
              <View style={{
                paddingHorizontal: 16, paddingVertical: 10,
                backgroundColor: '#fafafa', borderBottomWidth: 1, borderColor: '#f1f5f9',
              }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {docs.length} {docs.length === 1 ? 'Document' : 'Documents'}
                </Text>
              </View>
              {docs.map(doc => (
                <DocRow key={doc.id} doc={doc} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
