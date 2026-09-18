import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, Pressable, StyleSheet } from 'react-native';

export function BottomSheet({ visible, onClose, children }: { visible: boolean, onClose: () => void, children: React.ReactNode }) {
  const [show, setShow] = useState(visible);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: false }),
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: false })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        Animated.timing(slideAnim, { toValue: Dimensions.get('window').height, duration: 250, useNativeDriver: false })
      ]).start(() => setShow(false));
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) slideAnim.setValue(g.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          onClose();
        } else {
          Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: false }).start();
        }
      }
    })
  ).current;

  if (!show) return null;

  return (
    <Modal visible={show} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent hardwareAccelerated>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View 
        {...panResponder.panHandlers}
        style={{ flex: 1, justifyContent: 'flex-end', transform: [{ translateY: slideAnim }] }}
        pointerEvents="box-none"
      >
        {children}
      </Animated.View>
    </Modal>
  );
}
