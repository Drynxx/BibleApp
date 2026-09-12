import {
  tokenizeVerse,
  generateMaskedTokens,
  normalizeDiacritics,
  validateWord,
  calculateDrillScore,
  BlankingStage,
} from "@/engine/blanking";
import { verseRepository } from "@/services/db/verseRepository";

describe("Drill Flow Integration", () => {
  it("simulates full 4-stage drill progression to completion", () => {
    const verse = verseRepository.getById("v-1");
    expect(verse).toBeDefined();

    const baseTokens = tokenizeVerse(verse!.text);
    expect(baseTokens.length).toBeGreaterThan(5);

    // Stage 1: Inscribe / Read
    let currentStage: BlankingStage = 1;
    let { maskedTokens, wordBank } = generateMaskedTokens(baseTokens, currentStage);
    expect(maskedTokens.filter((t) => t.isMasked).length).toBe(0);
    expect(wordBank.length).toBe(0);

    const stage1Score = calculateDrillScore({
      stage: 1,
      totalBlanks: 0,
      mistakes: 0,
      secondsElapsed: 15,
    });
    expect(stage1Score.xpEarned).toBeGreaterThanOrEqual(10);
    expect(stage1Score.perfect).toBe(true);

    // Advance to Stage 2 (30% recall)
    currentStage = 2;
    let stageResult = generateMaskedTokens(baseTokens, currentStage);
    let blanks = stageResult.maskedTokens.filter((t) => t.isMasked);
    expect(blanks.length).toBeGreaterThan(0);
    expect(stageResult.wordBank.length).toBe(blanks.length);

    // Verify firstLetter hint is populated on all masked tokens
    blanks.forEach((blankToken) => {
      expect(blankToken.firstLetter).toBeDefined();
      expect(blankToken.firstLetter).toBe(blankToken.raw.charAt(0));
    });

    // Simulate user tapping matching word chips for all blanks using validateWord
    blanks.forEach((blankToken) => {
      const matchInBank = stageResult.wordBank.find((word) =>
        validateWord(word, blankToken.raw)
      );
      expect(matchInBank).toBeDefined();
      expect(validateWord(matchInBank!, blankToken.raw)).toBe(true);
    });

    const stage2Score = calculateDrillScore({
      stage: 2,
      totalBlanks: blanks.length,
      mistakes: 0,
      secondsElapsed: 28,
    });
    expect(stage2Score.speedBonus).toBe(true);
    expect(stage2Score.xpEarned).toBe(30); // 15 base + 10 perfect + 5 speed

    // Advance to Stage 3 (70% deep recall)
    currentStage = 3;
    stageResult = generateMaskedTokens(baseTokens, currentStage);
    blanks = stageResult.maskedTokens.filter((t) => t.isMasked);
    expect(blanks.length).toBeGreaterThan(stageResult.maskedTokens.filter((t) => !t.isPunctuation).length * 0.5);

    // Advance to Stage 4 (100% mastery)
    currentStage = 4;
    stageResult = generateMaskedTokens(baseTokens, currentStage);
    const nonPunctuationTokens = baseTokens.filter((t) => !t.isPunctuation);
    blanks = stageResult.maskedTokens.filter((t) => t.isMasked);
    expect(blanks.length).toBe(nonPunctuationTokens.length);

    // Verify all words in bank match blanks
    const sortedBank = [...stageResult.wordBank].sort();
    const sortedBlanks = blanks.map((b) => b.raw).sort();
    expect(sortedBank).toEqual(sortedBlanks);

    const stage4Score = calculateDrillScore({
      stage: 4,
      totalBlanks: blanks.length,
      mistakes: 1,
      secondsElapsed: 55,
    });
    expect(stage4Score.speedBonus).toBe(true);
    expect(stage4Score.perfect).toBe(false);
    expect(stage4Score.accuracy).toBeGreaterThan(80);
  });

  it("handles translation toggle between Romanian (VDC) and English (WEB)", () => {
    const vdcVerse = verseRepository.getAll("VDC")[0];
    const webVerse = verseRepository.getAll("WEB")[0];

    expect(vdcVerse.translation).toBe("VDC");
    expect(webVerse.translation).toBe("WEB");

    // Romanian text has diacritics
    const vdcTokens = tokenizeVerse(vdcVerse.text);
    const hasDiacritics = vdcTokens.some((t) => /[ăîșțâĂÎȘȚÂ]/.test(t.raw));
    expect(hasDiacritics).toBe(true);

    // Verify diacritic tolerance in validation
    const vdcWords = vdcTokens.filter((t) => !t.isPunctuation);
    vdcWords.forEach((token) => {
      const stripped = normalizeDiacritics(token.raw);
      expect(validateWord(stripped, token.raw)).toBe(true);
    });

    // English text is tokenized cleanly
    const webTokens = tokenizeVerse(webVerse.text);
    expect(webTokens.length).toBeGreaterThan(0);
  });
});
