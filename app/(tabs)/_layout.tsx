import { Tabs } from 'expo-router';
import { BarChart3, BookOpen, House, User } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Palette, Typography } from '@/constants/theme';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: '#9C9083',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: Palette.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 76,
          paddingTop: Platform.OS === 'ios' ? 8 : 10,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontFamily: Typography.sansMedium,
          fontSize: 12,
          paddingBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <House color={color} size={22} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: t('tabs.practice'),
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={22} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabs.progress'),
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={22} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <User color={color} size={22} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
