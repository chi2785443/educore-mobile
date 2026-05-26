import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const hasOnboarded = useAuthStore(s => s.hasOnboarded);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  if (!hasOnboarded) {
    return <Redirect href="/onboarding" />;
  }
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/" />;
  }
  return <Redirect href="/(auth)/sign-in" />;
}
