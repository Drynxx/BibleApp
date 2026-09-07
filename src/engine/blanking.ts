export interface VerseToken {
  id: string;
  raw: string;
  clean: string;
  display: string;
  isPunctuation: boolean;
  isKeyword: boolean;
}

export interface MaskedToken extends VerseToken {
  isMasked: boolean;
  userPlacedText?: string;
  isCorrect?: boolean;
}

export type BlankingStage = 1 | 2 | 3 | 4;

/**
 * Normalizes Romanian diacritics:
 * ă, â -> a
 * î -> i
 * ș -> s
 * ț -> t
 */
export function normalizeDiacritics(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Splits verse into word and punctuation tokens.
 */
export function tokenizeVerse(verseText: string): VerseToken[] {
  // Matches letters (including Romanian diacritics) or punctuation/symbols
  const tokenRegex = /([a-zA-ZăîșțâĂÎȘȚÂ]+)|([^\s\w]+)/g;
  const tokens: VerseToken[] = [];
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = tokenRegex.exec(verseText)) !== null) {
    const raw = match[0];
    const isPunctuation = !/^[a-zA-ZăîșțâĂÎȘȚÂ]+$/.test(raw);

    tokens.push({
      id: `tok-${index++}`,
      raw,
      clean: normalizeDiacritics(raw),
      display: raw,
      isPunctuation,
      isKeyword: raw.length > 4 && !isPunctuation,
    });
  }

  return tokens;
}

/**
 * Generates masked tokens and a scrambled word bank for a given stage.
 * Stage 1: 0% masked (full text read)
 * Stage 2: 30% masked
 * Stage 3: 70% masked
 * Stage 4: 100% masked (mastery)
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

  // Deterministic spread across words: pick evenly distributed indices
  const step = eligibleWordIndices.length / (numToMask || 1);
  const selectedMaskIndices = new Set<number>();

  if (numToMask === eligibleWordIndices.length) {
    eligibleWordIndices.forEach((idx) => selectedMaskIndices.add(idx));
  } else if (numToMask > 0) {
    for (let i = 0; i < numToMask; i++) {
      const targetWordIdx = Math.min(
        Math.floor(i * step + step / 2),
        eligibleWordIndices.length - 1
      );
      selectedMaskIndices.add(eligibleWordIndices[targetWordIdx]);
    }
  }

  const bank: string[] = [];
  const maskedTokens: MaskedToken[] = tokens.map((token, idx) => {
    const isMasked = selectedMaskIndices.has(idx);
    if (isMasked) {
      bank.push(token.raw);
    }
    return {
      ...token,
      isMasked,
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
