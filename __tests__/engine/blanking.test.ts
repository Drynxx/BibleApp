import {
  tokenizeVerse,
  normalizeDiacritics,
  generateMaskedTokens,
  VerseToken,
} from "@/engine/blanking";

describe("Blanking Engine", () => {
  describe("normalizeDiacritics", () => {
    it("normalizes Romanian diacritics correctly", () => {
      expect(normalizeDiacritics("Cuvântul")).toBe("cuvantul");
      expect(normalizeDiacritics("tăblița")).toBe("tablita");
      expect(normalizeDiacritics("părăsească")).toBe("paraseasca");
      expect(normalizeDiacritics("credincioșia")).toBe("credinciosia");
      expect(normalizeDiacritics("gât")).toBe("gat");
      expect(normalizeDiacritics("învățătură")).toBe("invatatura");
    });

    it("handles mixed case, whitespace, and English words", () => {
      expect(normalizeDiacritics("  PROVERBS  ")).toBe("proverbs");
      expect(normalizeDiacritics("Faithful")).toBe("faithful");
    });
  });

  describe("tokenizeVerse", () => {
    it("tokenizes Romanian verse preserving diacritics and punctuation", () => {
      const verse = "Să nu te părăsească bunătatea și credincioșia: leagă-le la gât, scrie-le pe tăblița inimii tale!";
      const tokens = tokenizeVerse(verse);

      expect(tokens.length).toBeGreaterThan(10);

      // Verify word token
      const firstWord = tokens[0];
      expect(firstWord.raw).toBe("Să");
      expect(firstWord.clean).toBe("sa");
      expect(firstWord.isPunctuation).toBe(false);

      // Verify punctuation tokens exist
      const colon = tokens.find((t) => t.raw === ":");
      expect(colon).toBeDefined();
      expect(colon?.isPunctuation).toBe(true);

      const exclamation = tokens.find((t) => t.raw === "!");
      expect(exclamation).toBeDefined();
      expect(exclamation?.isPunctuation).toBe(true);
    });

    it("tokenizes English verse with commas and periods", () => {
      const verse = "Don't let kindness and truth forsake you. Bind them around your neck.";
      const tokens = tokenizeVerse(verse);

      expect(tokens.length).toBeGreaterThan(5);
      const period = tokens.find((t) => t.raw === ".");
      expect(period).toBeDefined();
      expect(period?.isPunctuation).toBe(true);
    });
  });

  describe("generateMaskedTokens", () => {
    const verse = "Strâng Cuvântul Tău în inima mea, ca să nu păcătuiesc împotriva Ta!";
    let tokens: VerseToken[];

    beforeEach(() => {
      tokens = tokenizeVerse(verse);
    });

    it("Stage 1 masks 0% of words (full read)", () => {
      const { maskedTokens, wordBank } = generateMaskedTokens(tokens, 1);
      const maskedCount = maskedTokens.filter((t) => t.isMasked).length;

      expect(maskedCount).toBe(0);
      expect(wordBank.length).toBe(0);
    });

    it("Stage 2 masks approximately 30% of words", () => {
      const { maskedTokens, wordBank } = generateMaskedTokens(tokens, 2);
      const wordTokens = tokens.filter((t) => !t.isPunctuation);
      const maskedCount = maskedTokens.filter((t) => t.isMasked).length;

      const expectedMask = Math.floor(wordTokens.length * 0.3);
      expect(maskedCount).toBe(expectedMask);
      expect(wordBank.length).toBe(expectedMask);

      // Punctuation should never be masked
      const maskedPunctuation = maskedTokens.filter((t) => t.isPunctuation && t.isMasked);
      expect(maskedPunctuation.length).toBe(0);
    });

    it("Stage 3 masks approximately 70% of words", () => {
      const { maskedTokens, wordBank } = generateMaskedTokens(tokens, 3);
      const wordTokens = tokens.filter((t) => !t.isPunctuation);
      const maskedCount = maskedTokens.filter((t) => t.isMasked).length;

      const expectedMask = Math.floor(wordTokens.length * 0.7);
      expect(maskedCount).toBe(expectedMask);
      expect(wordBank.length).toBe(expectedMask);
    });

    it("Stage 4 masks 100% of words (Mastery)", () => {
      const { maskedTokens, wordBank } = generateMaskedTokens(tokens, 4);
      const wordTokens = tokens.filter((t) => !t.isPunctuation);
      const maskedCount = maskedTokens.filter((t) => t.isMasked).length;

      expect(maskedCount).toBe(wordTokens.length);
      expect(wordBank.length).toBe(wordTokens.length);
    });
  });
});
