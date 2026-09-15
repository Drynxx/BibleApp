export interface VerseToken {
  id: string;
  raw: string;
  clean: string;
  display: string;
  isPunctuation: boolean;
  isKeyword: boolean;
  firstLetter?: string;
  maskLength?: number;
}

export interface MaskedToken extends VerseToken {
  isMasked: boolean;
  firstLetter?: string;
  maskLength?: number;
  userPlacedText?: string;
  isCorrect?: boolean;
}

export type BlankingStage = 1 | 2 | 3 | 4;

export type MaskPlaceholderStyle = 'default' | 'firstLetter' | 'exactLength';

export interface WordValidationResult {
  isValid: boolean;
  isExactMatch: boolean;
  isNormalizedMatch: boolean;
  levenshteinDistance: number;
}

export interface DrillScoreInput {
  stage: BlankingStage;
  totalBlanks: number;
  mistakes: number;
  secondsElapsed: number;
}

export interface DrillScoreResult {
  accuracy: number;
  perfect: boolean;
  speedBonus: boolean;
  xpEarned: number;
}

/**
 * Normalizes Romanian diacritics and legacy cedillas:
 * ă, â -> a
 * î -> i
 * ș, ş -> s
 * ț, ţ -> t
 * Also normalizes quotes, apostrophes, dashes, and trims whitespace.
 */
export function normalizeDiacritics(text: string): string {
  if (!text) return "";

  let cleaned = text
    .replace(/[\u2018\u2019\u201a\u201b]/g, "'")
    .replace(/[\u201c\u201d\u201e\u201f«»]/g, '"')
    .replace(/[\u2013\u2014]/g, "-");

  // Decompose Unicode combining characters
  cleaned = cleaned
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  // Safety mappings for any non-decomposed legacy Romanian characters
  return cleaned
    .replace(/[ăâ]/g, "a")
    .replace(/[î]/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t");
}

/**
 * Strips common punctuation marks and leaves word text.
 */
export function stripPunctuation(text: string): string {
  if (!text) return "";
  return text
    .replace(/^[„«"'“‘(\s]+|[!?:;.,„”»"'’)\s]+$/gu, "")
    .replace(/[„”«»"']/gu, "")
    .trim();
}

/**
 * Calculates the Levenshtein edit distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Compares user input to target word with full Romanian diacritic and case tolerance.
 */
export function validateWord(input: string, target: string): boolean {
  if (!input || !target) return false;
  const cleanInput = stripPunctuation(input);
  const cleanTarget = stripPunctuation(target);
  if (!cleanInput || !cleanTarget) return false;
  return normalizeDiacritics(cleanInput) === normalizeDiacritics(cleanTarget);
}

/**
 * Detailed word validation providing exact match, normalized match, and Levenshtein distance.
 */
export function validateWordDetailed(input: string, target: string): WordValidationResult {
  if (!input || !target) {
    const dist = levenshteinDistance(
      normalizeDiacritics(input || ""),
      normalizeDiacritics(target || "")
    );
    return {
      isValid: false,
      isExactMatch: false,
      isNormalizedMatch: false,
      levenshteinDistance: dist,
    };
  }

  const cleanInput = stripPunctuation(input);
  const cleanTarget = stripPunctuation(target);

  const isExactMatch = cleanInput === cleanTarget;
  const normInput = normalizeDiacritics(cleanInput);
  const normTarget = normalizeDiacritics(cleanTarget);

  const isNormalizedMatch = normInput === normTarget && normInput.length > 0;
  const dist = levenshteinDistance(normInput, normTarget);

  return {
    isValid: isNormalizedMatch,
    isExactMatch,
    isNormalizedMatch,
    levenshteinDistance: dist,
  };
}

/**
 * Generates display placeholder string for a masked token.
 */
export function getMaskPlaceholder(
  token: VerseToken,
  style: MaskPlaceholderStyle = "default"
): string {
  const len = token.raw.length;
  switch (style) {
    case "firstLetter":
      return token.raw.charAt(0) + "_".repeat(Math.max(0, len - 1));
    case "exactLength":
      return "_".repeat(len);
    case "default":
    default:
      return "____";
  }
}

/**
 * Calculates score, accuracy, bonuses, and XP earned for a drill session.
 */
export function calculateDrillScore(input: DrillScoreInput): DrillScoreResult {
  const { stage, totalBlanks, mistakes, secondsElapsed } = input;

  const accuracy =
    totalBlanks === 0
      ? 100
      : Math.max(0, Math.round(((totalBlanks - mistakes) / totalBlanks) * 100));

  const perfect = mistakes === 0;
  const speedBonus = secondsElapsed <= 60;

  // Base XP by stage: Stage 1 = 10, Stage 2 = 15, Stage 3 = 25, Stage 4 = 40
  const baseXPMap: Record<BlankingStage, number> = {
    1: 10,
    2: 15,
    3: 25,
    4: 40,
  };
  const baseXP = baseXPMap[stage] ?? 10;

  const perfectBonus = perfect ? 10 : 0;
  const speedBonusXP = speedBonus ? 5 : 0;

  const xpEarned = baseXP + perfectBonus + speedBonusXP;

  return {
    accuracy,
    perfect,
    speedBonus,
    xpEarned,
  };
}

/**
 * Splits verse into word and punctuation tokens, respecting Romanian diacritics and cedillas.
 */
export function tokenizeVerse(verseText: string): VerseToken[] {
  if (!verseText) return [];

  const tokenRegex = /([a-zA-Z0-9ăîșțâĂÎȘȚÂşţŞŢ]+)|([^\s\wăîșțâĂÎȘȚÂşţŞŢ])/g;
  const tokens: VerseToken[] = [];
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = tokenRegex.exec(verseText)) !== null) {
    const raw = match[0];
    const isPunct = !/^[a-zA-Z0-9ăîșțâĂÎȘȚÂşţŞŢ]+$/.test(raw);

    tokens.push({
      id: `tok-${index++}`,
      raw,
      clean: normalizeDiacritics(raw),
      display: raw,
      isPunctuation: isPunct,
      isKeyword: raw.length > 4 && !isPunct,
    });
  }

  return tokens;
}

/**
 * Generates masked tokens and a scrambled word bank for a given stage.
 * Stage 1: 0% masked (full text read)
 * Stage 2: 30% masked (with firstLetter hint)
 * Stage 3: 70% masked
 * Stage 4: 100% masked (Mastery)
 */
export function generateMaskedTokens(
  tokens: VerseToken[],
  stage: BlankingStage
): { maskedTokens: MaskedToken[]; wordBank: string[] } {
  let maskRatio = 0;
  if (stage === 2) maskRatio = 0.3;
  if (stage === 3) maskRatio = 0.7;
  if (stage === 4) maskRatio = 1.0;

  const eligibleWordIndices = tokens
    .map((t, idx) => (!t.isPunctuation ? idx : -1))
    .filter((idx) => idx !== -1);

  const numToMask = Math.floor(eligibleWordIndices.length * maskRatio);
  const selectedMaskIndices = new Set<number>();

  if (numToMask >= eligibleWordIndices.length) {
    eligibleWordIndices.forEach((idx) => selectedMaskIndices.add(idx));
  } else if (numToMask > 0) {
    const step = eligibleWordIndices.length / numToMask;
    for (let i = 0; i < numToMask; i++) {
      let targetIdx = Math.min(
        Math.floor(i * step + step / 2),
        eligibleWordIndices.length - 1
      );
      while (selectedMaskIndices.has(eligibleWordIndices[targetIdx])) {
        targetIdx = (targetIdx + 1) % eligibleWordIndices.length;
      }
      selectedMaskIndices.add(eligibleWordIndices[targetIdx]);
    }
  }

  const bank: string[] = [];
  const maskedTokens: MaskedToken[] = tokens.map((token, idx) => {
    const isMasked = selectedMaskIndices.has(idx);
    if (isMasked) {
      bank.push(token.raw);
      return {
        ...token,
        isMasked: true,
        firstLetter: token.raw.charAt(0),
        maskLength: token.raw.length,
        userPlacedText: undefined,
        isCorrect: undefined,
      };
    }
    return {
      ...token,
      isMasked: false,
      userPlacedText: undefined,
      isCorrect: undefined,
    };
  });

  // Scramble word bank
  const scrambledBank = [...bank].sort(() => 0.5 - Math.random());

  return {
    maskedTokens,
    wordBank: scrambledBank,
  };
}
