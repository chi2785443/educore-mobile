/**
 * Shared primitives for all mobile dashboard components.
 * Mirrors the frontend bold-gradient design system.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/* ── Greeting ───────────────────────────────────────────── */

/* ── Currency format ────────────────────────────────────── */
export function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
}

/* ── Full-screen loader — delegates to branded LoadingScreen ── */
export { default as DashLoader } from '@/components/ui/LoadingScreen';

/* ── Section label ──────────────────────────────────────── */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">
      {children}
    </Text>
  );
}

/* ── Bold gradient stat card ────────────────────────────── */
export function GradCard({
  label, value, sub, icon, colors,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  colors: [string, string]; // [from, to] bg colors as inline styles
}) {
  return (
    <View
      style={{ backgroundColor: colors[0], borderRadius: 16, padding: 14, flex: 1 }}
    >
      {/* Icon */}
      <View style={{
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 10,
      }}>
        <Ionicons name={icon} size={16} color="#fff" />
      </View>
      <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 26 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
        {label}
      </Text>
      {sub ? (
        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>{sub}</Text>
      ) : null}
    </View>
  );
}

/* ── White card container ───────────────────────────────── */
export function Card({
  children, className,
}: { children: React.ReactNode; className?: string }) {
  return (
    <View className={`bg-white rounded-2xl border border-gray-100 p-4 ${className ?? ''}`}>
      {children}
    </View>
  );
}

/* ── Card header ────────────────────────────────────────── */
export function CardHeader({
  icon, iconColor = '#6366f1', title, actionLabel, onAction,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <View className="flex-row items-center gap-2">
        <Ionicons name={icon} size={15} color={iconColor} />
        <Text className="text-sm font-bold text-gray-800">{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <Text className="text-xs font-semibold text-indigo-600">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ── Announcement row ───────────────────────────────────── */
export function AnnouncementRow({
  title, timeAgo, isLast,
}: { title: string; timeAgo: string; isLast: boolean }) {
  return (
    <View className={`flex-row items-start gap-3 py-2.5 ${isLast ? '' : 'border-b border-gray-50'}`}>
      <View className="w-7 h-7 rounded-lg bg-indigo-50 items-center justify-center shrink-0 mt-0.5">
        <Ionicons name="notifications-outline" size={13} color="#6366f1" />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-semibold text-gray-800" numberOfLines={2}>{title}</Text>
        <Text className="text-[10px] text-gray-400 mt-0.5">{timeAgo}</Text>
      </View>
    </View>
  );
}

/* ── Event row ──────────────────────────────────────────── */
export function EventRow({
  title, date, type, color, isLast,
}: { title: string; date: string; type: string; color: string; isLast: boolean }) {
  const d = new Date(date);
  const month = d.toLocaleDateString('en', { month: 'short' });
  const day = d.getDate();
  const bg = color ? `${color}22` : '#e0e7ff';
  const fg = color || '#6366f1';
  return (
    <View className={`flex-row items-center gap-3 py-2.5 ${isLast ? '' : 'border-b border-gray-50'}`}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 9, fontWeight: '800', color: fg, textTransform: 'uppercase' }}>{month}</Text>
        <Text style={{ fontSize: 14, fontWeight: '900', color: fg, lineHeight: 16 }}>{day}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-xs font-semibold text-gray-800" numberOfLines={1}>{title}</Text>
        <Text className="text-[10px] text-gray-400 capitalize mt-0.5">{type.replace('_', ' ')}</Text>
      </View>
    </View>
  );
}

/* ── Pending action badge ───────────────────────────────── */
export function PendingBadge({
  label, count, bg, text,
}: { label: string; count: number; bg: string; text: string }) {
  if (!count) return null;
  return (
    <View className={`flex-row items-center justify-between px-3 py-2.5 rounded-xl ${bg} mb-2`}>
      <Text className={`text-xs font-semibold ${text}`}>{label}</Text>
      <Text className={`text-base font-black ${text}`}>{count}</Text>
    </View>
  );
}

/* ── Timetable period row ───────────────────────────────── */
export function PeriodRow({
  subject, classroom, start, end, isNow, isLast,
}: { subject: string; classroom: string; start: string; end: string; isNow: boolean; isLast: boolean }) {
  return (
    <View className={`flex-row items-center gap-3 py-2.5 ${isLast ? '' : 'border-b border-gray-50'}`}>
      <View style={{
        width: 3, height: 36, borderRadius: 2,
        backgroundColor: isNow ? '#6366f1' : '#e5e7eb',
      }} />
      <View className="flex-1">
        <Text className="text-xs font-bold text-gray-800">{subject}</Text>
        <Text className="text-[10px] text-gray-400 mt-0.5">{classroom}</Text>
      </View>
      <View className="items-end">
        <Text className={`text-[10px] font-bold ${isNow ? 'text-indigo-600' : 'text-gray-400'}`}>
          {start} – {end}
        </Text>
        {isNow ? <Text className="text-[9px] font-bold text-indigo-400 mt-0.5">NOW</Text> : null}
      </View>
    </View>
  );
}
