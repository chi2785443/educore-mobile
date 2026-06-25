import { Stack, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { StackActions } from '@react-navigation/native';

export default function ClassroomStackLayout() {
  const navigation = useNavigation();

  useEffect(() => {
    const parent = navigation.getParent();
    return parent?.addListener('tabPress', (e) => {
      // Only reset when the features tab itself was pressed (not any other tab)
      const state = parent.getState();
      const featuresRoute = state?.routes.find((r: { name: string }) => r.name === 'features');
      if (featuresRoute?.key === e.target && navigation.canGoBack()) {
        navigation.dispatch(StackActions.popToTop());
      }
    });
  }, [navigation]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="list" />
      <Stack.Screen name="[classroomId]/index" />
      <Stack.Screen name="[classroomId]/assessment/[assessmentId]" />
      <Stack.Screen
        name="[classroomId]/assessment/take"
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
}
