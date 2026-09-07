import {
  tokenizeVerse,
  generateMaskedTokens,
  normalizeDiacritics,
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

    // Advance to Stage 2 (30% recall)
    currentStage = 2;
    let stageResult = generateMaskedTokens(baseTokens, currentStage);
    let blanks = stageResult.maskedTokens.filter((t) => t.isMasked);
    expect(blanks.length).toBeGreaterThan(0);
    expect(stageResult.wordBank.length).toBe(blanks.length);

    // Simulate user tapping matching word chips for all blanks
    blanks.forEach((blankToken) => {
      const matchInBank = stageResult.wordBank.find(
        (word) => normalizeDiacritics(word) === normalizeDiacritics(blankToken.raw)
      );
      expect(matchInBank).toBeDefined();
    });

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

    // English text is tokenized cleanly
    const webTokens = tokenizeVerse(webVerse.text);
    expect(webTokens.length).toBeGreaterThan(0);
  });
});
