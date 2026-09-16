import { useState, useRef, useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import {
  DrillSession,
  DrillSessionState,
  WordPlacementResult,
  createDrillSession,
} from '../engine/drillSession';
import {
  BlankingStage,
  DrillScoreResult,
  MaskPlaceholderStyle,
} from '../engine/blanking';

export interface UseDrillEngineOptions {
  verseText: string;
  verseRef?: string;
  initialStage?: BlankingStage;
  timeLimitSeconds?: number;
  placeholderStyle?: MaskPlaceholderStyle;
  firstLettersOnly?: boolean;
  onStageComplete?: (stage: BlankingStage) => void;
  onDrillComplete?: (score: DrillScoreResult) => void;
}

export function useDrillEngine(options: UseDrillEngineOptions) {
  const sessionRef = useRef<DrillSession | null>(null);

  // Initialize or re-create session when verseText or initialStage changes
  if (!sessionRef.current || sessionRef.current.getState().verseText !== options.verseText) {
    sessionRef.current = createDrillSession({
      verseText: options.verseText,
      initialStage: options.initialStage ?? 1,
      timeLimitSeconds: options.timeLimitSeconds ?? 60,
      placeholderStyle: options.placeholderStyle ?? 'default',
      firstLettersOnly: options.firstLettersOnly ?? false,
    });
  }

  const [state, setState] = useState<DrillSessionState>(() => sessionRef.current!.getState());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncState = useCallback(() => {
    if (sessionRef.current) {
      setState(sessionRef.current.getState());
    }
  }, []);

  // Timer loop for 60-second micro-drill
  useEffect(() => {
    if (state.status === 'in_progress') {
      timerRef.current = setInterval(() => {
        if (sessionRef.current) {
          const updated = sessionRef.current.tick(1);
          setState({ ...updated });
          if (updated.status === 'timed_out') {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch {}
          }
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.status]);

  const start = useCallback(() => {
    if (!sessionRef.current) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    const s = sessionRef.current.start();
    setState({ ...s });
  }, []);

  const pause = useCallback(() => {
    if (!sessionRef.current) return;
    const s = sessionRef.current.pause();
    setState({ ...s });
  }, []);

  const resume = useCallback(() => {
    if (!sessionRef.current) return;
    const s = sessionRef.current.resume();
    setState({ ...s });
  }, []);

  const submitWord = useCallback(
    (word: string, targetTokenId?: string): WordPlacementResult => {
      if (!sessionRef.current) {
        return {
          success: false,
          isExactMatch: false,
          isNormalizedMatch: false,
          levenshteinDistance: 999,
          stageCompleted: false,
          drillCompleted: false,
        };
      }

      const res = sessionRef.current.submitWord(word, targetTokenId);
      const nextState = sessionRef.current.getState();
      setState({ ...nextState });

      if (res.success) {
        try {
          if (res.drillCompleted) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (options.onDrillComplete && res.score) {
              options.onDrillComplete(res.score);
            }
          } else if (res.stageCompleted) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (options.onStageComplete) {
              options.onStageComplete(nextState.currentStage);
            }
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } catch {}
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
      }

      return res;
    },
    [options]
  );

  const undoPlacement = useCallback((tokenId: string) => {
    if (!sessionRef.current) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const s = sessionRef.current.undoPlacement(tokenId);
    setState({ ...s });
  }, []);

  const selectBlank = useCallback((indexOrId: number | string) => {
    if (!sessionRef.current) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const s = sessionRef.current.selectBlank(indexOrId);
    setState({ ...s });
  }, []);

  const useFirstLetterHint = useCallback((tokenId?: string): string | null => {
    if (!sessionRef.current) return null;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    const hint = sessionRef.current.useFirstLetterHint(tokenId);
    syncState();
    return hint;
  }, [syncState]);

  const revealWord = useCallback((tokenId?: string): string | null => {
    if (!sessionRef.current) return null;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    const revealed = sessionRef.current.revealWord(tokenId);
    syncState();
    return revealed;
  }, [syncState]);

  const advanceStage = useCallback(
    (targetStage?: BlankingStage) => {
      if (!sessionRef.current) return;
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      const s = sessionRef.current.advanceStage(targetStage);
      setState({ ...s });
    },
    []
  );

  const finishDrill = useCallback((): DrillScoreResult | null => {
    if (!sessionRef.current) return null;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    const score = sessionRef.current.finishDrill();
    syncState();
    if (options.onDrillComplete) {
      options.onDrillComplete(score);
    }
    return score;
  }, [options, syncState]);

  const reset = useCallback(
    (stage?: BlankingStage) => {
      if (!sessionRef.current) return;
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      sessionRef.current = createDrillSession({
        verseText: options.verseText,
        initialStage: stage ?? options.initialStage ?? 1,
        timeLimitSeconds: options.timeLimitSeconds ?? 60,
        placeholderStyle: options.placeholderStyle ?? 'default',
        firstLettersOnly: options.firstLettersOnly ?? false,
      });
      syncState();
    },
    [options, syncState]
  );

  return {
    state,
    start,
    pause,
    resume,
    submitWord,
    undoPlacement,
    selectBlank,
    useFirstLetterHint,
    revealWord,
    advanceStage,
    finishDrill,
    reset,
  };
}
