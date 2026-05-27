import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Linking, RefreshControl,
} from 'react-native';
import { toast } from '@/components/ui/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useLibraryCategories, useLibraryDocuments } from '@/hooks/useLibrary';
import { libraryService } from '@/services/library.service';
import { LibraryDocument, LibraryFileType } from '@/interface/library.interface';

/* ── File type config ───────────────────────────────────────────── */
const FILE_CONFIG: Record<LibraryFileType, { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string; label: string }> = {
  pdf:   { icon: 'document-text-outline', color: '#dc2626', bg: '#fef2f2',  label: 'PDF' },
  word:  { icon: 'document-outline',      color: '#2563eb', bg: '#eff6ff',  label: 'Word' },
  excel: { icon: 'grid-outline',          color: '#16a34a', bg: '#f0fdf4',  label: 'Excel' },
  ppt:   { icon: 'easel-outline',         color: '#d97706', bg: '#fffbeb',  label: 'PPT' },
  image: { icon: 'image-outline',         color: '#7c3aed', bg: '#f5f3ff',  label: 'Image' },
  other: { icon: 'attach-outline',        color: '#64748b', bg: '#f8fafc',  label: 'File' },
};

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

/* ── Document card ─────────────────────────────────────────────── */
function DocCard({ doc }: { doc: LibraryDocument }) {
  const cfg = FILE_CONFIG[doc.fileType] ?? FILE_CONFIG.other;
  const [opening, setOpening] = useState(false);

  const handleOpen = async () => {
    setOpening(true);
    try {
      const url = await libraryService.getSignedViewUrl(doc.fileUrl);
      await Linking.openURL(url);
      await libraryService.recordDownload(doc.schoolId, doc.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open file');
    } finally {
      setOpening(false);
    }
  };

  return (
    <Pressable onPress={handleOpen} style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}>
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9',
        padding: 14, gap: 10,
        shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        {/* File icon */}
        <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ionicons name={cfg.icon} size={22} color={cfg.color} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }} numberOfLines={2}>{doc.title}</Text>
          {doc.description && (
            <Text style={{ fontSize: 12, color: '#64748b', marginTop: 3, lineHeight: 18 }} numberOfLines={2}>{doc.description}</Text>
          )}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <View style={{ backgroundColor: cfg.bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: cfg.color }}>{cfg.label}</Text>
            </View>
            <Text style={{ fontSize: 11, color: '#9ca3af' }}>{formatSize(doc.fileSize)}</Text>
            {doc.isDownloadable && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="download-outline" size={11} color="#9ca3af" />
                <Text style={{ fontSize: 11, color: '#9ca3af' }}>{doc.downloadCount}</Text>
              </View>
            )}
          </View>
        </View>

        {opening
          ? <ActivityIndicator size="small" color="#7c3aed" />
          : <Ionicons name="open-outline" size={18} color="#cbd5e1" />}
      </View>

      {doc.tags && doc.tags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {doc.tags.map(tag => (
              <View key={tag} style={{ backgroundColor: '#f1f5f9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ fontSize: 11, color: '#64748b' }}>#{tag}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      </View>
    </Pressable>
  );
}

/* ── Main screen ────────────────────────────────────────────────── */
export default function LibraryScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const primary = (user?.schools ?? []).find(m => m.schoolId === selectedSchoolId)
    ?? (user?.schools ?? [])[0];
  const schoolId = primary?.schoolId ?? '';

  const [activeCategory, setActiveCategory] = useState<string | undefined>();
  const [search, setSearch] = useState('');

  const { data: categories = [], refetch: refetchCats } = useLibraryCategories(schoolId);
  const { data: documents = [], isLoading, refetch: refetchDocs } = useLibraryDocuments(schoolId, activeCategory);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCats(), refetchDocs()]);
    setRefreshing(false);
  }, [refetchCats, refetchDocs]);

  const filtered = useMemo(() => {
    if (!search) return documents;
    const s = search.toLowerCase();
    return documents.filter(d => d.title.toLowerCase().includes(s) || d.category.toLowerCase().includes(s) || (d.tags ?? []).some(t => t.toLowerCase().includes(s)));
  }, [documents, search]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#160d24', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>Library</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
              {filtered.length} resource{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Ionicons name="library-outline" size={22} color="#a78bfa" />
        </View>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
          <Ionicons name="search-outline" size={15} color="rgba(255,255,255,0.3)" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search by title or tag..." placeholderTextColor="rgba(255,255,255,0.25)" style={{ flex: 1, color: '#fff', fontSize: 13, paddingVertical: 0 }} />
          {search.length > 0 && <Pressable onPress={() => setSearch('')} hitSlop={8}><Ionicons name="close-circle" size={15} color="rgba(255,255,255,0.3)" /></Pressable>}
        </View>
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', maxHeight: 50 }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' }}>
        <Pressable onPress={() => setActiveCategory(undefined)} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: !activeCategory ? '#7c3aed' : '#f3f4f6', borderWidth: 1, borderColor: !activeCategory ? '#7c3aed' : '#e5e7eb' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: !activeCategory ? '#fff' : '#6b7280' }}>All</Text>
        </Pressable>
        {categories.map(cat => {
          const active = activeCategory === cat;
          return (
            <Pressable key={cat} onPress={() => setActiveCategory(active ? undefined : cat)} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: active ? '#7c3aed' : '#f3f4f6', borderWidth: 1, borderColor: active ? '#7c3aed' : '#e5e7eb' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#6b7280' }}>{cat}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#7c3aed" size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <Ionicons name="library-outline" size={48} color="#d1d5db" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151', textAlign: 'center' }}>
            {search ? 'No results found' : 'No resources yet'}
          </Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            {search ? 'Try different search terms.' : 'School library resources will appear here.'}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 36 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" colors={['#7c3aed']} />}>
          {filtered.map(doc => <DocCard key={doc.id} doc={doc} />)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
