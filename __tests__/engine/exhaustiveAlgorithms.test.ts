import {
  tokenizeVerse,
  normalizeDiacritics,
  stripPunctuation,
  validateWord,
  validateWordDetailed,
  levenshteinDistance,
  calculateDrillScore,
  getMaskPlaceholder,
  generateMaskedTokens,
  VerseToken,
} from "@/engine/blanking";
import { recallEngine } from "@/services/practice/recallEngine";

describe("Exhaustive Core Logic & Algorithm Tests", () => {
  describe("Diacritic Handling & Romanian Normalization", () => {
    const romanianPairs: [string, string][] = [
      ["Cuvânt", "cuvant"],
      ["CUVÂNT", "cuvant"],
      ["început", "inceput"],
      ["ÎNCEPUT", "inceput"],
      ["tăbliță", "tablita"],
      ["TĂBLIȚĂ", "tablita"],
      ["tăbliţă", "tablita"], // legacy cedilla
      ["TĂBLIŢĂ", "tablita"],
      ["credincioșie", "credinciosie"],
      ["credincioşie", "credinciosie"],
      ["învățătură", "invatatura"],
      ["părăsească", "paraseasca"],
      ["fără", "fara"],
      ["adevăr", "adevar"],
      ["viață", "viata"],
      ["sânge", "sange"],
      ["pământ", "pamant"],
      ["împărat", "imparat"],
    ];

    it("normalizes all Romanian diacritics and legacy cedillas correctly", () => {
      romanianPairs.forEach(([input, expected]) => {
        expect(normalizeDiacritics(input)).toBe(expected);
      });
    });

    it("normalizes typographic punctuation, dashes, and smart quotes", () => {
      expect(normalizeDiacritics("“Pacea”")).toBe('"pacea"');
      expect(normalizeDiacritics("‘Har’")).toBe("'har'");
      expect(normalizeDiacritics("auto—save")).toBe("auto-save");
      expect(normalizeDiacritics("  Dumnezeu  ")).toBe("dumnezeu");
      expect(normalizeDiacritics("")).toBe("");
    });
  });

  describe("Punctuation Stripping & Boundary Hygiene", () => {
    it("strips Romanian quotation marks, guillemets, and standard punctuation", () => {
      expect(stripPunctuation("„Domnul”")).toBe("Domnul");
      expect(stripPunctuation("«Dumnezeu»")).toBe("Dumnezeu");
      expect(stripPunctuation("inimii,")).toBe("inimii");
      expect(stripPunctuation("slavă!")).toBe("slavă");
      expect(stripPunctuation("rugăciune?")).toBe("rugăciune");
      expect(stripPunctuation("(credință)")).toBe("credință");
      expect(stripPunctuation("")).toBe("");
    });
  });

  describe("Word Comparison & Immediate Boolean Feedback", () => {
    it("validates words ignoring case, diacritics, and attached punctuation", () => {
      expect(validateWord("Cuvântul,", "cuvantul")).toBe(true);
      expect(validateWord("credincioşia", "credincioșia!")).toBe(true);
      expect(validateWord("  tăblița  ", "tablita")).toBe(true);
      expect(validateWord("PACE", "pace.")).toBe(true);
      expect(validateWord("Dumnezeu", "dumnezeu")).toBe(true);
    });

    it("rejects false positives and distinct words", () => {
      expect(validateWord("har", "pace")).toBe(false);
      expect(validateWord("credință", "nădejde")).toBe(false);
      expect(validateWord("", "test")).toBe(false);
      expect(validateWord("test", "")).toBe(false);
    });

    it("detailed validation provides accurate metrics and distance", () => {
      const exact = validateWordDetailed("Pace", "Pace");
      expect(exact.isValid).toBe(true);
      expect(exact.isExactMatch).toBe(true);
      expect(exact.isNormalizedMatch).toBe(true);
      expect(exact.levenshteinDistance).toBe(0);

      const normalized = validateWordDetailed("pace", "Pace");
      expect(normalized.isValid).toBe(true);
      expect(normalized.isExactMatch).toBe(false);
      expect(normalized.isNormalizedMatch).toBe(true);
      expect(normalized.levenshteinDistance).toBe(0);

      const typo = validateWordDetailed("pce", "pace");
      expect(typo.isValid).toBe(false);
      expect(typo.levenshteinDistance).toBe(1);
    });
  });

  describe("Drill Scoring Engine & Progression", () => {
    it("calculates correct base XP and speed bonus across all 4 stages", () => {
      // Stage 1 (Read / Inscribe)
      const s1 = calculateDrillScore({ stage: 1, totalBlanks: 0, mistakes: 0, secondsElapsed: 15 });
      expect(s1.accuracy).toBe(100);
      expect(s1.perfect).toBe(true);
      expect(s1.speedBonus).toBe(true);
      expect(s1.xpEarned).toBe(10 + 10 + 5); // 25

      // Stage 2 (30% recall)
      const s2 = calculateDrillScore({ stage: 2, totalBlanks: 4, mistakes: 0, secondsElapsed: 40 });
      expect(s2.accuracy).toBe(100);
      expect(s2.perfect).toBe(true);
      expect(s2.speedBonus).toBe(true);
      expect(s2.xpEarned).toBe(15 + 10 + 5); // 30

      // Stage 3 (70% recall)
      const s3 = calculateDrillScore({ stage: 3, totalBlanks: 10, mistakes: 2, secondsElapsed: 55 });
      expect(s3.accuracy).toBe(80);
      expect(s3.perfect).toBe(false);
      expect(s3.speedBonus).toBe(true);
      expect(s3.xpEarned).toBe(25 + 0 + 5); // 30

      // Stage 4 (100% mastery, slow)
      const s4 = calculateDrillScore({ stage: 4, totalBlanks: 10, mistakes: 1, secondsElapsed: 85 });
      expect(s4.accuracy).toBe(90);
      expect(s4.perfect).toBe(false);
      expect(s4.speedBonus).toBe(false);
      expect(s4.xpEarned).toBe(40); // 40 base
    });
  });

  describe("Mask Placeholders & Formatting", () => {
    const sampleToken: VerseToken = {
      id: "tok-test",
      raw: "credincioșia",
      clean: "credinciosia",
      display: "credincioșia",
      isPunctuation: false,
      isKeyword: true,
    };

    it("renders default, first-letter, and exact-length placeholders", () => {
      expect(getMaskPlaceholder(sampleToken, "default")).toBe("____");
      expect(getMaskPlaceholder(sampleToken, "firstLetter")).toBe("c___________");
      expect(getMaskPlaceholder(sampleToken, "exactLength")).toBe("____________");
    });
  });

  describe("Tokenization & Progressive Blanking", () => {
    const text = "Fiindcă atât de mult a iubit Dumnezeu lumea, că a dat pe singurul Lui Fiu!";

    it("tokenizes Romanian scripture preserving letters, punctuation, and diacritics", () => {
      const tokens = tokenizeVerse(text);
      expect(tokens.length).toBeGreaterThan(12);

      const words = tokens.filter((t) => !t.isPunctuation);
      const puncts = tokens.filter((t) => t.isPunctuation);

      expect(words.length).toBeGreaterThan(10);
      expect(puncts.length).toBeGreaterThanOrEqual(2); // comma and exclamation
      expect(words[0].clean).toBe("fiindca");
    });

    it("progressively blanks words according to difficulty stages", () => {
      const tokens = tokenizeVerse(text);
      const wordCount = tokens.filter((t) => !t.isPunctuation).length;

      // Stage 1: 0%
      const stage1 = generateMaskedTokens(tokens, 1);
      expect(stage1.maskedTokens.filter((t) => t.isMasked).length).toBe(0);
      expect(stage1.wordBank.length).toBe(0);

      // Stage 2: 30%
      const stage2 = generateMaskedTokens(tokens, 2);
      const s2Blanks = stage2.maskedTokens.filter((t) => t.isMasked);
      expect(s2Blanks.length).toBe(Math.floor(wordCount * 0.3));
      expect(stage2.wordBank.length).toBe(s2Blanks.length);

      // Stage 3: 70%
      const stage3 = generateMaskedTokens(tokens, 3);
      const s3Blanks = stage3.maskedTokens.filter((t) => t.isMasked);
      expect(s3Blanks.length).toBe(Math.floor(wordCount * 0.7));
      expect(stage3.wordBank.length).toBe(s3Blanks.length);

      // Stage 4: 100%
      const stage4 = generateMaskedTokens(tokens, 4);
      const s4Blanks = stage4.maskedTokens.filter((t) => t.isMasked);
      expect(s4Blanks.length).toBe(wordCount);
      expect(stage4.wordBank.length).toBe(wordCount);
    });
  });

  describe("RecallEngine Re-export & Practice Generation", () => {
    it("generates dynamic recall practice with distractors and diacritic filtering", () => {
      const practice = recallEngine.generateRecallPractice(
        "Domnul este Păstorul meu: nu voi duce lipsă de nimic.",
        2,
        "ro"
      );

      expect(practice.length).toBeGreaterThan(0);
      const blanks = practice.filter((p) => p.type === "blank");
      expect(blanks.length).toBeLessThanOrEqual(2);

      blanks.forEach((blank) => {
        expect(blank.options).toBeDefined();
        expect(blank.options?.length).toBe(4);
        expect(blank.options?.includes(blank.value)).toBe(true);
      });
    });
  });
});
