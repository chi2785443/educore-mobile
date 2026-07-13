import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, Linking } from 'react-native';
import * as Application from 'expo-application';
import { Ionicons } from '@expo/vector-icons';
import { useAppUpdateCheck } from '@/hooks/useAppUpdateCheck';
import { useUpdateStore } from '@/store/updateStore';

export function UpdateWallModal() {
  const { data: release } = useAppUpdateCheck();
  const { skippedVersionCode, setSkippedVersionCode } = useUpdateStore();
  const [buildVersionCode, setBuildVersionCode] = useState<number | null>(null);

  useEffect(() => {
    const raw = Application.nativeBuildVersion;
    if (raw) setBuildVersionCode(parseInt(raw, 10));
  }, []);

  if (!release || buildVersionCode === null) return null;
  if (release.versionCode <= buildVersionCode) return null;

  const isCritical = release.updateType === 'critical';
  const wasSkipped = !isCritical && skippedVersionCode === release.versionCode;
  if (wasSkipped) return null;

  const handleUpdateNow = () => {
    Linking.openURL(release.fileUrl);
  };

  const handleSkip = () => {
    setSkippedVersionCode(release.versionCode);
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isCritical) handleSkip();
      }}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24, width: 320, gap: 16, maxHeight: '80%' }}>
          <View style={{
            width: 52, height: 52, borderRadius: 26, alignSelf: 'center',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: isCritical ? '#FFF0F0' : '#F0EEFF',
          }}>
            <Ionicons
              name={isCritical ? 'alert-circle-outline' : 'sparkles-outline'}
              size={26}
              color={isCritical ? '#F5486A' : '#4C3FC4'}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#0f172a', textAlign: 'center' }}>
              {isCritical ? 'Update Required' : 'Update Available'}
            </Text>
            <Text style={{ fontSize: 14, color: '#475569', textAlign: 'center', lineHeight: 21 }}>
              {isCritical
                ? `Version ${release.version} is required to continue using the app.`
                : `Version ${release.version} is now available.`}
            </Text>
          </View>

          {release.releaseNotes && (
            <ScrollView style={{ maxHeight: 140 }} bounces={false}>
              <View style={{ backgroundColor: '#f8fafc', borderRadius: 14, padding: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                  What&apos;s new
                </Text>
                <Text style={{ fontSize: 13, color: '#334155', lineHeight: 19 }}>
                  {release.releaseNotes}
                </Text>
              </View>
            </ScrollView>
          )}

          <View style={{ gap: 10 }}>
            <Pressable onPress={handleUpdateNow} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
              <View style={{ backgroundColor: '#4C3FC4', borderRadius: 14, paddingVertical: 13, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Update Now</Text>
              </View>
            </Pressable>
            {!isCritical && (
              <Pressable onPress={handleSkip} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#94a3b8' }}>Skip this version</Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
