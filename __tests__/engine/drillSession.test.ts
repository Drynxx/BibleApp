import {
  DrillSession,
  createDrillSession,
} from '@/engine/drillSession';
import { BlankingStage } from '@/engine/blanking';

describe('Interactive Drill Session Engine & State Machine', () => {
  const romanianVerse =
    'Să nu te părăsească bunătatea și credincioșia: leagă-le la gât, scrie-le pe tăblița inimii tale!';

  describe('Session Initialization & Configuration', () => {
    it('initializes in idle state with default Stage 2 configuration', () => {
      const session = createDrillSession({ verseText: romanianVerse });
      const state = session.getState();

      expect(state.currentStage).toBe(2);
      expect(state.status).toBe('idle');
      expect(state.elapsedSeconds).toBe(0);
      expect(state.timeLimitSeconds).toBe(60);
      expect(state.mistakes).toBe(0);
      expect(state.correctCount).toBe(0);
      expect(state.currentStreak).toBe(0);
      expect(state.totalBlanks).toBeGreaterThan(0);
      expect(state.wordBank.length).toBe(state.totalBlanks);
      expect(state.activeBlankIndex).not.toBeNull();
    });

    it('supports custom initial stages and time limits', () => {
      const session = createDrillSession({
        verseText: romanianVerse,
        initialStage: 4,
        timeLimitSeconds: 90,
      });
      const state = session.getState();

      expect(state.currentStage).toBe(4);
      expect(state.timeLimitSeconds).toBe(90);
      const nonPunctuationWords = state.tokens.filter((t) => !t.isPunctuation);
      expect(state.totalBlanks).toBe(nonPunctuationWords.length);
    });

    it('supports firstLettersOnly configuration', () => {
      const session = createDrillSession({
        verseText: romanianVerse,
        initialStage: 3,
        firstLettersOnly: true,
      });
      const state = session.getState();
      const blanks = state.maskedTokens.filter((t) => t.isMasked);

      blanks.forEach((b) => {
        expect(b.firstLetter).toBe(b.raw.charAt(0));
        expect(b.maskLength).toBe(b.raw.length);
      });
    });
  });

  describe('Word Placement & Romanian Diacritic Handling', () => {
    let session: DrillSession;

    beforeEach(() => {
      session = createDrillSession({
        verseText: romanianVerse,
        initialStage: 2,
      });
      session.start();
    });

    it('accepts diacritic-normalized Romanian words as valid matches', () => {
      const state = session.getState();
      const firstBlank = state.maskedTokens.find((t) => t.isMasked)!;

      // Type without diacritics
      const inputWithoutDiacritics = firstBlank.clean;
      const res = session.submitWord(inputWithoutDiacritics, firstBlank.id);

      expect(res.success).toBe(true);
      expect(res.isNormalizedMatch).toBe(true);
      expect(res.token?.isCorrect).toBe(true);
      expect(res.token?.userPlacedText).toBe(inputWithoutDiacritics);

      const updatedState = session.getState();
      expect(updatedState.correctCount).toBe(1);
      expect(updatedState.currentStreak).toBe(1);
    });

    it('handles legacy Romanian cedillas (ş, ţ) seamlessly', () => {
      const cedillaVerse = 'Domnul este înştiinţat de credincioşia ta.';
      const s = createDrillSession({ verseText: cedillaVerse, initialStage: 4 });
      s.start();

      const blank = s.getState().maskedTokens.find((t) => t.clean === 'instiintat')!;
      // Submit with modern comma-below diacritic
      const result = s.submitWord('înștiințat', blank.id);

      expect(result.success).toBe(true);
      expect(result.isNormalizedMatch).toBe(true);
    });

    it('penalizes incorrect answers and calculates Levenshtein distance', () => {
      const state = session.getState();
      const firstBlank = state.maskedTokens.find((t) => t.isMasked)!;

      const res = session.submitWord('CompletelyWrongWord', firstBlank.id);

      expect(res.success).toBe(false);
      expect(res.levenshteinDistance).toBeGreaterThan(3);

      const updatedState = session.getState();
      expect(updatedState.mistakes).toBe(1);
      expect(updatedState.currentStreak).toBe(0);
    });

    it('removes placed words from the available word bank', () => {
      const state = session.getState();
      const firstBlank = state.maskedTokens.find((t) => t.isMasked)!;
      const initialBankCount = state.wordBank.length;

      session.submitWord(firstBlank.raw, firstBlank.id);

      const updatedState = session.getState();
      expect(updatedState.wordBank.length).toBe(initialBankCount - 1);
    });
  });

  describe('Interactive Features: Undo, Hints, and Reveal', () => {
    let session: DrillSession;

    beforeEach(() => {
      session = createDrillSession({
        verseText: romanianVerse,
        initialStage: 2,
      });
      session.start();
    });

    it('undos placed words and restores them to the word bank', () => {
      const state = session.getState();
      const firstBlank = state.maskedTokens.find((t) => t.isMasked)!;
      const initialBankCount = state.wordBank.length;

      session.submitWord(firstBlank.raw, firstBlank.id);
      expect(session.getState().wordBank.length).toBe(initialBankCount - 1);

      session.undoPlacement(firstBlank.id);
      const restoredState = session.getState();

      expect(restoredState.wordBank.length).toBe(initialBankCount);
      expect(restoredState.correctCount).toBe(0);
      expect(restoredState.maskedTokens.find((t) => t.id === firstBlank.id)?.userPlacedText).toBeUndefined();
    });

    it('provides first letter hints without counting as a mistake', () => {
      const state = session.getState();
      const firstBlank = state.maskedTokens.find((t) => t.isMasked)!;

      const hint = session.useFirstLetterHint(firstBlank.id);
      expect(hint).toBe(firstBlank.raw.charAt(0));

      const updatedState = session.getState();
      expect(updatedState.hintsUsed).toBe(1);
      expect(updatedState.mistakes).toBe(0);
    });

    it('emergency reveals words and counts as a mistake', () => {
      const state = session.getState();
      const firstBlank = state.maskedTokens.find((t) => t.isMasked)!;

      const revealed = session.revealWord(firstBlank.id);
      expect(revealed).toBe(firstBlank.raw);

      const updatedState = session.getState();
      expect(updatedState.mistakes).toBe(1);
      expect(updatedState.correctCount).toBe(1);
      expect(updatedState.hintsUsed).toBe(1);
      expect(updatedState.maskedTokens.find((t) => t.id === firstBlank.id)?.isCorrect).toBe(true);
    });
  });

  describe('Stage Progression & Full 4-Level Drill Lifecycle', () => {
    it('progresses smoothly through all 4 stages to full completion', () => {
      const shortVerse = 'Cuvântul Domnului este curat.';
      const session = createDrillSession({
        verseText: shortVerse,
        initialStage: 1,
      });

      session.start();
      expect(session.getState().currentStage).toBe(1);
      expect(session.getState().totalBlanks).toBe(0);

      // Advance to Stage 2 (30% recall)
      session.advanceStage(2);
      expect(session.getState().currentStage).toBe(2);
      let blanks = session.getState().maskedTokens.filter((t) => t.isMasked);
      expect(blanks.length).toBeGreaterThan(0);

      // Solve Stage 2
      blanks.forEach((b) => {
        const res = session.submitWord(b.raw, b.id);
        expect(res.success).toBe(true);
      });
      expect(session.getState().status).toBe('stage_completed');

      // Advance to Stage 3 (70% recall)
      session.advanceStage(3);
      expect(session.getState().currentStage).toBe(3);
      blanks = session.getState().maskedTokens.filter((t) => t.isMasked);
      blanks.forEach((b) => {
        session.submitWord(b.raw, b.id);
      });
      expect(session.getState().status).toBe('stage_completed');

      // Advance to Stage 4 (100% mastery)
      session.advanceStage(4);
      expect(session.getState().currentStage).toBe(4);
      blanks = session.getState().maskedTokens.filter((t) => t.isMasked);
      const nonPunctuationTokens = session.getState().tokens.filter((t) => !t.isPunctuation);
      expect(blanks.length).toBe(nonPunctuationTokens.length);

      // Solve all words in Stage 4
      blanks.forEach((b) => {
        session.submitWord(b.raw, b.id);
      });

      // Session is complete!
      expect(session.getState().status).toBe('drill_completed');
      expect(session.getState().score).not.toBeNull();
      expect(session.getState().score?.perfect).toBe(true);
      expect(session.getState().score?.accuracy).toBe(100);
      expect(session.getState().score?.xpEarned).toBeGreaterThanOrEqual(40);
    });
  });

  describe('Timer & Speed Bonus Calculations', () => {
    it('awards speed bonus when completed within 60 seconds', () => {
      const session = createDrillSession({
        verseText: 'Har și pace.',
        initialStage: 4,
      });
      session.start();
      session.tick(30); // 30 seconds elapsed

      const blanks = session.getState().maskedTokens.filter((t) => t.isMasked);
      blanks.forEach((b) => session.submitWord(b.raw, b.id));

      const finalState = session.getState();
      expect(finalState.score?.speedBonus).toBe(true);
      expect(finalState.score?.xpEarned).toBe(40 + 10 + 5); // 40 base + 10 perfect + 5 speed = 55
    });

    it('marks timed_out and denies speed bonus when elapsed >= 60 seconds', () => {
      const session = createDrillSession({
        verseText: 'Har și pace.',
        initialStage: 4,
      });
      session.start();
      session.setElapsed(65); // 65 seconds elapsed

      expect(session.getState().status).toBe('timed_out');
      expect(session.getState().score?.speedBonus).toBe(false);
    });
  });
});
