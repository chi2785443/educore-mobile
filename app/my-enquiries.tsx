import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { toast } from '@/components/ui/Toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMyEnquiries, useCreateEnquiry } from '@/hooks/useEnquiry';
import { useBrowseSchools } from '@/hooks/useSchool';
import { Enquiry, EnquiryStatus, EnquiryCategory } from '@/interface/enquiry.interface';
import { School } from '@/interface/school.interface';

// ─── Constants ────────────────────────────────────────────────────────────────

const HEADER_COLOR = '#1a0f00';
const ACCENT = '#f59e0b';

const CATEGORY_OPTIONS: { value: EnquiryCategory; label: string }[] = [
  { value: 'admission',        label: 'Admission' },
  { value: 'school_fees',      label: 'School Fees' },
  { value: 'curriculum',       label: 'Curriculum' },
  { value: 'facilities',       label: 'Facilities' },
  { value: 'transport',        label: 'Transport' },
  { value: 'uniform',          label: 'Uniform' },
  { value: 'extra_curricular', label: 'Extra-Curricular' },
  { value: 'academic_calendar',label: 'Academic Calendar' },
  { value: 'general',          label: 'General' },
];

function statusConfig(status: EnquiryStatus) {
  switch (status) {
    case 'replied':     return { label: 'Replied',     bg: '#dcfce7', color: '#16a34a', icon: 'checkmark-done-outline' as const };
    case 'in_progress': return { label: 'In Progress', bg: '#dbeafe', color: '#2563eb', icon: 'refresh-outline'        as const };
    case 'closed':      return { label: 'Closed',      bg: '#f1f5f9', color: '#64748b', icon: 'lock-closed-outline'    as const };
    default:            return { label: 'Pending',     bg: '#fef3c7', color: '#d97706', icon: 'time-outline'           as const };
  }
}

function categoryLabel(cat: EnquiryCategory | null | undefined): string {
  if (!cat) return '';
  return CATEGORY_OPTIONS.find(c => c.value === cat)?.label ?? cat.replace(/_/g, ' ');
}

// ─── Enquiry Card (list) ──────────────────────────────────────────────────────

function EnquiryCard({ item, onPress }: { item: Enquiry; onPress: () => void }) {
  const cfg = statusConfig(item.status);
  const schoolName = item.school?.name ?? item.targetSchoolName ?? null;

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
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }} numberOfLines={2}>{item.subject}</Text>
              {schoolName && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                  <Ionicons name="school-outline" size={11} color="#9ca3af" />
                  <Text style={{ fontSize: 12, color: '#6b7280' }} numberOfLines={1}>{schoolName}</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: cfg.bg, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, flexShrink: 0 }}>
              <Ionicons name={cfg.icon} size={12} color={cfg.color} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
            </View>
          </View>

          <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 8, lineHeight: 19 }} numberOfLines={2}>{item.message}</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {item.category && (
              <View style={{ backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#92400e' }}>{categoryLabel(item.category)}</Text>
              </View>
            )}
            <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#9ca3af' }}>
                {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            {item.reply && (
              <View style={{ backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#16a34a' }}>Has reply</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 11, color: '#f59e0b', fontWeight: '700' }}>View details</Text>
              <Ionicons name="chevron-forward" size={13} color="#f59e0b" />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Detail View ──────────────────────────────────────────────────────────────

function DetailView({ enquiry, onBack }: { enquiry: Enquiry; onBack: () => void }) {
  const cfg = statusConfig(enquiry.status);
  const schoolName = enquiry.school?.name ?? enquiry.targetSchoolName ?? null;
  const [replyExpanded, setReplyExpanded] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={{ backgroundColor: HEADER_COLOR, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }} numberOfLines={2}>{enquiry.subject}</Text>
            {schoolName && (
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }} numberOfLines={1}>{schoolName}</Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: cfg.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, flexShrink: 0 }}>
            <Ionicons name={cfg.icon} size={13} color={cfg.color} />
            <Text style={{ fontSize: 12, fontWeight: '800', color: cfg.color }}>{cfg.label}</Text>
          </View>
        </View>

        {/* Meta row */}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
              Sent {new Date(enquiry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          {enquiry.category && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ fontSize: 12, color: '#fcd34d', fontWeight: '700' }}>{categoryLabel(enquiry.category)}</Text>
            </View>
          )}
          {enquiry.repliedAt && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                Replied {new Date(enquiry.repliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>

        {/* Your message */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
            Your Message
          </Text>
          <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>{enquiry.message}</Text>
        </View>

        {/* Specific questions */}
        {enquiry.specificQuestions && enquiry.specificQuestions.length > 0 && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
              Specific Questions
            </Text>
            <View style={{ gap: 10 }}>
              {enquiry.specificQuestions.map((q, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View style={{ width: 22, height: 22, borderRadius: 8, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#d97706' }}>{i + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 }}>{q}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Child info */}
        {(enquiry.childName || enquiry.childAge || enquiry.childCurrentGrade) && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
              Child Information
            </Text>
            <View style={{ gap: 10 }}>
              {enquiry.childName && <DetailRow icon="person-outline" label="Name" value={enquiry.childName} />}
              {enquiry.childAge && <DetailRow icon="calendar-outline" label="Age" value={`${enquiry.childAge} years old`} />}
              {enquiry.childCurrentGrade && <DetailRow icon="layers-outline" label="Current Grade" value={enquiry.childCurrentGrade} />}
            </View>
          </View>
        )}

        {/* School reply */}
        {enquiry.reply ? (
          <View style={{ backgroundColor: '#f0fdf4', borderRadius: 16, borderWidth: 1, borderColor: '#bbf7d0' }}>
            <Pressable
              onPress={() => setReplyExpanded(p => !p)}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: '#16a34a' }} />
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#15803d' }}>
                    {schoolName ?? 'School'} replied
                  </Text>
                  {enquiry.repliedAt && (
                    <Text style={{ fontSize: 12, color: '#4ade80' }}>
                      · {new Date(enquiry.repliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Text>
                  )}
                </View>
                <Ionicons name={replyExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#16a34a" />
              </View>
            </Pressable>

            {replyExpanded && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
                <Text style={{ fontSize: 14, color: '#166534', lineHeight: 22 }}>{enquiry.reply}</Text>

                {/* School info grid */}
                {enquiry.schoolInfo && Object.keys(enquiry.schoolInfo).length > 0 && (
                  <View style={{ borderTopWidth: 1, borderTopColor: '#bbf7d0', paddingTop: 12, gap: 10 }}>
                    {Object.entries(enquiry.schoolInfo).map(([key, val]) => (
                      <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#4ade80', textTransform: 'uppercase', letterSpacing: 0.4, flex: 1 }}>
                          {key.replace(/_/g, ' ')}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#15803d', flex: 1, textAlign: 'right' }}>{val}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {enquiry.repliedBy && (
                  <Text style={{ fontSize: 12, color: '#4ade80' }}>
                    — {enquiry.repliedBy.firstName} {enquiry.repliedBy.lastName}
                  </Text>
                )}
              </View>
            )}
          </View>
        ) : (
          /* Awaiting reply panel */
          (enquiry.status === 'pending' || enquiry.status === 'in_progress') && (
            <View style={{ backgroundColor: '#fefce8', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#fde68a' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="time-outline" size={18} color="#d97706" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#92400e' }}>Awaiting Reply</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#b45309', lineHeight: 20 }}>
                Your enquiry has been sent to the school. You will be notified when they respond.
              </Text>
            </View>
          )
        )}

        {/* Closed notice */}
        {enquiry.status === 'closed' && (
          <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="lock-closed-outline" size={16} color="#94a3b8" />
              <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600' }}>This enquiry has been closed.</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <Ionicons name={icon} size={15} color="#d97706" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '700', marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600' }}>{value}</Text>
      </View>
    </View>
  );
}

// ─── School Picker ────────────────────────────────────────────────────────────

function SchoolPickerView({
  onSelect,
  onSkip,
  onBack,
}: {
  onSelect: (s: School) => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState('');
  const { data: schools = [], isLoading } = useBrowseSchools(search ? { search } : undefined);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ backgroundColor: HEADER_COLOR, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>Choose a School</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>Optional — you can also skip</Text>
          </View>
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

      {/* Skip option */}
      <Pressable onPress={onSkip} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <View style={{ margin: 16, marginBottom: 0, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'dashed' }}>
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#d97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#374151' }}>Send without a school</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Type the school name in your message</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
        </View>
      </Pressable>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={ACCENT} size="large" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}>
          {schools.length === 0 && search.length > 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32, gap: 10 }}>
              <Ionicons name="school-outline" size={40} color="#d1d5db" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>No schools found</Text>
              <Text style={{ fontSize: 13, color: '#9ca3af' }}>Try a different search term.</Text>
            </View>
          ) : (
            schools.map(school => (
              <Pressable key={school.id} onPress={() => onSelect(school)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ionicons name="school-outline" size={20} color="#d97706" />
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
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Category Picker Modal ────────────────────────────────────────────────────

function CategoryPickerModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: EnquiryCategory | null;
  onSelect: (c: EnquiryCategory | null) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={e => e.stopPropagation?.()}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingBottom: 36 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827', paddingHorizontal: 20, marginBottom: 14 }}>Select Category</Text>

            <Pressable onPress={() => { onSelect(null); onClose(); }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: !selected ? '#fef3c7' : 'transparent' }}>
                <Ionicons name="help-circle-outline" size={20} color={!selected ? '#d97706' : '#9ca3af'} />
                <Text style={{ fontSize: 14, fontWeight: !selected ? '800' : '600', color: !selected ? '#92400e' : '#374151' }}>No category (General)</Text>
                {!selected && <Ionicons name="checkmark" size={18} color="#d97706" style={{ marginLeft: 'auto' }} />}
              </View>
            </Pressable>

            {CATEGORY_OPTIONS.map(opt => (
              <Pressable key={opt.value} onPress={() => { onSelect(opt.value); onClose(); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: selected === opt.value ? '#fef3c7' : 'transparent' }}>
                  <Ionicons name="pricetag-outline" size={18} color={selected === opt.value ? '#d97706' : '#9ca3af'} />
                  <Text style={{ fontSize: 14, fontWeight: selected === opt.value ? '800' : '600', color: selected === opt.value ? '#92400e' : '#374151' }}>{opt.label}</Text>
                  {selected === opt.value && <Ionicons name="checkmark" size={18} color="#d97706" style={{ marginLeft: 'auto' }} />}
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── New Enquiry Form ─────────────────────────────────────────────────────────

function NewEnquiryFormView({
  school,
  onBack,
  onDone,
}: {
  school: School | null;
  onBack: () => void;
  onDone: () => void;
}) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<EnquiryCategory | null>(null);
  const [message, setMessage] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childGrade, setChildGrade] = useState('');
  const [showChildSection, setShowChildSection] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const { mutate: create, isPending } = useCreateEnquiry(() => {
    toast.success('Enquiry sent! You will be notified when the school responds.');
    onDone();
  });

  const addQuestion = () => {
    const q = newQuestion.trim();
    if (!q) return;
    setQuestions(prev => [...prev, q]);
    setNewQuestion('');
  };

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!subject.trim()) { toast.error('Please enter a subject for your enquiry'); return; }
    if (subject.trim().length < 5) { toast.error('Subject must be at least 5 characters'); return; }
    if (!message.trim()) { toast.error('Please write your message'); return; }
    if (message.trim().length < 10) { toast.error('Message must be at least 10 characters'); return; }

    const ageNum = childAge.trim() ? parseInt(childAge.trim(), 10) : undefined;

    create({
      schoolId: school?.id,
      targetSchoolName: !school ? undefined : undefined,
      subject: subject.trim(),
      category: category ?? undefined,
      message: message.trim(),
      childName: childName.trim() || undefined,
      childAge: ageNum && !isNaN(ageNum) ? ageNum : undefined,
      childCurrentGrade: childGrade.trim() || undefined,
      specificQuestions: questions.length > 0 ? questions : undefined,
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f8fafc' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CategoryPickerModal
        visible={showCategoryModal}
        selected={category}
        onSelect={setCategory}
        onClose={() => setShowCategoryModal(false)}
      />

      {/* Header */}
      <View style={{ backgroundColor: HEADER_COLOR, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>New Enquiry</Text>
            {school ? (
              <Text style={{ color: '#fcd34d', fontSize: 12, marginTop: 1 }} numberOfLines={1}>To: {school.name}</Text>
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>General enquiry</Text>
            )}
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        {/* School strip */}
        {school && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#fde68a' }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="school-outline" size={20} color="#d97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>{school.name}</Text>
              {(school.city || school.state) && (
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{[school.city, school.state].filter(Boolean).join(', ')}</Text>
              )}
            </View>
          </View>
        )}

        {/* Subject */}
        <FormField label="Subject" required>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g. Enquiry about admission requirements for 2025…"
            placeholderTextColor="#9ca3af"
            style={inputStyle}
          />
        </FormField>

        {/* Category */}
        <FormField label="Category" hint="Optional">
          <Pressable onPress={() => setShowCategoryModal(true)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={[inputStyle, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <Text style={{ fontSize: 14, color: category ? '#111827' : '#9ca3af', flex: 1 }}>
                {category ? categoryLabel(category) : 'Select a category…'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#9ca3af" />
            </View>
          </Pressable>
        </FormField>

        {/* Message */}
        <FormField label="Message" required>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your enquiry in detail…"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={[inputStyle, { minHeight: 130 }]}
          />
        </FormField>

        {/* Specific questions */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Specific Questions</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>(Optional)</Text>
          </View>

          {questions.length > 0 && (
            <View style={{ gap: 8, marginBottom: 8 }}>
              {questions.map((q, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fef3c7', borderRadius: 12, padding: 12 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: '#fde68a', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#92400e' }}>{i + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 }}>{q}</Text>
                  <Pressable onPress={() => removeQuestion(i)} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                    <Ionicons name="close-circle" size={18} color="#f87171" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              value={newQuestion}
              onChangeText={setNewQuestion}
              placeholder="Type a question and tap Add…"
              placeholderTextColor="#9ca3af"
              style={[inputStyle, { flex: 1 }]}
              onSubmitEditing={addQuestion}
              returnKeyType="done"
            />
            <Pressable onPress={addQuestion} disabled={!newQuestion.trim()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: newQuestion.trim() ? ACCENT : '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="add" size={22} color={newQuestion.trim() ? '#fff' : '#9ca3af'} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Child info toggle */}
        <Pressable onPress={() => setShowChildSection(p => !p)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="happy-outline" size={18} color="#d97706" />
            </View>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: '#374151' }}>
              {showChildSection ? 'Hide child information' : 'Add child information (optional)'}
            </Text>
            <Ionicons name={showChildSection ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
          </View>
        </Pressable>

        {showChildSection && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#fde68a', gap: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6 }}>Child Details</Text>
            <FormField label="Child's Name" hint="Optional">
              <TextInput
                value={childName}
                onChangeText={setChildName}
                placeholder="First and last name"
                placeholderTextColor="#9ca3af"
                style={inputStyle}
              />
            </FormField>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <FormField label="Age" hint="Optional">
                  <TextInput
                    value={childAge}
                    onChangeText={setChildAge}
                    placeholder="e.g. 12"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    style={inputStyle}
                  />
                </FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Current Grade" hint="Optional">
                  <TextInput
                    value={childGrade}
                    onChangeText={setChildGrade}
                    placeholder="e.g. Grade 5"
                    placeholderTextColor="#9ca3af"
                    style={inputStyle}
                  />
                </FormField>
              </View>
            </View>
          </View>
        )}

        {/* Submit */}
        <Pressable onPress={handleSubmit} disabled={isPending} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <View style={{
            backgroundColor: isPending ? '#fcd34d' : ACCENT,
            borderRadius: 14, paddingVertical: 16, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4,
          }}>
            {isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send-outline" size={18} color="#fff" />}
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>
              {isPending ? 'Sending…' : 'Send Enquiry'}
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Screen =
  | { kind: 'list' }
  | { kind: 'detail'; enquiry: Enquiry }
  | { kind: 'pick_school' }
  | { kind: 'new_enquiry'; school: School | null };

export default function MyEnquiriesScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>({ kind: 'list' });
  const { data: enquiries = [], isLoading } = useMyEnquiries();

  const pending = enquiries.filter(e => e.status === 'pending' || e.status === 'in_progress').length;
  const replied = enquiries.filter(e => e.status === 'replied').length;

  // ── nested screens ──────────────────────────────────────────────────────────

  if (screen.kind === 'detail') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <DetailView enquiry={screen.enquiry} onBack={() => setScreen({ kind: 'list' })} />
      </SafeAreaView>
    );
  }

  if (screen.kind === 'pick_school') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <SchoolPickerView
          onSelect={school => setScreen({ kind: 'new_enquiry', school })}
          onSkip={() => setScreen({ kind: 'new_enquiry', school: null })}
          onBack={() => setScreen({ kind: 'list' })}
        />
      </SafeAreaView>
    );
  }

  if (screen.kind === 'new_enquiry') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <NewEnquiryFormView
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
      <View style={{ backgroundColor: HEADER_COLOR, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: enquiries.length > 0 && !isLoading ? 14 : 0 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>My Enquiries</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
              {isLoading ? 'Loading…' : `${enquiries.length} enquir${enquiries.length !== 1 ? 'ies' : 'y'}`}
            </Text>
          </View>
          <Ionicons name="chatbubble-outline" size={22} color={ACCENT} />
        </View>

        {/* Stats strip */}
        {enquiries.length > 0 && !isLoading && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'Total',   value: enquiries.length, color: ACCENT },
              { label: 'Pending', value: pending,          color: '#fb923c' },
              { label: 'Replied', value: replied,          color: '#4ade80' },
            ].map(s => (
              <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10, alignItems: 'center' }}>
                <Text style={{ color: s.color, fontSize: 20, fontWeight: '900' }}>{s.value}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600', marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={ACCENT} size="large" />
        </View>
      ) : enquiries.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chatbubble-outline" size={36} color={ACCENT} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '900', color: '#111827', textAlign: 'center' }}>No Enquiries Yet</Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            Ask schools about fees, admission, curriculum, and more. Track all your enquiries and replies here.
          </Text>
          <Pressable onPress={() => setScreen({ kind: 'pick_school' })} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <View style={{ backgroundColor: ACCENT, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Send an Enquiry</Text>
            </View>
          </Pressable>
        </View>
      ) : (
        <>
          {/* New enquiry button */}
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
            <Pressable onPress={() => setScreen({ kind: 'pick_school' })} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 11 }}>
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>New Enquiry</Text>
              </View>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
            {enquiries.map(item => (
              <EnquiryCard
                key={item.id}
                item={item}
                onPress={() => setScreen({ kind: 'detail', enquiry: item })}
              />
            ))}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}
