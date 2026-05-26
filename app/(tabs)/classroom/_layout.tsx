import { Stack } from 'expo-router';

export default function ClassroomStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[classroomId]/index" />
      <Stack.Screen name="[classroomId]/assessment/[assessmentId]" />
      <Stack.Screen
        name="[classroomId]/assessment/take"
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
}
