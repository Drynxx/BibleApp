import { Tabs } from 'expo-router';
import { BarChart3, BookOpen, House, User } from 'lucide-react-native';
import { Platform, View, Text, Pressable } from 'react-native';
import Animated, { LinearTransition, FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { Palette, Typography } from '@/constants/theme';

function CustomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps & { insets: any }) {
  return (
    <View style={{
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? Math.max(insets.bottom + 12, 24) : 24,
      left: 20,
      right: 20,
      height: 76,
      backgroundColor: '#FFFFFF',
      borderRadius: 38,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      elevation: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let IconComponent = House;
        if (route.name === 'practice') IconComponent = BookOpen;
        else if (route.name === 'progress') IconComponent = BarChart3;
        else if (route.name === 'profile') IconComponent = User;

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={{
              flex: 1,
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 24,
            }}>
              {isFocused && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  style={{
                    position: 'absolute',
                    top: 0, bottom: 0, left: 0, right: 0,
                    backgroundColor: Palette.primaryLight,
                    borderRadius: 24,
                  }}
                />
              )}
              <IconComponent 
                color={isFocused ? Palette.primary : '#A1A1AA'} 
                size={22} 
                strokeWidth={isFocused ? 2.5 : 2} 
              />
              <Text 
                numberOfLines={1}
                style={{ 
                  color: isFocused ? Palette.primary : '#A1A1AA', 
                  fontFamily: isFocused ? Typography.sansBold : Typography.sansMedium, 
                  fontSize: 10,
                  marginTop: 4
                }}
              >
                {options.title}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} insets={insets} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.home') }}
      />
      <Tabs.Screen
        name="practice"
        options={{ title: t('tabs.practice') }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: t('tabs.progress') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile') }}
      />
    </Tabs>
  );
}
