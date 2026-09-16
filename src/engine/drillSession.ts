/**
 * Inscribe Interactive Drill Session Engine & State Machine
 *
 * Manages the isolated 60-second progressive word-blanking drill session across Levels 1–4.
 * Features:
 * - Pure dependency-free TypeScript architecture.
 * - Progressive masking stages (1: 0%, 2: 30%, 3: 70%, 4: 100% or first-letter prompts).
 * - Romanian diacritic-tolerant input comparison with immediate boolean feedback.
 * - Word bank management, tile placement, undo, and hints.
 * - Timer tracking and multi-factor scoring (accuracy, perfect bonus, speed bonus under 60s, XP).
 */

import {
  VerseToken,
  MaskedToken,
  BlankingStage,
  MaskPlaceholderStyle,
  WordValidationResult,
  DrillScoreResult,
  tokenizeVerse,
  generateMaskedTokens,
  validateWordDetailed,
  calculateDrillScore,
  getMaskPlaceholder,
} from './blanking';

export type DrillSessionStatus =
  | 'idle'
  | 'in_progress'
  | 'stage_completed'
  | 'drill_completed'
  | 'timed_out'
  | 'paused';

export interface DrillSessionConfig {
  verseText: string;
  initialStage?: BlankingStage;
  timeLimitSeconds?: number; // default 60s
  placeholderStyle?: MaskPlaceholderStyle; // default 'default'
  firstLettersOnly?: boolean;
}

export interface WordPlacementResult {
  success: boolean;
  isExactMatch: boolean;
  isNormalizedMatch: boolean;
  levenshteinDistance: number;
  token?: MaskedToken;
  stageCompleted: boolean;
  drillCompleted: boolean;
  score?: DrillScoreResult;
}

export interface DrillSessionState {
  verseText: string;
  tokens: VerseToken[];
  currentStage: BlankingStage;
  status: DrillSessionStatus;
  maskedTokens: MaskedToken[];
  wordBank: string[];
  activeBlankIndex: number | null;
  elapsedSeconds: number;
  timeLimitSeconds: number;
  placeholderStyle: MaskPlaceholderStyle;
  totalBlanks: number;
  correctCount: number;
  mistakes: number;
  currentStreak: number;
  maxStreak: number;
  hintsUsed: number;
  score: DrillScoreResult | null;
}

export class DrillSession {
  private verseText: string;
  private tokens: VerseToken[];
  private currentStage: BlankingStage;
  private status: DrillSessionStatus = 'idle';
  private maskedTokens: MaskedToken[] = [];
  private wordBank: string[] = [];
  private activeBlankIndex: number | null = null;
  private elapsedSeconds: number = 0;
  private timeLimitSeconds: number = 60;
  private placeholderStyle: MaskPlaceholderStyle = 'default';
  private firstLettersOnly: boolean = false;
  private mistakes: number = 0;
  private correctCount: number = 0;
  private currentStreak: number = 0;
  private maxStreak: number = 0;
  private hintsUsed: number = 0;
  private score: DrillScoreResult | null = null;

  constructor(config: DrillSessionConfig) {
    this.verseText = config.verseText;
    this.tokens = tokenizeVerse(config.verseText);
    this.currentStage = config.initialStage ?? 2;
    this.timeLimitSeconds = config.timeLimitSeconds ?? 60;
    this.placeholderStyle = config.placeholderStyle ?? 'default';
    this.firstLettersOnly = config.firstLettersOnly ?? false;

    this.setupStage(this.currentStage);
  }

  private setupStage(stage: BlankingStage): void {
    this.currentStage = stage;
    const { maskedTokens, wordBank } = generateMaskedTokens(this.tokens, stage);

    this.maskedTokens = maskedTokens.map((tok) => {
      if (!tok.isMasked) return tok;
      if (this.firstLettersOnly) {
        return {
          ...tok,
          firstLetter: tok.raw.charAt(0),
          maskLength: tok.raw.length,
        };
      }
      return tok;
    });

    this.wordBank = [...wordBank];
    this.activeBlankIndex = this.findNextUnfilledBlankIndex(0);
  }

  private findNextUnfilledBlankIndex(startIndex: number = 0): number | null {
    for (let i = startIndex; i < this.maskedTokens.length; i++) {
      const t = this.maskedTokens[i];
      if (t.isMasked && !t.isCorrect) {
        return i;
      }
    }
    for (let i = 0; i < startIndex; i++) {
      const t = this.maskedTokens[i];
      if (t.isMasked && !t.isCorrect) {
        return i;
      }
    }
    return null;
  }

  public getState(): DrillSessionState {
    const totalBlanks = this.maskedTokens.filter((t) => t.isMasked).length;
    return {
      verseText: this.verseText,
      tokens: this.tokens,
      currentStage: this.currentStage,
      status: this.status,
      maskedTokens: [...this.maskedTokens],
      wordBank: [...this.wordBank],
      activeBlankIndex: this.activeBlankIndex,
      elapsedSeconds: this.elapsedSeconds,
      timeLimitSeconds: this.timeLimitSeconds,
      placeholderStyle: this.placeholderStyle,
      totalBlanks,
      correctCount: this.correctCount,
      mistakes: this.mistakes,
      currentStreak: this.currentStreak,
      maxStreak: this.maxStreak,
      hintsUsed: this.hintsUsed,
      score: this.score,
    };
  }

  public start(): DrillSessionState {
    if (this.status === 'idle' || this.status === 'paused') {
      this.status = 'in_progress';
    }
    return this.getState();
  }

  public pause(): DrillSessionState {
    if (this.status === 'in_progress') {
      this.status = 'paused';
    }
    return this.getState();
  }

  public resume(): DrillSessionState {
    if (this.status === 'paused') {
      this.status = 'in_progress';
    }
    return this.getState();
  }

  public tick(secondsDelta: number = 1): DrillSessionState {
    if (this.status === 'in_progress') {
      this.elapsedSeconds += secondsDelta;
      if (this.elapsedSeconds >= this.timeLimitSeconds) {
        this.status = 'timed_out';
        this.score = this.computeScore();
      }
    }
    return this.getState();
  }

  public setElapsed(seconds: number): DrillSessionState {
    this.elapsedSeconds = Math.max(0, seconds);
    if (this.elapsedSeconds >= this.timeLimitSeconds && this.status === 'in_progress') {
      this.status = 'timed_out';
      this.score = this.computeScore();
    }
    return this.getState();
  }

  public selectBlank(indexOrTokenId: number | string): DrillSessionState {
    if (typeof indexOrTokenId === 'number') {
      if (
        indexOrTokenId >= 0 &&
        indexOrTokenId < this.maskedTokens.length &&
        this.maskedTokens[indexOrTokenId].isMasked
      ) {
        this.activeBlankIndex = indexOrTokenId;
      }
    } else {
      const idx = this.maskedTokens.findIndex((t) => t.id === indexOrTokenId && t.isMasked);
      if (idx !== -1) {
        this.activeBlankIndex = idx;
      }
    }
    return this.getState();
  }

  /**
   * Submits a user word (typed or tapped from bank) against the active or specified blank token.
   * Compares input with Romanian diacritic normalization (ă, â, î, ș, ț, legacy cedillas).
   */
  public submitWord(inputWord: string, targetTokenId?: string): WordPlacementResult {
    if (this.status === 'idle') {
      this.status = 'in_progress';
    }

    let targetIdx: number | null = null;
    if (targetTokenId) {
      targetIdx = this.maskedTokens.findIndex((t) => t.id === targetTokenId);
      if (targetIdx === -1 || !this.maskedTokens[targetIdx].isMasked) {
        return {
          success: false,
          isExactMatch: false,
          isNormalizedMatch: false,
          levenshteinDistance: 999,
          stageCompleted: false,
          drillCompleted: false,
        };
      }
    } else {
      targetIdx = this.activeBlankIndex ?? this.findNextUnfilledBlankIndex(0);
      if (targetIdx === null) {
        return {
          success: false,
          isExactMatch: false,
          isNormalizedMatch: false,
          levenshteinDistance: 0,
          stageCompleted: true,
          drillCompleted: this.currentStage === 4,
        };
      }
    }

    const token = this.maskedTokens[targetIdx];
    const validation: WordValidationResult = validateWordDetailed(inputWord, token.raw);

    if (validation.isValid) {
      // Correct placement
      token.userPlacedText = inputWord;
      token.isCorrect = true;
      this.correctCount += 1;
      this.currentStreak += 1;
      this.maxStreak = Math.max(this.maxStreak, this.currentStreak);

      // Remove placed word from bank if it was present
      const bankIdx = this.wordBank.findIndex(
        (w) => validateWordDetailed(w, inputWord).isValid
      );
      if (bankIdx !== -1) {
        this.wordBank.splice(bankIdx, 1);
      }

      // Check if all blanks in this stage are solved
      const remainingBlanks = this.maskedTokens.filter((t) => t.isMasked && !t.isCorrect);
      const isStageDone = remainingBlanks.length === 0;
      const isDrillDone = isStageDone && this.currentStage === 4;

      if (isDrillDone) {
        this.status = 'drill_completed';
        this.score = this.computeScore();
      } else if (isStageDone) {
        this.status = 'stage_completed';
      } else {
        this.activeBlankIndex = this.findNextUnfilledBlankIndex(targetIdx + 1);
      }

      return {
        success: true,
        isExactMatch: validation.isExactMatch,
        isNormalizedMatch: validation.isNormalizedMatch,
        levenshteinDistance: validation.levenshteinDistance,
        token,
        stageCompleted: isStageDone,
        drillCompleted: isDrillDone,
        score: this.score ?? undefined,
      };
    } else {
      // Incorrect placement
      this.mistakes += 1;
      this.currentStreak = 0;

      return {
        success: false,
        isExactMatch: false,
        isNormalizedMatch: false,
        levenshteinDistance: validation.levenshteinDistance,
        token,
        stageCompleted: false,
        drillCompleted: false,
      };
    }
  }

  /**
   * Undoes/clears a previously placed word on a blank token and returns it to the word bank.
   */
  public undoPlacement(tokenId: string): DrillSessionState {
    const idx = this.maskedTokens.findIndex((t) => t.id === tokenId && t.isMasked);
    if (idx !== -1) {
      const token = this.maskedTokens[idx];
      if (token.userPlacedText) {
        this.wordBank.push(token.userPlacedText);
        token.userPlacedText = undefined;
        if (token.isCorrect) {
          this.correctCount = Math.max(0, this.correctCount - 1);
        }
        token.isCorrect = undefined;
      }
      this.activeBlankIndex = idx;
      if (this.status === 'stage_completed' || this.status === 'drill_completed') {
        this.status = 'in_progress';
      }
    }
    return this.getState();
  }

  /**
   * Advances the drill to the next stage (e.g. Stage 2 -> 3 -> 4).
   */
  public advanceStage(targetStage?: BlankingStage): DrillSessionState {
    const nextStage = targetStage ?? (((this.currentStage % 4) + 1) as BlankingStage);
    this.setupStage(nextStage);
    this.status = 'in_progress';
    return this.getState();
  }

  /**
   * Provides the first letter hint for the active or target token.
   */
  public useFirstLetterHint(tokenId?: string): string | null {
    const targetIdx = tokenId
      ? this.maskedTokens.findIndex((t) => t.id === tokenId)
      : this.activeBlankIndex;

    if (targetIdx === null || targetIdx < 0 || targetIdx >= this.maskedTokens.length) {
      return null;
    }

    const token = this.maskedTokens[targetIdx];
    if (!token.isMasked) return null;

    this.hintsUsed += 1;
    return token.raw.charAt(0);
  }

  /**
   * Emergency reveal: auto-places correct word but counts as a mistake.
   */
  public revealWord(tokenId?: string): string | null {
    const targetIdx = tokenId
      ? this.maskedTokens.findIndex((t) => t.id === tokenId)
      : this.activeBlankIndex;

    if (targetIdx === null || targetIdx < 0 || targetIdx >= this.maskedTokens.length) {
      return null;
    }

    const token = this.maskedTokens[targetIdx];
    if (!token.isMasked) return null;

    this.mistakes += 1;
    this.currentStreak = 0;
    this.hintsUsed += 1;

    token.userPlacedText = token.raw;
    token.isCorrect = true;
    this.correctCount += 1;

    // Remove from bank
    const bIdx = this.wordBank.findIndex((w) => validateWordDetailed(w, token.raw).isValid);
    if (bIdx !== -1) {
      this.wordBank.splice(bIdx, 1);
    }

    const remaining = this.maskedTokens.filter((t) => t.isMasked && !t.isCorrect);
    if (remaining.length === 0) {
      if (this.currentStage === 4) {
        this.status = 'drill_completed';
        this.score = this.computeScore();
      } else {
        this.status = 'stage_completed';
      }
    } else {
      this.activeBlankIndex = this.findNextUnfilledBlankIndex(targetIdx + 1);
    }

    return token.raw;
  }

  /**
   * Finishes the drill prematurely or on completion and returns score metrics.
   */
  public finishDrill(): DrillScoreResult {
    this.status = 'drill_completed';
    this.score = this.computeScore();
    return this.score;
  }

  private computeScore(): DrillScoreResult {
    const totalBlanks = this.maskedTokens.filter((t) => t.isMasked).length;
    return calculateDrillScore({
      stage: this.currentStage,
      totalBlanks,
      mistakes: this.mistakes,
      secondsElapsed: this.elapsedSeconds,
    });
  }

  /**
   * Returns display string for a masked token according to active placeholder style.
   */
  public getPlaceholderForToken(token: VerseToken): string {
    return getMaskPlaceholder(token, this.placeholderStyle);
  }
}

/**
 * Factory helper to create a new DrillSession instance.
 */
export function createDrillSession(config: DrillSessionConfig): DrillSession {
  return new DrillSession(config);
}
