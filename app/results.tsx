import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  RefreshControl, Modal, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useMyResults, useStudentReportCard } from '@/hooks/useResults';
import { TermResult, ReportCard, SubjectResult } from '@/interface/result.interface';

/* ── Helpers ─────────────────────────────────────────────────────── */
const TERM_LABELS: Record<string, string> = {
  FIRST_TERM: 'First Term',
  SECOND_TERM: 'Second Term',
  THIRD_TERM: 'Third Term',
  FIRST_SEMESTER: 'First Semester',
  SECOND_SEMESTER: 'Second Semester',
};

function positionSuffix(n: number | null): string {
  if (!n) return '—';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function fmtScore(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return Number(n).toFixed(1);
}

function gradeColorHex(grade: string | null): string {
  if (!grade) return '#374151';
  const g = grade.toUpperCase();
  if (g.startsWith('A')) return '#047857';
  if (g.startsWith('B')) return '#1d4ed8';
  if (g.startsWith('C')) return '#b45309';
  if (g.startsWith('D')) return '#c2410c';
  return '#dc2626';
}

function pctColor(pct: number): string {
  if (pct >= 75) return '#16a34a';
  if (pct >= 60) return '#0284c7';
  if (pct >= 45) return '#d97706';
  return '#dc2626';
}
function pctBg(pct: number): string {
  if (pct >= 75) return '#dcfce7';
  if (pct >= 60) return '#dbeafe';
  if (pct >= 45) return '#fef3c7';
  return '#fee2e2';
}

/* ── PDF HTML builder (mirrors frontend printReportCard) ─────────── */
function buildReportHTML(rc: ReportCard): string {
  const { termResult: tr, subjectResults, studentInfo, performance } = rc;
  const school = tr.school;
  const student = tr.student;
  const pct = Number(performance.overallPercentage);
  const passed = performance.subjectsFailed === 0;

  function sfx(n: number | null) {
    if (!n) return '—';
    const s = ['th', 'st', 'nd', 'rd']; const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  function fmt(n: number | null | undefined) {
    return (n === null || n === undefined) ? '—' : Number(n).toFixed(1);
  }
  function gc(g: string | null) { return gradeColorHex(g); }

  const subjectRows = subjectResults.map((sr, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'}">
      <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;font-size:13px">${sr.subject?.name ?? '—'}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-size:13px">${fmt(sr.testScore)}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-size:13px">${fmt(sr.examScore)}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-size:13px">${fmt(sr.assignmentScore)}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-size:13px">${fmt(sr.quizScore)}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-weight:700;font-size:13px;color:#4338ca">${fmt(sr.weightedScore)}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-weight:700;font-size:13px;color:${gc(sr.grade)}">${sr.grade ?? '—'}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-size:13px;color:${sr.isPassed ? '#047857' : '#dc2626'}">${sr.isPassed ? '✓' : '✗'}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-size:13px">${sfx(sr.position ?? null)}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:12px;color:#6b7280">${sr.remarks ?? '—'}</td>
    </tr>`).join('');

  const logoHtml = school?.logo
    ? `<img src="${school.logo}" alt="${school.name}" style="width:56px;height:56px;border-radius:10px;object-fit:cover;background:rgba(255,255,255,0.2)" />`
    : `<div style="width:56px;height:56px;border-radius:10px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:24px;color:white">🎓</div>`;

  const photoHtml = student?.profilePicture
    ? `<img src="${student.profilePicture}" alt="${student.firstName}" style="width:88px;height:88px;border-radius:14px;object-fit:cover;border:2px solid #e0e7ff" />`
    : `<div style="width:88px;height:88px;border-radius:14px;background:#eef2ff;border:2px solid #c7d2fe;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;color:#6366f1">${student?.firstName?.[0] ?? '?'}</div>`;

  const metrics = [
    { label: 'Position', value: sfx(performance.position), sub: `of ${performance.totalStudents ?? '—'}` },
    { label: 'Subjects Passed', value: String(performance.subjectsPassed), sub: `of ${performance.subjectsPassed + performance.subjectsFailed}` },
    { label: 'GPA', value: performance.gpa != null ? Number(performance.gpa).toFixed(2) : '—', sub: 'grade points' },
    { label: 'Avg Score', value: `${pct.toFixed(1)}%`, sub: 'overall' },
    { label: 'Attendance', value: tr.attendancePercentage != null ? `${Number(tr.attendancePercentage).toFixed(0)}%` : '—', sub: 'presence' },
  ];

  const strengthsHtml = (rc.strengths?.length > 0) ? `
    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:14px;flex:1">
      <div style="font-size:11px;font-weight:700;color:#047857;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">★ Strengths</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${rc.strengths.map(s => `<span style="background:#d1fae5;color:#065f46;font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px">${s}</span>`).join('')}
      </div>
    </div>` : '';

  const weaknessesHtml = (rc.weaknesses?.length > 0) ? `
    <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;padding:14px;flex:1">
      <div style="font-size:11px;font-weight:700;color:#be123c;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">↓ Areas to Improve</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${rc.weaknesses.map(w => `<span style="background:#ffe4e6;color:#9f1239;font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px">${w}</span>`).join('')}
      </div>
    </div>` : '';

  const remarksHtml = (tr.teacherRemarks || tr.principalRemarks) ? `
    <div style="display:flex;gap:16px;flex-wrap:wrap">
      ${tr.teacherRemarks ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px;flex:1">
        <div style="font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;margin-bottom:6px">Class Teacher's Remarks</div>
        <p style="font-size:13px;color:#1e3a8a;line-height:1.5">${tr.teacherRemarks}</p>
      </div>` : ''}
      ${tr.principalRemarks ? `<div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:14px;flex:1">
        <div style="font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;margin-bottom:6px">Principal's Remarks</div>
        <p style="font-size:13px;color:#4c1d95;line-height:1.5">${tr.principalRemarks}</p>
      </div>` : ''}
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Report Card — ${studentInfo.studentName}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f3f4f6;color:#111;}
    @page{size:A4;margin:16mm 14mm;}
    @media print{body{background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.no-break{page-break-inside:avoid;}}
  </style>
</head>
<body>
<div style="max-width:820px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#4f46e5,#4338ca);padding:24px 32px;color:white">
    <div style="display:flex;align-items:center;gap:16px">
      ${logoHtml}
      <div>
        <div style="font-size:20px;font-weight:900;line-height:1.2">${school?.name ?? 'School'}</div>
        ${school?.address ? `<div style="color:#a5b4fc;font-size:13px;margin-top:3px">${school.address}</div>` : ''}
        <div style="color:#c7d2fe;font-size:12px;margin-top:4px">${TERM_LABELS[tr.term] ?? tr.term} · ${tr.academicYear} Academic Year</div>
      </div>
      <div style="margin-left:auto;text-align:right">
        <div style="font-size:11px;color:#a5b4fc;text-transform:uppercase;letter-spacing:.08em;font-weight:700">Report Card</div>
        <div style="font-size:12px;color:#c7d2fe;margin-top:4px">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
    </div>
  </div>

  <div style="padding:28px 32px;display:flex;flex-direction:column;gap:24px">
    <!-- Student info -->
    <div class="no-break" style="display:flex;gap:20px;align-items:flex-start">
      ${photoHtml}
      <div style="flex:1">
        <div style="font-size:19px;font-weight:900;color:#111827">${studentInfo.studentName}</div>
        <table style="margin-top:10px;font-size:13px;border-collapse:collapse">
          <tr>
            <td style="color:#6b7280;padding:2px 16px 2px 0">Class:</td>
            <td style="font-weight:700;color:#1f2937">${studentInfo.className}</td>
            <td style="color:#6b7280;padding:2px 16px 2px 16px">Roll No:</td>
            <td style="font-weight:700;color:#1f2937">${studentInfo.rollNumber}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:2px 16px 2px 0">Term:</td>
            <td style="font-weight:700;color:#1f2937">${TERM_LABELS[tr.term] ?? tr.term}</td>
            <td style="color:#6b7280;padding:2px 16px 2px 16px">Year:</td>
            <td style="font-weight:700;color:#1f2937">${tr.academicYear}</td>
          </tr>
        </table>
      </div>
      <div style="text-align:center">
        <div style="width:90px;height:90px;border-radius:14px;background:${passed ? '#ecfdf5' : '#fff1f2'};border:2px solid ${passed ? '#6ee7b7' : '#fca5a5'};display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div style="font-size:26px;font-weight:900;color:${passed ? '#047857' : '#dc2626'}">${pct.toFixed(0)}%</div>
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${passed ? '#059669' : '#ef4444'}">${passed ? 'PASSED' : 'FAILED'}</div>
        </div>
        ${performance.grade ? `<div style="font-size:18px;font-weight:900;color:${gc(performance.grade)};margin-top:6px">${performance.grade}</div>` : ''}
      </div>
    </div>

    <!-- Metrics -->
    <div class="no-break" style="display:flex;gap:10px">
      ${metrics.map(m => `
        <div style="flex:1;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">${m.label}</div>
          <div style="font-size:17px;font-weight:900;color:#111827">${m.value}</div>
          <div style="font-size:10px;color:#9ca3af;margin-top:2px">${m.sub}</div>
        </div>`).join('')}
    </div>

    <!-- Subject table -->
    <div class="no-break">
      <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">Subject Results</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f3f4f6">
            ${['Subject', 'Test', 'Exam', 'Assign', 'Quiz', 'Total', 'Grade', 'Pass', 'Pos', 'Remarks'].map(h =>
    `<th style="padding:9px 11px;border:1px solid #e5e7eb;text-align:${['Subject', 'Remarks'].includes(h) ? 'left' : 'center'};font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">${h}</th>`
  ).join('')}
          </tr>
        </thead>
        <tbody>${subjectRows}</tbody>
      </table>
    </div>

    <!-- Strengths / Weaknesses -->
    ${(rc.strengths?.length > 0 || rc.weaknesses?.length > 0) ? `
    <div class="no-break" style="display:flex;gap:16px;flex-wrap:wrap">
      ${strengthsHtml}${weaknessesHtml}
    </div>` : ''}

    <!-- Remarks -->
    ${remarksHtml ? `<div class="no-break">${remarksHtml}</div>` : ''}

    <!-- Footer -->
    <div style="display:flex;justify-content:space-between;align-items:flex-end;padding-top:16px;border-top:1px solid #f3f4f6;font-size:12px;color:#9ca3af">
      <span>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      ${school?.principalName ? `<div style="text-align:right"><div style="font-weight:700;color:#374151">${school.principalName}</div><div>Principal</div></div>` : ''}
    </div>
  </div>
</div>
</body>
</html>`;
}

/* ── Report card modal ───────────────────────────────────────────── */
function ReportCardModal({ result, onClose }: { result: TermResult; onClose: () => void }) {
  const [printing, setPrinting] = useState(false);

  const { data: rc, isLoading } = useStudentReportCard(
    result.studentId,
    result.term,
    result.academicYear,
  );

  const handlePrint = useCallback(async () => {
    if (!rc) return;
    setPrinting(true);
    try {
      const html = buildReportHTML(rc);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Report Card' });
      } else {
        await Print.printAsync({ html });
      }
    } catch (e: unknown) {
      Alert.alert('Print failed', e instanceof Error ? e.message : 'Could not generate report');
    } finally {
      setPrinting(false);
    }
  }, [rc]);

  const termLabel = TERM_LABELS[result.term] ?? result.term.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const school = rc?.termResult.school ?? result.school;
  const student = rc?.termResult.student ?? result.student;
  const perf = rc?.performance;
  const pct = Math.round(result.overallPercentage);
  const passed = result.subjectsFailed === 0;
  const passColor = passed ? '#047857' : '#dc2626';
  const passBg = passed ? '#ecfdf5' : '#fff1f2';
  const passBorder = passed ? '#6ee7b7' : '#fca5a5';

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* School header */}
          <View style={{ backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
            {/* Top bar: close + print */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Pressable onPress={onClose} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={18} color="#fff" />
              </Pressable>
              <Pressable
                onPress={handlePrint}
                disabled={printing || isLoading}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
                {printing
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="print-outline" size={16} color="#fff" />}
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{printing ? 'Generating…' : 'Print'}</Text>
              </Pressable>
            </View>

            {/* School info row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              {school?.logo ? (
                <Image
                  source={{ uri: school.logo }}
                  style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)' }}
                  contentFit="cover"
                />
              ) : (
                <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="school-outline" size={26} color="#fff" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', lineHeight: 20 }} numberOfLines={2}>
                  {school?.name ?? 'School'}
                </Text>
                {school?.address && (
                  <Text style={{ color: '#a5b4fc', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                    {school.address}
                  </Text>
                )}
                <Text style={{ color: '#c7d2fe', fontSize: 11, marginTop: 3 }}>
                  {termLabel} · {result.academicYear} Academic Year
                </Text>
              </View>
            </View>
          </View>

          <View style={{ padding: 16, gap: 14 }}>
            {isLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator color="#4f46e5" size="large" />
                <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 12 }}>Loading report card…</Text>
              </View>
            ) : (
              <>
                {/* Student info + overall badge */}
                <View style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#e5e7eb', padding: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
                    {/* Photo */}
                    {student?.profilePicture ? (
                      <Image
                        source={{ uri: student.profilePicture }}
                        style={{ width: 80, height: 80, borderRadius: 14, borderWidth: 2, borderColor: '#e0e7ff' }}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={{ width: 80, height: 80, borderRadius: 14, backgroundColor: '#eef2ff', borderWidth: 2, borderColor: '#c7d2fe', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 28, fontWeight: '900', color: '#6366f1' }}>
                          {student?.firstName?.[0] ?? '?'}
                        </Text>
                      </View>
                    )}

                    {/* Details */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>
                        {rc?.studentInfo.studentName ?? `${student?.firstName ?? ''} ${student?.lastName ?? ''}`}
                      </Text>
                      <View style={{ gap: 4, marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                          <View style={{ flexDirection: 'row', gap: 5 }}>
                            <Text style={{ fontSize: 12, color: '#9ca3af' }}>Class:</Text>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#1f2937' }}>
                              {rc?.studentInfo.className ?? result.classroom?.name ?? '—'}
                            </Text>
                          </View>
                        </View>
                        {rc?.studentInfo.rollNumber && (
                          <View style={{ flexDirection: 'row', gap: 5 }}>
                            <Text style={{ fontSize: 12, color: '#9ca3af' }}>Roll No:</Text>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#1f2937' }}>
                              {rc.studentInfo.rollNumber}
                            </Text>
                          </View>
                        )}
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                          <View style={{ flexDirection: 'row', gap: 5 }}>
                            <Text style={{ fontSize: 12, color: '#9ca3af' }}>Term:</Text>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#1f2937' }}>{termLabel}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 5 }}>
                            <Text style={{ fontSize: 12, color: '#9ca3af' }}>Year:</Text>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#1f2937' }}>{result.academicYear}</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Overall badge */}
                    <View style={{ alignItems: 'center' }}>
                      <View style={{ width: 76, height: 76, borderRadius: 14, backgroundColor: passBg, borderWidth: 2, borderColor: passBorder, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: '900', color: passColor }}>{pct}%</Text>
                        <Text style={{ fontSize: 8, fontWeight: '800', color: passColor, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 }}>
                          {passed ? 'PASSED' : 'FAILED'}
                        </Text>
                      </View>
                      {result.overallGrade && (
                        <Text style={{ fontSize: 15, fontWeight: '900', color: gradeColorHex(result.overallGrade), marginTop: 4 }}>
                          {result.overallGrade}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Metrics row */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    { label: 'Position', value: positionSuffix(perf?.position ?? result.classPosition), sub: `of ${perf?.totalStudents ?? result.totalStudents ?? '—'}` },
                    { label: 'Subjects\nPassed', value: String(perf?.subjectsPassed ?? result.subjectsPassed), sub: `of ${(perf?.subjectsPassed ?? result.subjectsPassed) + (perf?.subjectsFailed ?? result.subjectsFailed)}` },
                    { label: 'GPA', value: perf?.gpa != null ? Number(perf.gpa).toFixed(2) : (result.gpa != null ? Number(result.gpa).toFixed(2) : '—'), sub: 'grade points' },
                    { label: 'Avg Score', value: `${pct.toFixed(0)}%`, sub: 'overall' },
                    { label: 'Attendance', value: rc?.termResult.attendancePercentage != null ? `${Number(rc.termResult.attendancePercentage).toFixed(0)}%` : '—', sub: 'presence' },
                  ].map(m => (
                    <View key={m.label} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 10, alignItems: 'center' }}>
                      <Text style={{ fontSize: 8, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>{m.label}</Text>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827', marginTop: 4, textAlign: 'center' }}>{m.value}</Text>
                      <Text style={{ fontSize: 9, color: '#9ca3af', marginTop: 2, textAlign: 'center' }}>{m.sub}</Text>
                    </View>
                  ))}
                </View>

                {/* Subject results */}
                {(rc?.subjectResults ?? result.subjectResults ?? []).length > 0 && (
                  <View style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' }}>
                    <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f9fafb', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.7 }}>Subject Results</Text>
                    </View>
                    {/* Header row */}
                    <View style={{ flexDirection: 'row', backgroundColor: '#f3f4f6', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                      {[{ label: 'Subject', flex: 2 }, { label: 'Test', flex: 1 }, { label: 'Exam', flex: 1 }, { label: 'Assign', flex: 1 }, { label: 'Quiz', flex: 1 }, { label: 'Total', flex: 1 }, { label: 'Grade', flex: 1 }].map(col => (
                        <Text key={col.label} style={{ flex: col.flex, paddingVertical: 8, paddingHorizontal: 4, fontSize: 9, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', textAlign: col.label === 'Subject' ? 'left' : 'center' }}>
                          {col.label}
                        </Text>
                      ))}
                    </View>
                    {(rc?.subjectResults ?? result.subjectResults ?? []).map((sub, i) => (
                      <SubjectTableRow key={sub.id} sub={sub} index={i} />
                    ))}
                  </View>
                )}

                {/* Strengths & Weaknesses */}
                {((rc?.strengths?.length ?? 0) > 0 || (rc?.weaknesses?.length ?? 0) > 0) && (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {(rc?.strengths?.length ?? 0) > 0 && (
                      <View style={{ flex: 1, backgroundColor: '#ecfdf5', borderRadius: 14, borderWidth: 1, borderColor: '#a7f3d0', padding: 14 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#047857', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>★ Strengths</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                          {rc!.strengths.map(s => (
                            <View key={s} style={{ backgroundColor: '#d1fae5', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                              <Text style={{ fontSize: 11, fontWeight: '600', color: '#065f46' }}>{s}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    {(rc?.weaknesses?.length ?? 0) > 0 && (
                      <View style={{ flex: 1, backgroundColor: '#fff1f2', borderRadius: 14, borderWidth: 1, borderColor: '#fecdd3', padding: 14 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#be123c', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>↓ Areas to Improve</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                          {rc!.weaknesses.map(w => (
                            <View key={w} style={{ backgroundColor: '#ffe4e6', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                              <Text style={{ fontSize: 11, fontWeight: '600', color: '#9f1239' }}>{w}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Remarks */}
                {(rc?.termResult.teacherRemarks || rc?.termResult.principalRemarks) && (
                  <View style={{ gap: 10 }}>
                    {rc?.termResult.teacherRemarks && (
                      <View style={{ backgroundColor: '#eff6ff', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: '#3b82f6' }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{"Class Teacher's Remarks"}</Text>
                        <Text style={{ fontSize: 13, color: '#1e3a8a', lineHeight: 20 }}>{rc.termResult.teacherRemarks}</Text>
                      </View>
                    )}
                    {rc?.termResult.principalRemarks && (
                      <View style={{ backgroundColor: '#faf5ff', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: '#7c3aed' }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{"Principal's Remarks"}</Text>
                        <Text style={{ fontSize: 13, color: '#4c1d95', lineHeight: 20 }}>{rc.termResult.principalRemarks}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Footer */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                    Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Text>
                  {school?.principalName && (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>{school.principalName}</Text>
                      <Text style={{ fontSize: 12, color: '#9ca3af' }}>Principal</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* ── Subject table row ───────────────────────────────────────────── */
function SubjectTableRow({ sub, index }: { sub: SubjectResult; index: number }) {
  const gc = gradeColorHex(sub.grade);
  return (
    <View style={{ flexDirection: 'row', backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
      <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 4 }}>
        {sub.subject?.color && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: sub.subject.color }} />}
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151' }} numberOfLines={1}>{sub.subject?.name ?? '—'}</Text>
      </View>
      <Text style={{ flex: 1, fontSize: 12, color: '#6b7280', textAlign: 'center', paddingVertical: 10 }}>{fmtScore(sub.testScore)}</Text>
      <Text style={{ flex: 1, fontSize: 12, color: '#6b7280', textAlign: 'center', paddingVertical: 10 }}>{fmtScore(sub.examScore)}</Text>
      <Text style={{ flex: 1, fontSize: 12, color: '#6b7280', textAlign: 'center', paddingVertical: 10 }}>{fmtScore(sub.assignmentScore)}</Text>
      <Text style={{ flex: 1, fontSize: 12, color: '#6b7280', textAlign: 'center', paddingVertical: 10 }}>{fmtScore(sub.quizScore)}</Text>
      <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: '#4338ca', textAlign: 'center', paddingVertical: 10 }}>{fmtScore(sub.weightedScore)}</Text>
      <Text style={{ flex: 1, fontSize: 12, fontWeight: '800', color: gc, textAlign: 'center', paddingVertical: 10 }}>{sub.grade ?? '—'}</Text>
    </View>
  );
}

/* ── Summary card (list) ─────────────────────────────────────────── */
function ResultSummaryCard({ result, onPress, isLatest }: {
  result: TermResult; onPress: () => void; isLatest: boolean;
}) {
  const pct = Math.round(result.overallPercentage);
  const color = pctColor(pct);
  const bg = pctBg(pct);
  const termLabel = TERM_LABELS[result.term] ?? result.term.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
      <View style={{
        backgroundColor: '#fff', borderRadius: 20,
        borderWidth: isLatest ? 2 : 1,
        borderColor: isLatest ? '#6366f1' : '#f1f5f9',
        overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: isLatest ? 0.08 : 0.04,
        shadowOffset: { width: 0, height: 3 }, shadowRadius: 8,
        elevation: isLatest ? 4 : 2,
      }}>
        {isLatest && (
          <View style={{ backgroundColor: '#6366f1', paddingHorizontal: 14, paddingVertical: 6 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>MOST RECENT</Text>
          </View>
        )}
        <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: '#0f172a' }}>{termLabel}</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{result.academicYear}</Text>
            {result.classroom && (
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                {result.classroom.name}{result.classroom.grade ? ` · ${result.classroom.grade}` : ''}
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '700' }}>{result.subjectsPassed} passed</Text>
              {result.subjectsFailed > 0 && (
                <Text style={{ fontSize: 11, color: '#dc2626', fontWeight: '700' }}>{result.subjectsFailed} failed</Text>
              )}
              {result.classPosition != null && (
                <Text style={{ fontSize: 11, color: '#6366f1', fontWeight: '700' }}>#{result.classPosition} in class</Text>
              )}
            </View>
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: color + '40' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color }}>{pct}%</Text>
            </View>
            {result.overallGrade && <Text style={{ fontSize: 13, fontWeight: '900', color }}>{result.overallGrade}</Text>}
          </View>
          <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
        </View>
      </View>
    </Pressable>
  );
}

/* ── Main screen ─────────────────────────────────────────────────── */
export default function ResultsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<TermResult | null>(null);
  const { data: results = [], isLoading, refetch } = useMyResults();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const sorted = [...results].sort((a, b) => {
    if (a.academicYear !== b.academicYear) return b.academicYear.localeCompare(a.academicYear);
    return a.term.localeCompare(b.term);
  });

  const avgPct = sorted.length
    ? Math.round(sorted.reduce((a, r) => a + r.overallPercentage, 0) / sorted.length)
    : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      <View style={{ backgroundColor: '#0c1a40', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>My Results</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
              {sorted.length} term result{sorted.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Ionicons name="trophy-outline" size={22} color="#f59e0b" />
        </View>
        {sorted.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            {[
              { label: 'Overall Avg', value: `${avgPct}%` },
              { label: 'Terms Taken', value: String(sorted.length) },
              { label: 'Latest Grade', value: sorted[0]?.overallGrade ?? '—' },
            ].map(s => (
              <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900' }}>{s.value}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#6366f1" size="large" />
        </View>
      ) : sorted.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 }}>
          <Ionicons name="trophy-outline" size={48} color="#d1d5db" />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#374151', textAlign: 'center' }}>No results yet</Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 }}>
            Your term results will appear here once published by your school.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" colors={['#6366f1']} />}
        >
          {sorted.map((result, i) => (
            <ResultSummaryCard
              key={result.id}
              result={result}
              isLatest={i === 0}
              onPress={() => setSelected(result)}
            />
          ))}
        </ScrollView>
      )}

      {selected && <ReportCardModal result={selected} onClose={() => setSelected(null)} />}
    </SafeAreaView>
  );
}
