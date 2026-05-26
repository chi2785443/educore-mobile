import { Stack } from 'expo-router';

export default function AccountStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="finances" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="results" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="question-bank" />
      <Stack.Screen name="library" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="change-password" />
    </Stack>
  );
}
