import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/navigation/CustomTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* Tab order must match TABS array in CustomTabBar */}
      <Tabs.Screen name="index" />
      <Tabs.Screen name="features" />
      <Tabs.Screen name="action" options={{ href: null }} />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
