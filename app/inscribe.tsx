import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Check,
  Leaf,
  RotateCcw,
  X,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette, Typography } from '@/constants/theme';

const verse = "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.";
const words = verse.split(" ");
const hiddenIndexes = [3, 8, 13, 16, 21, 24];
const answers = hiddenIndexes.map((index) => words[index] ?? "");
const options = ["loved", "gave", "Son,", "believes", "perish", "eternal", "created", "fears"];

export default function InscribeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [level, setLevel] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [wrong, setWrong] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const complete = revealed === words.length;

  useEffect(() => {
    if (level === 3) {
      setTimeout(() => inputRef.current?.focus(), 500);
    }
  }, [level]);

  const close = () => router.back();
  
  const choose = (word: string) => {
    if (picked.length >= answers.length || picked.includes(word)) return;
    const expected = answers[picked.length];
    if (word === expected) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setWrong(false);
      setPicked((current) => [...current, word]);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setWrong(true);
    }
  };

  const typeLetter = (value: string) => {
    const letter = value.slice(-1).toLowerCase();
    const expected = (words[revealed]?.match(/[a-z]/i)?.[0] ?? "").toLowerCase();
    
    if (letter === expected) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRevealed((current) => Math.min(words.length, current + 1));
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top + 8, 20), paddingBottom: insets.bottom + 20 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={close}
          accessibilityLabel="Close practice"
        >
          <X color={Palette.foreground} size={20} />
        </Pressable>
        
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={[styles.progressDot, item <= level ? styles.progressDotActive : styles.progressDotInactive]} />
          ))}
        </View>

        <Text style={styles.progressText}>{level}/3</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {level === 1 && <LevelOne onNext={() => setLevel(2)} />}
        {level === 2 && <LevelTwo picked={picked} wrong={wrong} onChoose={choose} onReset={() => { setPicked([]); setWrong(false); }} onNext={() => setLevel(3)} />}
        {level === 3 && <LevelThree revealed={revealed} complete={complete} inputRef={inputRef} onType={typeLetter} onFocus={() => inputRef.current?.focus()} onRestart={() => { setLevel(1); setPicked([]); setRevealed(0); }} onClose={close} />}
      </ScrollView>
    </View>
  );
}

function LevelOne({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.levelContainer}>
      <Text style={styles.eyebrow}>Level one · Stillness</Text>
      <Text style={styles.title}>Read & reflect</Text>
      
      <View style={styles.cardContainer}>
        <View style={styles.blobOne} />
        <View style={styles.blobTwo} />
        <Leaf color="rgba(158, 67, 36, 0.2)" size={90} strokeWidth={1} style={styles.bgIcon} />
        
        <Text style={styles.cardEyebrow}>John 3:16 · NIV</Text>
        <Text style={styles.quote}>“{verse}”</Text>
      </View>
      
      <Text style={styles.description}>Stay with each phrase. Notice the love at the heart of every word.</Text>
      
      <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={onNext}>
        <Text style={styles.buttonText}>I’m ready</Text>
        <ArrowRight color="#fff" size={20} />
      </Pressable>
    </View>
  );
}

function LevelTwo({ picked, wrong, onChoose, onReset, onNext }: { picked: string[]; wrong: boolean; onChoose: (word: string) => void; onReset: () => void; onNext: () => void }) {
  const done = picked.length === answers.length;
  let blank = 0;
  
  return (
    <View style={styles.levelContainer}>
      <Text style={styles.eyebrow}>Level two · The Weave</Text>
      <Text style={styles.title}>Complete the verse</Text>
      <Text style={styles.subtitle}>Choose each missing word in order.</Text>
      
      <View style={styles.weaveQuoteContainer}>
        <Text style={styles.weaveQuote}>
          {words.map((word, index) => {
            if (!hiddenIndexes.includes(index)) {
              return <Text key={index}>{word} </Text>;
            }
            const value = picked[blank];
            const current = blank;
            blank += 1;
            
            const isWrong = current === picked.length && wrong;
            const isFilled = !!value;
            
            return (
              <Text key={index}>
                <Text 
                  style={[
                    styles.blankText,
                    isFilled ? styles.blankFilled : isWrong ? styles.blankWrong : styles.blankEmpty
                  ]}
                >
                  {value ?? "______"}
                </Text>
                {" "}
              </Text>
            );
          })}
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {options.map((word) => (
          <Pressable 
            key={word} 
            disabled={picked.includes(word) || done}
            style={({ pressed }) => [
              styles.optionBadge,
              picked.includes(word) ? styles.optionBadgeDisabled : styles.optionBadgeActive,
              pressed && styles.pressed
            ]}
            onPress={() => onChoose(word)}
          >
            <Text style={[styles.optionText, picked.includes(word) && styles.optionTextDisabled]}>{word}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.statusContainer}>
        {wrong && <Text style={styles.statusWrong}>Try another word.</Text>}
        {done && <Text style={styles.statusCorrect}>Beautifully woven together.</Text>}
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]} onPress={onReset}>
          <RotateCcw color={Palette.foreground} size={20} />
        </Pressable>
        <Pressable 
          disabled={!done}
          style={({ pressed }) => [styles.continueButton, !done && styles.disabledBtn, pressed && styles.pressed]} 
          onPress={onNext}
        >
          <Text style={styles.buttonText}>Continue</Text>
          <ArrowRight color="#fff" size={20} />
        </Pressable>
      </View>
    </View>
  );
}

function LevelThree({ revealed, complete, inputRef, onType, onFocus, onRestart, onClose }: { revealed: number; complete: boolean; inputRef: React.RefObject<TextInput | null>; onType: (value: string) => void; onFocus: () => void; onRestart: () => void; onClose: () => void }) {
  return (
    <Pressable style={styles.levelContainer} onPress={onFocus}>
      <Text style={styles.eyebrow}>Level three · The Inscription</Text>
      <Text style={styles.title}>Recall from within</Text>
      <Text style={styles.subtitle}>Type the first letter of every word.</Text>
      
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect={false}
        onChangeText={onType}
        value=""
      />

      <View style={styles.inscriptionContainer}>
        <Text style={styles.weaveQuote}>
          {revealed === 0 ? <Text style={styles.cursorPulse}>|</Text> : words.slice(0, revealed).join(" ")}
          {revealed > 0 && !complete && <Text style={styles.cursorPulse}> |</Text>}
        </Text>
      </View>

      {complete ? (
        <View style={styles.finishContainer}>
          <View style={styles.finishStatus}>
            <Check color={Palette.sage} size={20} />
            <Text style={styles.statusCorrect}>John 3:16 is inscribed.</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={onClose}>
            <Text style={styles.buttonText}>Finish</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={onRestart}>
            <Text style={styles.secondaryButtonText}>Practice again</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]} onPress={onFocus}>
          <Text style={styles.outlineButtonText}>Tap here, then type letters</Text>
          <Text style={styles.countText}>{revealed}/{words.length}</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  progressDot: {
    height: 6,
    width: 40,
    borderRadius: 3,
  },
  progressDotActive: {
    backgroundColor: Palette.primary,
  },
  progressDotInactive: {
    backgroundColor: Palette.border,
  },
  progressText: {
    fontFamily: Typography.sansBold,
    fontSize: 12,
    color: Palette.primary,
    width: 44,
    textAlign: 'right',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  levelContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 30,
  },
  eyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    letterSpacing: 2,
    color: Palette.gold,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: Typography.serifSemiBold,
    fontSize: 34,
    color: Palette.foreground,
    marginTop: 12,
  },
  subtitle: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    color: Palette.mutedForeground,
    marginTop: 8,
  },
  cardContainer: {
    width: '100%',
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginVertical: 20,
    position: 'relative',
  },
  blobOne: {
    position: 'absolute',
    width: '90%',
    height: 200,
    borderRadius: 100,
    backgroundColor: Palette.secondary,
    opacity: 0.45,
    transform: [{ rotate: '-3deg' }],
  },
  blobTwo: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.gold,
    opacity: 0.15,
  },
  bgIcon: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    transform: [{ rotate: '-12deg' }],
  },
  cardEyebrow: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    letterSpacing: 2.5,
    color: Palette.primary,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  quote: {
    fontFamily: Typography.serifMedium,
    fontSize: 32,
    lineHeight: 40,
    color: Palette.foreground,
    textAlign: 'center',
    maxWidth: '90%',
  },
  description: {
    fontFamily: Typography.sansMedium,
    fontSize: 14,
    lineHeight: 24,
    color: Palette.mutedForeground,
    textAlign: 'center',
    maxWidth: '80%',
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: Palette.primary,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
  },
  buttonText: {
    fontFamily: Typography.sansBold,
    fontSize: 18,
    color: '#fff',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  weaveQuoteContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    paddingVertical: 20,
    width: '100%',
  },
  weaveQuote: {
    fontFamily: Typography.serifMedium,
    fontSize: 30,
    lineHeight: 46,
    color: Palette.foreground,
    textAlign: 'center',
  },
  blankText: {
    borderBottomWidth: 2,
    minWidth: 80,
    textAlign: 'center',
  },
  blankFilled: {
    borderColor: Palette.primary,
    color: Palette.primary,
  },
  blankWrong: {
    borderColor: Palette.destructive,
    color: Palette.destructive,
  },
  blankEmpty: {
    borderColor: Palette.gold,
    color: 'rgba(0,0,0,0)',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  optionBadge: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  optionBadgeActive: {
    borderColor: Palette.border,
    backgroundColor: Palette.background,
  },
  optionBadgeDisabled: {
    borderColor: Palette.border,
    backgroundColor: Palette.secondary,
  },
  optionText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.foreground,
  },
  optionTextDisabled: {
    color: Palette.mutedForeground,
  },
  statusContainer: {
    minHeight: 24,
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusWrong: {
    fontFamily: Typography.sansBold,
    fontSize: 14,
    color: Palette.destructive,
  },
  statusCorrect: {
    fontFamily: Typography.sansBold,
    fontSize: 14,
    color: Palette.sage,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  resetButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  inscriptionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 40,
  },
  cursorPulse: {
    color: Palette.gold,
  },
  finishContainer: {
    width: '100%',
    marginTop: 20,
  },
  finishStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  secondaryButton: {
    height: 50,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.foreground,
  },
  outlineButton: {
    height: 60,
    width: '100%',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Palette.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  outlineButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: 16,
    color: Palette.foreground,
    flex: 1,
  },
  countText: {
    fontFamily: Typography.sansMedium,
    fontSize: 12,
    color: Palette.mutedForeground,
  },
});
