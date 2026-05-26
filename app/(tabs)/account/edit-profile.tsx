import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { toast } from '@/components/ui/Toast';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/authStore';
import { useUpdateProfile } from '@/hooks/useUser';

const HEADER_BG = '#0B0F14';

// ─── Avatar with photo picker ─────────────────────────────────────────────────

function AvatarPicker({
  currentUrl,
  initials,
  localUri,
  onPick,
  onRemove,
}: {
  currentUrl?: string;
  initials: string;
  localUri: string | null;
  onPick: () => void;
  onRemove: () => void;
}) {
  const hasPhoto = !!localUri || !!currentUrl;
  const displayUri = localUri ?? currentUrl ?? null;

  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <View style={{ position: 'relative' }}>
        {displayUri ? (
          <Image
            source={{ uri: displayUri }}
            style={{ width: 90, height: 90, borderRadius: 30, backgroundColor: '#e5e7eb' }}
            contentFit="cover"
          />
        ) : (
          <View style={{
            width: 90, height: 90, borderRadius: 30,
            backgroundColor: '#6366f1',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#6366f1', shadowOpacity: 0.35,
            shadowOffset: { width: 0, height: 6 }, shadowRadius: 12,
            elevation: 8,
          }}>
            <Text style={{ color: '#fff', fontSize: 30, fontWeight: '900' }}>{initials}</Text>
          </View>
        )}

        {/* Camera button overlay */}
        <Pressable
          onPress={onPick}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, position: 'absolute', bottom: -4, right: -4 })}
        >
          <View style={{
            width: 32, height: 32, borderRadius: 12,
            backgroundColor: '#6366f1',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 2.5, borderColor: '#f8fafc',
          }}>
            <Ionicons name="camera" size={15} color="#fff" />
          </View>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Pressable onPress={onPick} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#e0e7ff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 }}>
            <Ionicons name="image-outline" size={14} color="#6366f1" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#6366f1' }}>
              {hasPhoto ? 'Change Photo' : 'Upload Photo'}
            </Text>
          </View>
        </Pressable>
        {hasPhoto && (
          <Pressable onPress={onRemove} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fee2e2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 }}>
              <Ionicons name="trash-outline" size={14} color="#dc2626" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#dc2626' }}>Remove</Text>
            </View>
          </Pressable>
        )}
      </View>

      <Text style={{ fontSize: 11, color: '#9ca3af' }}>JPG or PNG · max 5 MB</Text>
    </View>
  );
}

// ─── Text field ───────────────────────────────────────────────────────────────

function Field({
  label, value, onChangeText, placeholder, keyboardType, autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'words'}
        style={{
          backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
          borderRadius: 14, padding: 14, fontSize: 15, color: '#111827',
        }}
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

interface PhotoState {
  uri: string;
  fileName: string;
  mimeType: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [newPhoto, setNewPhoto] = useState<PhotoState | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const { mutate: update, isPending } = useUpdateProfile(() => {
    toast.success('Profile updated successfully');
    router.back();
  });

  const isDirty =
    firstName.trim() !== (user?.firstName ?? '') ||
    lastName.trim() !== (user?.lastName ?? '') ||
    phoneNumber.trim() !== (user?.phoneNumber ?? '') ||
    newPhoto !== null ||
    removePhoto;

  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?';

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.error('Please allow access to your photo library in Settings');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      setNewPhoto({ uri: asset.uri, fileName: `profile.${ext}`, mimeType: mime });
      setRemovePhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setNewPhoto(null);
    if (user?.profilePicture) setRemovePhoto(true);
  };

  const handleSave = () => {
    if (!firstName.trim()) { toast.error('First name cannot be empty'); return; }
    if (!lastName.trim()) { toast.error('Last name cannot be empty'); return; }
    update({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      ...(newPhoto ? {
        profilePictureUri: newPhoto.uri,
        profilePictureFileName: newPhoto.fileName,
        profilePictureMimeType: newPhoto.mimeType,
      } : {}),
    });
  };

  const displayPhotoUri = removePhoto ? null : (newPhoto?.uri ?? user?.profilePicture ?? null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={{ backgroundColor: HEADER_BG, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="arrow-back" size={18} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>Edit Profile</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>Update your personal information</Text>
            </View>
            {isDirty && (
              <Pressable onPress={handleSave} disabled={isPending} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <View style={{ backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {isPending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="checkmark" size={15} color="#fff" />}
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Save</Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}>

          {/* Avatar picker */}
          <AvatarPicker
            currentUrl={displayPhotoUri ?? undefined}
            initials={initials}
            localUri={newPhoto?.uri ?? null}
            onPick={pickPhoto}
            onRemove={handleRemovePhoto}
          />

          {/* Name + Phone */}
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#e5e7eb', gap: 18 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Personal Information
            </Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="First Name" value={firstName} onChangeText={setFirstName} placeholder="John" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Doe" />
              </View>
            </View>

            <Field
              label="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+234 800 000 0000"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>

          {/* Read-only email */}
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#e5e7eb', gap: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Account Info
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="mail-outline" size={16} color="#6366f1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '700', marginBottom: 1 }}>Email</Text>
                <Text style={{ fontSize: 14, color: '#374151', fontWeight: '600' }}>{user?.email ?? '—'}</Text>
              </View>
              <View style={{ backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '700' }}>Read-only</Text>
              </View>
            </View>
          </View>

          {/* Save button */}
          <Pressable onPress={handleSave} disabled={isPending || !isDirty} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <View style={{
              backgroundColor: isDirty ? '#6366f1' : '#e5e7eb',
              borderRadius: 14, paddingVertical: 16,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {isPending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="save-outline" size={18} color={isDirty ? '#fff' : '#9ca3af'} />}
              <Text style={{ fontSize: 16, fontWeight: '900', color: isDirty ? '#fff' : '#9ca3af' }}>
                {isPending ? 'Saving…' : 'Save Changes'}
              </Text>
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
