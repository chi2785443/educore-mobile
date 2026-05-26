import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { toast } from '@/components/ui/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useMyEnrollments, useCreateEnrollment } from '@/hooks/useEnrollment';
import { useBrowseSchools } from '@/hooks/useSchool';
import { Enrollment, EnrollmentStatus } from '@/interface/enrollment.interface';
import { School } from '@/interface/school.interface';
import { apiClient } from '@/services/axios.service';

// ─── Constants ────────────────────────────────────────────────────────────────

const HEADER_COLOR = '#0c2030';

function statusConfig(status: EnrollmentStatus) {
  switch (status) {
    case 'accepted':    return { label: 'Accepted',     bg: '#dcfce7', color: '#16a34a', icon: 'checkmark-circle'   as const };
    case 'declined':    return { label: 'Declined',     bg: '#fee2e2', color: '#dc2626', icon: 'close-circle'       as const };
    case 'under_review':return { label: 'Under Review', bg: '#dbeafe', color: '#2563eb', icon: 'eye-outline'        as const };
    case 'waitlisted':  return { label: 'Waitlisted',   bg: '#fef3c7', color: '#d97706', icon: 'hourglass-outline'  as const };
    default:            return { label: 'Pending',      bg: '#f5f3ff', color: '#7c3aed', icon: 'time-outline'       as const };
  }
}

function fmtSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Enrollment Card (list) ───────────────────────────────────────────────────

function EnrollmentCard({ item, onPress }: { item: Enrollment; onPress: () => void }) {
  const cfg = statusConfig(item.status);
  const schoolName = item.school?.name ?? item.schoolName ?? 'Unknown School';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <View style={{
        backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
        borderWidth: 1, borderColor: '#e5e7eb',
        shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
      }}>
        {/* status stripe */}
        <View style={{ height: 3, backgroundColor: cfg.color }} />
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }} numberOfLines={1}>{schoolName}</Text>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }} numberOfLines={1}>{item.trainingInterest}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: cfg.bg, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, flexShrink: 0 }}>
              <Ionicons name={cfg.icon} size={12} color={cfg.color} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {item.gradeLevel && (
              <View style={{ backgroundColor: '#f5f3ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#7c3aed' }}>Grade {item.gradeLevel}</Text>
              </View>
            )}
            <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600' }}>
                Applied {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>

          {/* Response message preview */}
          {item.responseMessage && (item.status === 'accepted' || item.status === 'declined') && (
            <View style={{
              marginTop: 10, borderRadius: 10, padding: 10, borderLeftWidth: 3,
              backgroundColor: item.status === 'accepted' ? '#f0fdf4' : '#fef2f2',
              borderLeftColor: item.status === 'accepted' ? '#16a34a' : '#dc2626',
            }}>
              <Text style={{ fontSize: 12, color: item.status === 'accepted' ? '#166534' : '#991b1b' }} numberOfLines={2}>
                {item.responseMessage}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 11, color: '#6366f1', fontWeight: '700' }}>View details</Text>
              <Ionicons name="chevron-forward" size={13} color="#6366f1" />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Detail View ──────────────────────────────────────────────────────────────

function DetailView({ enrollment, onBack }: { enrollment: Enrollment; onBack: () => void }) {
  const cfg = statusConfig(enrollment.status);
  const schoolName = enrollment.school?.name ?? enrollment.schoolName ?? 'Unknown School';
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  const handleViewDoc = async (fileUrl: string) => {
    setViewingDoc(fileUrl);
    try {
      const res = await apiClient.get<{ url: string }>('/files/view-url', { params: { fileUrl } });
      const signed = res.data?.url ?? (res.data as unknown as string);
      await Linking.openURL(signed);
    } catch {
      toast.error('Could not open document. Please try again.');
    } finally {
      setViewingDoc(null);
    }
  };

  const docs = [enrollment.document1, enrollment.document2].filter(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={{ backgroundColor: HEADER_COLOR, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }} numberOfLines={1}>{schoolName}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>Enrollment Application</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: cfg.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Ionicons name={cfg.icon} size={13} color={cfg.color} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
          </View>
        </View>

        {/* Key meta row */}
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>
              Applied {new Date(enrollment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          {enrollment.reviewedAt && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>
                Reviewed {new Date(enrollment.reviewedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>

        {/* Response from school */}
        {enrollment.responseMessage && (
          <View style={{
            borderRadius: 16, padding: 16, borderWidth: 1,
            backgroundColor: enrollment.status === 'accepted' ? '#f0fdf4' : enrollment.status === 'declined' ? '#fef2f2' : '#fff7ed',
            borderColor: enrollment.status === 'accepted' ? '#bbf7d0' : enrollment.status === 'declined' ? '#fecaca' : '#fed7aa',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons
                name={enrollment.status === 'accepted' ? 'checkmark-circle' : enrollment.status === 'declined' ? 'close-circle' : 'information-circle-outline'}
                size={18}
                color={enrollment.status === 'accepted' ? '#16a34a' : enrollment.status === 'declined' ? '#dc2626' : '#d97706'}
              />
              <Text style={{
                fontSize: 13, fontWeight: '800',
                color: enrollment.status === 'accepted' ? '#166534' : enrollment.status === 'declined' ? '#991b1b' : '#92400e',
              }}>
                Message from School
              </Text>
            </View>
            <Text style={{
              fontSize: 13, lineHeight: 20,
              color: enrollment.status === 'accepted' ? '#166534' : enrollment.status === 'declined' ? '#991b1b' : '#92400e',
            }}>
              {enrollment.responseMessage}
            </Text>
          </View>
        )}

        {/* Application details card */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 }}>
            Application Details
          </Text>
          <View style={{ gap: 12 }}>
            <DetailRow icon="school-outline" label="Training / Program" value={enrollment.trainingInterest} />
            {enrollment.gradeLevel && (
              <DetailRow icon="layers-outline" label="Grade Level" value={enrollment.gradeLevel} />
            )}
            {enrollment.previousSchool && (
              <DetailRow icon="business-outline" label="Previous School" value={enrollment.previousSchool} />
            )}
          </View>
        </View>

        {/* Personal statement */}
        {enrollment.personalStatement && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
              Personal Statement
            </Text>
            <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>{enrollment.personalStatement}</Text>
          </View>
        )}

        {/* Documents */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
            Supporting Documents
          </Text>
          {enrollment.documentsDeleted ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', borderRadius: 10, padding: 12 }}>
              <Ionicons name="trash-outline" size={16} color="#9ca3af" />
              <Text style={{ fontSize: 13, color: '#9ca3af' }}>Documents removed after processing</Text>
            </View>
          ) : docs.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#9ca3af' }}>No documents attached</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {docs.map((doc, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f8fafc', borderRadius: 12, padding: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ionicons name="document-text-outline" size={18} color="#6366f1" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }} numberOfLines={1}>{doc!.name}</Text>
                    {doc!.fileSize && (
                      <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{fmtSize(doc!.fileSize)}</Text>
                    )}
                  </View>
                  {doc!.url && (
                    <Pressable
                      onPress={() => handleViewDoc(doc!.url)}
                      disabled={viewingDoc === doc!.url}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' }}>
                        {viewingDoc === doc!.url
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Ionicons name="eye-outline" size={16} color="#fff" />}
                      </View>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* What happens next */}
        {(enrollment.status === 'pending' || enrollment.status === 'under_review') && (
          <View style={{ backgroundColor: '#f5f3ff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e0e7ff' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="information-circle-outline" size={18} color="#7c3aed" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#5b21b6' }}>What happens next?</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#6d28d9', lineHeight: 20 }}>
              The school is reviewing your application. You will receive a notification when a decision has been made. This usually takes a few business days.
            </Text>
          </View>
        )}

        {enrollment.status === 'waitlisted' && (
          <View style={{ backgroundColor: '#fff7ed', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#fed7aa' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="hourglass-outline" size={18} color="#d97706" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#92400e' }}>You are on the waitlist</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#b45309', lineHeight: 20 }}>
              You have been placed on the waitlist. The school will contact you if a spot becomes available.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <Ionicons name={icon} size={15} color="#7c3aed" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '700', marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600' }}>{value}</Text>
      </View>
    </View>
  );
}

// ─── School Picker ────────────────────────────────────────────────────────────

function SchoolPickerView({ onSelect, onBack }: { onSelect: (s: School) => void; onBack: () => void }) {
  const [search, setSearch] = useState('');
  const { data: schools = [], isLoading } = useBrowseSchools(search ? { search } : undefined);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ backgroundColor: HEADER_COLOR, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', flex: 1 }}>Choose a School</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 }}>
          <Ionicons name="search-outline" size={15} color="rgba(255,255,255,0.4)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search schools…"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={{ flex: 1, fontSize: 13, color: '#fff' }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={15} color="rgba(255,255,255,0.4)" />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#14b8a6" size="large" />
        </View>
      ) : schools.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 }}>
          <Ionicons name="school-outline" size={48} color="#d1d5db" />
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#374151', textAlign: 'center' }}>
            {search ? 'No schools found' : 'No schools available'}
          </Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            {search ? 'Try a different search term.' : 'Schools will appear here once they join EduCore.'}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}>
          {schools.map(school => (
            <Pressable key={school.id} onPress={() => onSelect(school)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ionicons name="school-outline" size={20} color="#6366f1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }} numberOfLines={1}>{school.name}</Text>
                  {(school.city || school.state) && (
                    <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }} numberOfLines={1}>
                      {[school.city, school.state].filter(Boolean).join(', ')}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Application Form ─────────────────────────────────────────────────────────

interface DocFile { uri: string; name: string; mimeType: string }

function ApplyFormView({ school, onBack, onDone }: { school: School; onBack: () => void; onDone: () => void }) {
  const [trainingInterest, setTrainingInterest] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [previousSchool, setPreviousSchool] = useState('');
  const [personalStatement, setPersonalStatement] = useState('');
  const [doc1, setDoc1] = useState<DocFile | null>(null);
  const [doc1Label, setDoc1Label] = useState('');
  const [doc2, setDoc2] = useState<DocFile | null>(null);
  const [doc2Label, setDoc2Label] = useState('');

  const { mutate: create, isPending } = useCreateEnrollment(() => {
    toast.success('Enrollment application submitted! Track its status on this page.');
    onDone();
  });

  const pickDoc = async (slot: 1 | 2) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'application/msword',
             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const file = { uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/pdf' };
      if (slot === 1) setDoc1(file);
      else setDoc2(file);
    }
  };

  const handleSubmit = () => {
    if (!trainingInterest.trim()) { toast.error('Please enter the program or training you are applying for'); return; }
    if (!doc1) { toast.error('Please upload Document 1'); return; }
    if (!doc1Label.trim()) { toast.error('Please label Document 1 (e.g. BECE Result)'); return; }
    if (!doc2) { toast.error('Please upload Document 2'); return; }
    if (!doc2Label.trim()) { toast.error('Please label Document 2 (e.g. Birth Certificate)'); return; }

    create({
      schoolId: school.id,
      trainingInterest: trainingInterest.trim(),
      gradeLevel: gradeLevel.trim() || undefined,
      previousSchool: previousSchool.trim() || undefined,
      personalStatement: personalStatement.trim() || undefined,
      document1Name: doc1Label.trim(),
      document2Name: doc2Label.trim(),
      document1Type: doc1.mimeType,
      document2Type: doc2.mimeType,
      document1Uri: doc1.uri,
      document1FileName: doc1.name,
      document1MimeType: doc1.mimeType,
      document2Uri: doc2.uri,
      document2FileName: doc2.name,
      document2MimeType: doc2.mimeType,
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f8fafc' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={{ backgroundColor: HEADER_COLOR, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>Enrollment Application</Text>
            <Text style={{ color: '#5eead4', fontSize: 12, marginTop: 1 }} numberOfLines={1}>{school.name}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        {/* School info strip */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e0e7ff' }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="school-outline" size={20} color="#6366f1" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>{school.name}</Text>
            {(school.city || school.state) && (
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{[school.city, school.state].filter(Boolean).join(', ')}</Text>
            )}
          </View>
        </View>

        {/* Program / Training Interest */}
        <FormField label="Program / Training Interest" required>
          <TextInput
            value={trainingInterest}
            onChangeText={setTrainingInterest}
            placeholder="e.g. Senior Secondary Science, Vocational Training…"
            placeholderTextColor="#9ca3af"
            style={inputStyle}
          />
        </FormField>

        {/* Grade Level */}
        <FormField label="Grade Level" hint="Optional">
          <TextInput
            value={gradeLevel}
            onChangeText={setGradeLevel}
            placeholder="e.g. SS2, Grade 10, Year 3…"
            placeholderTextColor="#9ca3af"
            style={inputStyle}
          />
        </FormField>

        {/* Previous School */}
        <FormField label="Previous School" hint="Optional">
          <TextInput
            value={previousSchool}
            onChangeText={setPreviousSchool}
            placeholder="Name of your last school"
            placeholderTextColor="#9ca3af"
            style={inputStyle}
          />
        </FormField>

        {/* Personal Statement */}
        <FormField label="Personal Statement" hint="Optional">
          <TextInput
            value={personalStatement}
            onChangeText={setPersonalStatement}
            placeholder="Tell the school about yourself, your goals, and why you want to join…"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={[inputStyle, { minHeight: 110 }]}
          />
        </FormField>

        {/* Documents section header */}
        <View style={{ backgroundColor: '#f5f3ff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e0e7ff', flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <Ionicons name="information-circle-outline" size={16} color="#7c3aed" style={{ marginTop: 1 }} />
          <Text style={{ fontSize: 12, color: '#6d28d9', lineHeight: 18, flex: 1 }}>
            Upload 2 supporting documents such as your results slip, birth certificate, or letter of recommendation (PDF, Word, or Image).
          </Text>
        </View>

        {/* Document 1 */}
        <FormField label="Document 1" required>
          <TextInput
            value={doc1Label}
            onChangeText={setDoc1Label}
            placeholder='Label (e.g. "BECE Result", "Birth Certificate")'
            placeholderTextColor="#9ca3af"
            style={[inputStyle, { marginBottom: 8 }]}
          />
          <DocUploadButton file={doc1} onPick={() => pickDoc(1)} onRemove={() => setDoc1(null)} />
        </FormField>

        {/* Document 2 */}
        <FormField label="Document 2" required>
          <TextInput
            value={doc2Label}
            onChangeText={setDoc2Label}
            placeholder='Label (e.g. "Passport Photo", "Reference Letter")'
            placeholderTextColor="#9ca3af"
            style={[inputStyle, { marginBottom: 8 }]}
          />
          <DocUploadButton file={doc2} onPick={() => pickDoc(2)} onRemove={() => setDoc2(null)} />
        </FormField>

        {/* Submit */}
        <Pressable onPress={handleSubmit} disabled={isPending} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <View style={{
            backgroundColor: isPending ? '#5eead4' : '#0d9488',
            borderRadius: 14, paddingVertical: 16, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4,
          }}>
            {isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send-outline" size={18} color="#fff" />}
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>
              {isPending ? 'Submitting…' : 'Submit Application'}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const inputStyle = {
  backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
  borderRadius: 14, padding: 14, fontSize: 14, color: '#111827',
};

function FormField({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>{label}</Text>
        {required && <Text style={{ color: '#dc2626', fontSize: 13 }}>*</Text>}
        {hint && <Text style={{ fontSize: 12, color: '#9ca3af' }}>({hint})</Text>}
      </View>
      {children}
    </View>
  );
}

function DocUploadButton({ file, onPick, onRemove }: { file: DocFile | null; onPick: () => void; onRemove: () => void }) {
  return (
    <Pressable onPress={onPick} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View style={{
        backgroundColor: file ? '#f0fdf4' : '#fff',
        borderWidth: 2, borderColor: file ? '#16a34a' : '#e5e7eb',
        borderStyle: file ? 'solid' : 'dashed',
        borderRadius: 14, padding: 14, alignItems: 'center', gap: 8,
      }}>
        <Ionicons name={file ? 'document-text' : 'cloud-upload-outline'} size={26} color={file ? '#16a34a' : '#9ca3af'} />
        <Text style={{ fontSize: 13, fontWeight: '700', color: file ? '#15803d' : '#6b7280', textAlign: 'center' }}>
          {file ? file.name : 'Tap to upload (PDF, Word, or Image)'}
        </Text>
        {file && (
          <Pressable onPress={(e) => { e.stopPropagation?.(); onRemove(); }}>
            <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: '600' }}>Remove</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Screen =
  | { kind: 'list' }
  | { kind: 'detail'; enrollment: Enrollment }
  | { kind: 'pick_school' }
  | { kind: 'apply_form'; school: School };

export default function MyEnrollmentsScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>({ kind: 'list' });
  const { data: enrollments = [], isLoading } = useMyEnrollments();

  // ── nested screens ──────────────────────────────────────────────────────────

  if (screen.kind === 'detail') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <DetailView enrollment={screen.enrollment} onBack={() => setScreen({ kind: 'list' })} />
      </SafeAreaView>
    );
  }

  if (screen.kind === 'pick_school') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <SchoolPickerView
          onSelect={(school) => setScreen({ kind: 'apply_form', school })}
          onBack={() => setScreen({ kind: 'list' })}
        />
      </SafeAreaView>
    );
  }

  if (screen.kind === 'apply_form') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ApplyFormView
          school={screen.school}
          onBack={() => setScreen({ kind: 'pick_school' })}
          onDone={() => setScreen({ kind: 'list' })}
        />
      </SafeAreaView>
    );
  }

  // ── list screen ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: HEADER_COLOR, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>My Enrollments</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
              {isLoading ? 'Loading…' : `${enrollments.length} application${enrollments.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
          <Ionicons name="document-text-outline" size={22} color="#5eead4" />
        </View>

        {/* New application button */}
        <Pressable onPress={() => setScreen({ kind: 'pick_school' })} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0d9488', borderRadius: 12, paddingVertical: 11 }}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Apply to a School</Text>
          </View>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#14b8a6" size="large" />
        </View>
      ) : enrollments.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="document-text-outline" size={36} color="#14b8a6" />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '900', color: '#111827', textAlign: 'center' }}>No Applications Yet</Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            Apply to enroll in a school and track the progress of your applications here.
          </Text>
          <Pressable onPress={() => setScreen({ kind: 'pick_school' })} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <View style={{ backgroundColor: '#0d9488', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Apply to a School</Text>
            </View>
          </Pressable>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          {enrollments.map(item => (
            <EnrollmentCard
              key={item.id}
              item={item}
              onPress={() => setScreen({ kind: 'detail', enrollment: item })}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
