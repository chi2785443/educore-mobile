import { Stack } from 'expo-router';

export default function ChildrenResultsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[studentId]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
