import React, { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, Modal, ScrollView, Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/interface/user.interface';

const { height: SCREEN_H } = Dimensions.get('window');

interface Action {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  desc: string;
  color: string;
  bg: string;
  href?: string;
}

const ADMIN_ACTIONS: Action[] = [
  { icon: 'person-add-outline', label: 'Add Staff Member', desc: 'Invite or create a new staff account', color: '#6366f1', bg: '#e0e7ff', href: '/dashboard/staff' },
  { icon: 'people-outline', label: 'Enrol Student', desc: 'Review and accept enrollment requests', color: '#14b8a6', bg: '#d1fae5', href: '/dashboard/enrollments' },
  { icon: 'megaphone-outline', label: 'Post Announcement', desc: 'Broadcast a school-wide message', color: '#f59e0b', bg: '#fef3c7', href: '/dashboard/communications' },
  { icon: 'calendar-outline', label: 'Create Event', desc: 'Add a new calendar event', color: '#7c3aed', bg: '#ede9fe', href: '/dashboard/calendar' },
  { icon: 'cash-outline', label: 'Record Payment', desc: 'Log an income or expense transaction', color: '#059669', bg: '#ecfdf5', href: '/dashboard/finance/transactions' },
  { icon: 'clipboard-outline', label: 'Generate Results', desc: 'Compute and publish term results', color: '#e11d48', bg: '#fce7f3', href: '/dashboard/results/generate' },
];

const STAFF_ACTIONS: Action[] = [
  { icon: 'create-outline', label: 'New Assessment', desc: 'Create a test, quiz or exam', color: '#7c3aed', bg: '#ede9fe', href: '/dashboard/assessments' },
  { icon: 'document-text-outline', label: 'Write Report', desc: 'Submit a student progress report', color: '#6366f1', bg: '#e0e7ff', href: '/dashboard/reports/new' },
  { icon: 'checkmark-circle-outline', label: 'Mark Attendance', desc: 'Clock in for today', color: '#059669', bg: '#ecfdf5', href: '/dashboard/my-attendance' },
  { icon: 'people-outline', label: 'View My Students', desc: 'See students in your classrooms', color: '#14b8a6', bg: '#d1fae5', href: '/dashboard/students' },
];

const STUDENT_ACTIONS: Action[] = [
  { icon: 'clipboard-outline', label: 'My Assessments', desc: 'View pending and past assessments', color: '#6366f1', bg: '#e0e7ff', href: '/dashboard/my-assessments' },
  { icon: 'stats-chart-outline', label: 'My Scores', desc: 'Check your latest results', color: '#7c3aed', bg: '#ede9fe', href: '/dashboard/my-scores' },
  { icon: 'trophy-outline', label: 'My Results', desc: 'View term report cards', color: '#f59e0b', bg: '#fef3c7', href: '/dashboard/my-results' },
  { icon: 'checkmark-circle-outline', label: 'Mark Attendance', desc: 'Clock in for today', color: '#059669', bg: '#ecfdf5', href: '/dashboard/my-attendance' },
];

const PARENT_ACTIONS: Action[] = [
  { icon: 'chatbubble-outline', label: 'Send Enquiry', desc: 'Ask the school a question', color: '#e11d48', bg: '#fce7f3', href: '/dashboard/my-enquiries' },
  { icon: 'megaphone-outline', label: 'Announcements', desc: 'Read school announcements', color: '#6366f1', bg: '#e0e7ff', href: '/dashboard/communications' },
  { icon: 'library-outline', label: 'School Library', desc: 'Browse resources', color: '#14b8a6', bg: '#d1fae5', href: '/dashboard/library' },
  { icon: 'folder-outline', label: 'My Documents', desc: 'View uploaded documents', color: '#7c3aed', bg: '#ede9fe', href: '/dashboard/documents' },
];

function ActionSheet({
  visible, onClose, actions, roleLabel,
}: { visible: boolean; onClose: () => void; actions: Action[]; roleLabel: string }) {
  const slideY = useRef(new Animated.Value(SCREEN_H)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: SCREEN_H, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View
        style={{ ...{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }, opacity }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        transform: [{ translateY: slideY }],
        shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: -6 }, shadowRadius: 20, elevation: 30,
      }}>
        {/* Handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0' }} />
        </View>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Quick Actions</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{roleLabel}</Text>
          </View>
          <Pressable onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={18} color="#6b7280" />
          </Pressable>
        </View>

        {/* Actions grid */}
        <ScrollView style={{ maxHeight: SCREEN_H * 0.55 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 10 }} showsVerticalScrollIndicator={false}>
          {actions.map(action => (
            <Pressable
              key={action.label}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onClose();
                // Navigation would go here when screens exist
              }}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 14,
                backgroundColor: pressed ? '#f8fafc' : '#fff',
                borderRadius: 16, padding: 14,
                borderWidth: 1, borderColor: '#f1f5f9',
              })}
            >
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: action.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{action.label}</Text>
                <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{action.desc}</Text>
              </View>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: action.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="arrow-forward" size={14} color={action.color} />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

export default function ActionTab() {
  const [open, setOpen] = React.useState(true);
  const user = useAuthStore(s => s.user);
  const selectedSchoolId = useAuthStore(s => s.selectedSchoolId);
  const memberships = user?.schools ?? [];
  const primaryMembership = memberships.find(m => m.schoolId === selectedSchoolId) ?? memberships[0] ?? null;
  const role = primaryMembership?.role;

  const isAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.SCHOOL_ADMIN;
  const isStaff = role === UserRole.STAFF;
  const isStudent = role === UserRole.STUDENT;
  const isParent = role === UserRole.PARENT;

  const actions = isAdmin ? ADMIN_ACTIONS : isStaff ? STAFF_ACTIONS : isStudent ? STUDENT_ACTIONS : PARENT_ACTIONS;
  const roleLabel = isAdmin ? 'School Admin actions' : isStaff ? 'Staff actions' : isStudent ? 'Student actions' : 'Parent actions';

  // Auto-open when tab is focused, close navigates back
  useEffect(() => { setOpen(true); }, []);

  const handleClose = () => {
    setOpen(false);
    router.replace('/(tabs)/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ActionSheet visible={open} onClose={handleClose} actions={actions} roleLabel={roleLabel} />
    </View>
  );
}
