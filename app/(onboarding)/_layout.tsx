import { Stack } from 'expo-router';
import { Palette } from '@/constants/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Palette.background },
        animation: 'fade', // Smooth cross-fades per design spec
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="intent" />
      <Stack.Screen name="translation" />
      <Stack.Screen name="mini-lesson" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
