import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Palette, Typography } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from './BottomSheet';

export interface MenuOption {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  destructive?: boolean;
  onPress: () => void;
}

interface BottomSheetMenuProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: MenuOption[];
}

export function BottomSheetMenu({ visible, onClose, title, options }: BottomSheetMenuProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.modalHandle} />
        {title && <Text style={styles.modalTitle}>{title}</Text>}
        
        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <Pressable 
              key={index}
              style={({ pressed }) => [
                styles.optionRow,
                pressed && styles.pressed
              ]}
              onPress={() => {
                onClose();
                setTimeout(option.onPress, 300); // wait for sheet to close
              }}
            >
              {option.icon && (
                <View style={styles.iconContainer}>
                  {option.icon}
                </View>
              )}
              <View style={styles.textContainer}>
                <Text style={[
                  styles.optionLabel, 
                  option.destructive && styles.destructiveText
                ]}>
                  {option.label}
                </Text>
                {option.description && (
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: Palette.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHandle: {
    width: 48,
    height: 4,
    backgroundColor: Palette.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: Typography.serifMedium,
    fontSize: 24,
    color: Palette.foreground,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Palette.card,
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.foreground,
  },
  destructiveText: {
    color: '#EF4444', // Palette.destructive if available, standard red otherwise
  },
  optionDescription: {
    fontFamily: Typography.sansMedium,
    fontSize: 13,
    color: Palette.mutedForeground,
    marginTop: 2,
  }
});
