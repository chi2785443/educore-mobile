import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { toast } from '@/components/ui/Toast';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/authStore';
import { useUpdateProfile } from '@/hooks/useUser';

function AvatarPicker({
  currentUrl, initials, localUri, onPick, onRemove,
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
    <View style={{ alignItems: 'center', gap: 14 }}>
      <View style={{ position: 'relative' }}>
        {displayUri ? (
          <Image
            source={{ uri: displayUri }}
            style={{ width: 88, height: 88, borderRadius: 28, backgroundColor: '#e5e7eb' }}
            contentFit="cover"
          />
        ) : (
          <View style={{
            width: 88, height: 88, borderRadius: 28,
            backgroundColor: '#4C3FC4',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 3, borderColor: 'rgba(255,255,255,0.18)',
          }}>
            <Text style={{ color: '#fff', fontSize: 30, fontWeight: '900' }}>{initials}</Text>
          </View>
        )}
        <Pressable
          onPress={onPick}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, position: 'absolute', bottom: -6, right: -6 })}
        >
          <View style={{
            width: 30, height: 30, borderRadius: 10,
            backgroundColor: '#4C3FC4',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 2.5, borderColor: '#fff',
          }}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable onPress={onPick} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: '#F0EEFF', borderRadius: 10,
            paddingHorizontal: 14, paddingVertical: 8,
          }}>
            <Ionicons name="image-outline" size={14} color="#4C3FC4" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#4C3FC4' }}>
              {hasPhoto ? 'Change Photo' : 'Upload Photo'}
            </Text>
          </View>
        </Pressable>
        {hasPhoto && (
          <Pressable onPress={onRemove} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: '#fee2e2', borderRadius: 10,
              paddingHorizontal: 14, paddingVertical: 8,
            }}>
              <Ionicons name="trash-outline" size={14} color="#dc2626" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#dc2626' }}>Remove</Text>
            </View>
          </Pressable>
        )}
      </View>

      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>JPG or PNG · max 5 MB</Text>
    </View>
  );
}

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
          backgroundColor: '#f8fafc',
          borderWidth: 1, borderColor: '#e5e7eb',
          borderRadius: 14, padding: 14,
          fontSize: 15, color: '#111827',
        }}
      />
    </View>
  );
}

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

        {/* ── Hero header ── */}
        <View style={{
          backgroundColor: '#4C3FC4',
          paddingHorizontal: 16,
          paddingTop: 18,
          paddingBottom: 36,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}>
          {/* Decorative orbs */}
          <View style={{
            position: 'absolute', top: -20, right: -20,
            width: 130, height: 130, borderRadius: 65,
            backgroundColor: 'rgba(255,255,255,0.06)',
          }} />
          <View style={{
            position: 'absolute', bottom: -30, left: 40,
            width: 100, height: 100, borderRadius: 50,
            backgroundColor: 'rgba(245,72,106,0.15)',
          }} />

          {/* Top row: back + title + save */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.12)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="arrow-back" size={18} color="#fff" />
              </View>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>
                Edit Profile
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
                Update your personal information
              </Text>
            </View>
            {isDirty && (
              <Pressable
                onPress={handleSave}
                disabled={isPending}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: '#F5486A',
                  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
                }}>
                  {isPending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="checkmark" size={15} color="#fff" />}
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Save</Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* Avatar in hero */}
          <AvatarPicker
            currentUrl={displayPhotoUri ?? undefined}
            initials={initials}
            localUri={newPhoto?.uri ?? null}
            onPick={pickPhoto}
            onRemove={handleRemovePhoto}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Personal info card ── */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            borderWidth: 1, borderColor: '#f1f5f9',
            overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: 0.04,
            shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
          }}>
            <View style={{
              paddingHorizontal: 16, paddingVertical: 10,
              backgroundColor: '#fafafa', borderBottomWidth: 1, borderColor: '#f1f5f9',
            }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                Personal Information
              </Text>
            </View>
            <View style={{ padding: 16, gap: 16 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Field label="First Name" value={firstName} onChangeText={setFirstName} placeholder="John" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Doe" />
                </View>
              </View>
              <PhoneInput
                label="Phone Number"
                value={phoneNumber}
                onChange={setPhoneNumber}
                optional
              />
            </View>
          </View>

          {/* ── Account info card (read-only) ── */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            borderWidth: 1, borderColor: '#f1f5f9',
            overflow: 'hidden',
            shadowColor: '#000', shadowOpacity: 0.04,
            shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
          }}>
            <View style={{
              paddingHorizontal: 16, paddingVertical: 10,
              backgroundColor: '#fafafa', borderBottomWidth: 1, borderColor: '#f1f5f9',
            }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                Account Info
              </Text>
            </View>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              paddingHorizontal: 16, paddingVertical: 14,
            }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: '#F0EEFF',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="mail-outline" size={16} color="#4C3FC4" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '700', marginBottom: 1 }}>Email</Text>
                <Text style={{ fontSize: 14, color: '#374151', fontWeight: '600' }}>{user?.email ?? '—'}</Text>
              </View>
              <View style={{ backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '700' }}>Read-only</Text>
              </View>
            </View>
          </View>

          {/* ── Save button ── */}
          <Pressable
            onPress={handleSave}
            disabled={isPending || !isDirty}
            style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
          >
            <View style={{
              backgroundColor: isDirty ? '#4C3FC4' : '#e5e7eb',
              borderRadius: 16, paddingVertical: 16,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              shadowColor: isDirty ? '#4C3FC4' : 'transparent',
              shadowOpacity: 0.35,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 10,
              elevation: isDirty ? 4 : 0,
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
