import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBrowseJobs } from '@/hooks/useJob';
import { Job } from '@/interface/job.interface';

function JobCard({ job }: { job: Job }) {
  return (
    <View style={{
      backgroundColor: '#fff', borderRadius: 18, padding: 16,
      borderWidth: 1, borderColor: '#e5e7eb',
      shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ionicons name="briefcase-outline" size={20} color="#6366f1" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }} numberOfLines={2}>{job.title}</Text>
          <Text style={{ fontSize: 13, color: '#6366f1', fontWeight: '600', marginTop: 2 }} numberOfLines={1}>
            {job.school?.name ?? 'School'}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {job.employmentType && (
          <View style={{ backgroundColor: '#f0f9ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#0284c7' }}>
              {job.employmentType.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        )}
        {job.location && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Ionicons name="location-outline" size={11} color="#6b7280" />
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#6b7280' }}>{job.location}</Text>
          </View>
        )}
        {job.salary && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Ionicons name="cash-outline" size={11} color="#16a34a" />
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#16a34a' }}>{job.salary}</Text>
          </View>
        )}
        {job.deadline && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff7ed', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Ionicons name="calendar-outline" size={11} color="#d97706" />
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#d97706' }}>
              Deadline: {new Date(job.deadline).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function MyJobsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const params = search.trim() ? { search: search.trim() } : undefined;
  const { data: jobs = [], isLoading } = useBrowseJobs(params);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: '#1e1b4b', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>Job Openings</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
              {isLoading ? 'Loading…' : `${jobs.length} position${jobs.length !== 1 ? 's' : ''} available`}
            </Text>
          </View>
          <Ionicons name="briefcase-outline" size={22} color="#a5b4fc" />
        </View>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 }}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.4)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search jobs or schools…"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={{ flex: 1, fontSize: 14, color: '#fff' }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#6366f1" size="large" />
        </View>
      ) : jobs.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <Ionicons name="briefcase-outline" size={48} color="#d1d5db" />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>
            {search ? 'No matching jobs' : 'No openings right now'}
          </Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            {search ? 'Try a different search term.' : 'Check back later for new opportunities.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        >
          {jobs.map(job => <JobCard key={job.id} job={job} />)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
