import {
  VerseToken,
  MaskedToken,
  BlankingStage,
  WordValidationResult,
  DrillScoreResult,
  MaskingOptions,
  tokenizeVerse,
  generateMaskedTokens,
  generateFirstLetterTokens,
  validateWord,
  validateWordDetailed,
  validateFirstLetter,
  calculateDrillScore,
} from './blanking';

export type DrillStatus = 'idle' | 'running' | 'paused' | 'completed' | 'time_up';

export type DrillMode = 'word_bank' | 'first_letter' | 'type_in';

export interface DrillConfig {
  verseText: string;
  verseReference?: string;
  translation?: string;
  stage?: BlankingStage;
  durationSeconds?: number;
  mode?: DrillMode;
  progressiveMode?: boolean;
  customMaskRatio?: number;
  shuffleWordBank?: boolean;
}

export interface DrillFeedback {
  isCorrect: boolean;
  word: string;
  targetWord?: string;
  details?: WordValidationResult;
}

export interface DrillHistoryEntry {
  timestamp: number;
  type: 'submit_word' | 'submit_letter' | 'hint' | 'tick' | 'stage_change';
  input?: string;
  target?: string;
  isCorrect?: boolean;
  timeRemaining: number;
}

export interface DrillState {
  status: DrillStatus;
  mode: DrillMode;
  stage: BlankingStage;
  progressiveMode: boolean;
  verseText: string;
  verseReference?: string;
  translation?: string;
  durationSeconds: number;
  timeRemaining: number;
  timeElapsed: number;
  tokens: MaskedToken[];
  blanks: MaskedToken[];
  currentBlankIndex: number;
  wordBank: string[];
  totalBlanks: number;
  completedBlanks: number;
  mistakes: number;
  hintsUsed: number;
  streak: number;
  maxStreak: number;
  score: DrillScoreResult | null;
  lastFeedback: DrillFeedback | null;
  history: DrillHistoryEntry[];
}

export type DrillAction =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'TICK'; deltaSeconds?: number }
  | { type: 'SUBMIT_WORD'; word: string; tokenIndex?: number }
  | { type: 'SUBMIT_LETTER'; letter: string }
  | { type: 'REQUEST_HINT' }
  | { type: 'RESTART' }
  | { type: 'SET_STAGE'; stage: BlankingStage }
  | { type: 'SET_MODE'; mode: DrillMode };

/**
 * Creates the initial state for a 60-second scripture memorization drill.
 */
export function createInitialDrillState(config: DrillConfig): DrillState {
  const stage = config.stage ?? 2;
  const duration = config.durationSeconds ?? 60;
  const mode = config.mode ?? 'word_bank';
  const progressiveMode = config.progressiveMode ?? false;

  const baseTokens = tokenizeVerse(config.verseText || '');

  let maskedTokens: MaskedToken[];
  let wordBank: string[];

  if (mode === 'first_letter') {
    const res = generateFirstLetterTokens(baseTokens);
    maskedTokens = res.maskedTokens;
    wordBank = res.wordBank;
  } else {
    const maskingOpts: MaskingOptions = {
      mode: progressiveMode ? 'progressive' : 'standard',
      customRatio: config.customMaskRatio,
    };
    const res = generateMaskedTokens(baseTokens, stage, maskingOpts);
    maskedTokens = res.maskedTokens;
    wordBank = res.wordBank;
  }

  if (config.shuffleWordBank === false) {
    wordBank = maskedTokens.filter((t) => t.isMasked).map((t) => t.raw);
  }

  const blanks = maskedTokens.filter((t) => t.isMasked);

  return {
    status: 'idle',
    mode,
    stage,
    progressiveMode,
    verseText: config.verseText,
    verseReference: config.verseReference,
    translation: config.translation,
    durationSeconds: duration,
    timeRemaining: duration,
    timeElapsed: 0,
    tokens: maskedTokens,
    blanks,
    currentBlankIndex: 0,
    wordBank,
    totalBlanks: blanks.length,
    completedBlanks: 0,
    mistakes: 0,
    hintsUsed: 0,
    streak: 0,
    maxStreak: 0,
    score: null,
    lastFeedback: null,
    history: [],
  };
}

/**
 * Pure reducer function for drill state transitions.
 */
export function drillReducer(state: DrillState, action: DrillAction): DrillState {
  switch (action.type) {
    case 'START': {
      if (state.status === 'running' || state.status === 'completed' || state.status === 'time_up') {
        return state;
      }
      return {
        ...state,
        status: 'running',
      };
    }

    case 'PAUSE': {
      if (state.status !== 'running') return state;
      return {
        ...state,
        status: 'paused',
      };
    }

    case 'RESUME': {
      if (state.status !== 'paused') return state;
      return {
        ...state,
        status: 'running',
      };
    }

    case 'TICK': {
      if (state.status !== 'running') return state;

      const delta = action.deltaSeconds ?? 1;
      const newTimeElapsed = state.timeElapsed + delta;
      const newTimeRemaining = Math.max(0, state.timeRemaining - delta);

      if (newTimeRemaining <= 0) {
        const finalScore = calculateDrillScore({
          stage: state.stage,
          totalBlanks: state.totalBlanks,
          mistakes: state.mistakes,
          secondsElapsed: newTimeElapsed,
        });

        return {
          ...state,
          status: 'time_up',
          timeRemaining: 0,
          timeElapsed: newTimeElapsed,
          score: finalScore,
          history: [
            ...state.history,
            { timestamp: Date.now(), type: 'tick', timeRemaining: 0 },
          ],
        };
      }

      return {
        ...state,
        timeRemaining: newTimeRemaining,
        timeElapsed: newTimeElapsed,
      };
    }

    case 'SUBMIT_WORD': {
      if (state.status !== 'running') return state;
      if (state.completedBlanks >= state.totalBlanks) return state;

      // Identify target blank
      let targetBlankIndex = state.currentBlankIndex;
      let targetToken: MaskedToken | undefined;

      if (action.tokenIndex !== undefined) {
        const found = state.tokens[action.tokenIndex];
        if (found && found.isMasked && !found.isCorrect) {
          targetToken = found;
          targetBlankIndex = state.blanks.findIndex((b) => b.id === found.id);
        }
      }

      if (!targetToken) {
        targetToken = state.blanks[targetBlankIndex];
      }

      if (!targetToken) return state;

      const validation = validateWordDetailed(action.word, targetToken.raw);

      if (validation.isValid) {
        // Mark token resolved
        const updatedTokens = state.tokens.map((tok) => {
          if (tok.id === targetToken?.id) {
            return {
              ...tok,
              isMasked: false,
              userPlacedText: action.word,
              isCorrect: true,
            };
          }
          return tok;
        });

        const updatedBlanks = state.blanks.map((b) => {
          if (b.id === targetToken?.id) {
            return {
              ...b,
              isMasked: false,
              userPlacedText: action.word,
              isCorrect: true,
            };
          }
          return b;
        });

        // Remove from word bank (first matching word)
        const bankIdx = state.wordBank.findIndex(
          (w) => validateWord(w, action.word) || w === action.word
        );
        const updatedBank = [...state.wordBank];
        if (bankIdx !== -1) {
          updatedBank.splice(bankIdx, 1);
        }

        const newCompleted = state.completedBlanks + 1;
        const newStreak = state.streak + 1;
        const newMaxStreak = Math.max(state.maxStreak, newStreak);
        const isCompleted = newCompleted >= state.totalBlanks;

        // Find next unresolved blank index
        const nextBlankIdx = updatedBlanks.findIndex((b) => !b.isCorrect);

        const finalScore = isCompleted
          ? calculateDrillScore({
              stage: state.stage,
              totalBlanks: state.totalBlanks,
              mistakes: state.mistakes,
              secondsElapsed: state.timeElapsed,
            })
          : state.score;

        return {
          ...state,
          tokens: updatedTokens,
          blanks: updatedBlanks,
          wordBank: updatedBank,
          completedBlanks: newCompleted,
          currentBlankIndex: nextBlankIdx !== -1 ? nextBlankIdx : updatedBlanks.length,
          streak: newStreak,
          maxStreak: newMaxStreak,
          status: isCompleted ? 'completed' : 'running',
          score: finalScore,
          lastFeedback: {
            isCorrect: true,
            word: action.word,
            targetWord: targetToken.raw,
            details: validation,
          },
          history: [
            ...state.history,
            {
              timestamp: Date.now(),
              type: 'submit_word',
              input: action.word,
              target: targetToken.raw,
              isCorrect: true,
              timeRemaining: state.timeRemaining,
            },
          ],
        };
      } else {
        // Wrong word submitted
        const newMistakes = state.mistakes + 1;

        return {
          ...state,
          mistakes: newMistakes,
          streak: 0,
          lastFeedback: {
            isCorrect: false,
            word: action.word,
            targetWord: targetToken.raw,
            details: validation,
          },
          history: [
            ...state.history,
            {
              timestamp: Date.now(),
              type: 'submit_word',
              input: action.word,
              target: targetToken.raw,
              isCorrect: false,
              timeRemaining: state.timeRemaining,
            },
          ],
        };
      }
    }

    case 'SUBMIT_LETTER': {
      if (state.status !== 'running') return state;
      if (state.completedBlanks >= state.totalBlanks) return state;

      const targetToken = state.blanks[state.currentBlankIndex];
      if (!targetToken) return state;

      const isMatch = validateFirstLetter(action.letter, targetToken.raw);

      if (isMatch) {
        const updatedTokens = state.tokens.map((tok) => {
          if (tok.id === targetToken.id) {
            return {
              ...tok,
              isMasked: false,
              userPlacedText: targetToken.raw,
              isCorrect: true,
            };
          }
          return tok;
        });

        const updatedBlanks = state.blanks.map((b) => {
          if (b.id === targetToken.id) {
            return {
              ...b,
              isMasked: false,
              userPlacedText: targetToken.raw,
              isCorrect: true,
            };
          }
          return b;
        });

        const newCompleted = state.completedBlanks + 1;
        const newStreak = state.streak + 1;
        const newMaxStreak = Math.max(state.maxStreak, newStreak);
        const isCompleted = newCompleted >= state.totalBlanks;
        const nextBlankIdx = updatedBlanks.findIndex((b) => !b.isCorrect);

        const finalScore = isCompleted
          ? calculateDrillScore({
              stage: state.stage,
              totalBlanks: state.totalBlanks,
              mistakes: state.mistakes,
              secondsElapsed: state.timeElapsed,
            })
          : state.score;

        return {
          ...state,
          tokens: updatedTokens,
          blanks: updatedBlanks,
          completedBlanks: newCompleted,
          currentBlankIndex: nextBlankIdx !== -1 ? nextBlankIdx : updatedBlanks.length,
          streak: newStreak,
          maxStreak: newMaxStreak,
          status: isCompleted ? 'completed' : 'running',
          score: finalScore,
          lastFeedback: {
            isCorrect: true,
            word: action.letter,
            targetWord: targetToken.raw,
          },
          history: [
            ...state.history,
            {
              timestamp: Date.now(),
              type: 'submit_letter',
              input: action.letter,
              target: targetToken.raw,
              isCorrect: true,
              timeRemaining: state.timeRemaining,
            },
          ],
        };
      } else {
        const newMistakes = state.mistakes + 1;
        return {
          ...state,
          mistakes: newMistakes,
          streak: 0,
          lastFeedback: {
            isCorrect: false,
            word: action.letter,
            targetWord: targetToken.raw,
          },
          history: [
            ...state.history,
            {
              timestamp: Date.now(),
              type: 'submit_letter',
              input: action.letter,
              target: targetToken.raw,
              isCorrect: false,
              timeRemaining: state.timeRemaining,
            },
          ],
        };
      }
    }

    case 'REQUEST_HINT': {
      if (state.status !== 'running') return state;
      return {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        history: [
          ...state.history,
          {
            timestamp: Date.now(),
            type: 'hint',
            timeRemaining: state.timeRemaining,
          },
        ],
      };
    }

    case 'RESTART': {
      return createInitialDrillState({
        verseText: state.verseText,
        verseReference: state.verseReference,
        translation: state.translation,
        stage: state.stage,
        durationSeconds: state.durationSeconds,
        mode: state.mode,
        progressiveMode: state.progressiveMode,
      });
    }

    case 'SET_STAGE': {
      return createInitialDrillState({
        verseText: state.verseText,
        verseReference: state.verseReference,
        translation: state.translation,
        stage: action.stage,
        durationSeconds: state.durationSeconds,
        mode: state.mode,
        progressiveMode: state.progressiveMode,
      });
    }

    case 'SET_MODE': {
      return createInitialDrillState({
        verseText: state.verseText,
        verseReference: state.verseReference,
        translation: state.translation,
        stage: state.stage,
        durationSeconds: state.durationSeconds,
        mode: action.mode,
        progressiveMode: state.progressiveMode,
      });
    }

    default:
      return state;
  }
}

/**
 * Object-oriented state machine managing the lifecycle, timer, scoring, and feedback
 * for 60-second Scripture memorization drills.
 */
export class DrillStateMachine {
  private state: DrillState;
  private listeners: Set<(state: DrillState) => void> = new Set();
  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor(config: DrillConfig) {
    this.state = createInitialDrillState(config);
  }

  public getState(): DrillState {
    return this.state;
  }

  public dispatch(action: DrillAction): DrillState {
    const prevState = this.state;
    this.state = drillReducer(this.state, action);

    if (this.state !== prevState) {
      this.notify();
    }

    return this.state;
  }

  public start(autoTimer: boolean = false, intervalMs: number = 1000): void {
    this.dispatch({ type: 'START' });
    if (autoTimer) {
      this.startTimer(intervalMs);
    }
  }

  public pause(): void {
    this.stopTimer();
    this.dispatch({ type: 'PAUSE' });
  }

  public resume(autoTimer: boolean = false, intervalMs: number = 1000): void {
    this.dispatch({ type: 'RESUME' });
    if (autoTimer) {
      this.startTimer(intervalMs);
    }
  }

  public tick(deltaSeconds: number = 1): void {
    this.dispatch({ type: 'TICK', deltaSeconds });
    if (this.state.status === 'time_up' || this.state.status === 'completed') {
      this.stopTimer();
    }
  }

  public submitWord(
    word: string,
    tokenIndex?: number
  ): { isCorrect: boolean; isComplete: boolean; details?: WordValidationResult } {
    this.dispatch({ type: 'SUBMIT_WORD', word, tokenIndex });
    const fb = this.state.lastFeedback;
    return {
      isCorrect: fb?.isCorrect ?? false,
      isComplete: this.state.status === 'completed',
      details: fb?.details,
    };
  }

  public submitLetter(letter: string): { isCorrect: boolean; isComplete: boolean } {
    this.dispatch({ type: 'SUBMIT_LETTER', letter });
    const fb = this.state.lastFeedback;
    return {
      isCorrect: fb?.isCorrect ?? false,
      isComplete: this.state.status === 'completed',
    };
  }

  public requestHint(): string | null {
    if (this.state.status !== 'running') return null;
    const target = this.state.blanks[this.state.currentBlankIndex];
    if (!target) return null;

    this.dispatch({ type: 'REQUEST_HINT' });
    return target.raw.charAt(0);
  }

  public restart(): void {
    this.stopTimer();
    this.dispatch({ type: 'RESTART' });
  }

  public setStage(stage: BlankingStage): void {
    this.stopTimer();
    this.dispatch({ type: 'SET_STAGE', stage });
  }

  public setMode(mode: DrillMode): void {
    this.stopTimer();
    this.dispatch({ type: 'SET_MODE', mode });
  }

  public subscribe(listener: (state: DrillState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public startTimer(intervalMs: number = 1000): void {
    this.stopTimer();
    this.timerId = setInterval(() => {
      this.tick(1);
    }, intervalMs);
    if (this.timerId && typeof (this.timerId as any).unref === 'function') {
      (this.timerId as any).unref();
    }
  }

  public stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public destroy(): void {
    this.stopTimer();
    this.listeners.clear();
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  get status(): DrillStatus {
    return this.state.status;
  }

  get timeRemaining(): number {
    return this.state.timeRemaining;
  }

  get timeElapsed(): number {
    return this.state.timeElapsed;
  }

  get isCompleted(): boolean {
    return this.state.status === 'completed';
  }

  get isTimeUp(): boolean {
    return this.state.status === 'time_up';
  }

  get isRunning(): boolean {
    return this.state.status === 'running';
  }

  get score(): DrillScoreResult | null {
    return this.state.score;
  }

  get mistakes(): number {
    return this.state.mistakes;
  }

  get streak(): number {
    return this.state.streak;
  }

  get maxStreak(): number {
    return this.state.maxStreak;
  }

  get completedBlanks(): number {
    return this.state.completedBlanks;
  }

  get totalBlanks(): number {
    return this.state.totalBlanks;
  }
}

/**
 * Factory function to create a new DrillStateMachine instance.
 */
export function createDrillStateMachine(config: DrillConfig): DrillStateMachine {
  return new DrillStateMachine(config);
}
