import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/tabs';
import { Pressable } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <Pressable
      accessibilityLabel="Sign out"
      onPress={signOut}
      style={{ paddingHorizontal: spacing.md }}
    >
      <Ionicons name="log-out-outline" size={24} color={colors.textMuted} />
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerRight: () => <SignOutButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, size }) => <Ionicons name="camera" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="flashcards"
        options={{
          title: 'Flashcards',
          tabBarIcon: ({ color, size }) => <Ionicons name="albums" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
