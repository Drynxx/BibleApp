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

describe("Blanking Engine", () => {
  describe("normalizeDiacritics", () => {
    it("normalizes standard Romanian diacritics correctly", () => {
      expect(normalizeDiacritics("Cuvântul")).toBe("cuvantul");
      expect(normalizeDiacritics("tăblița")).toBe("tablita");
      expect(normalizeDiacritics("părăsească")).toBe("paraseasca");
      expect(normalizeDiacritics("credincioșia")).toBe("credinciosia");
      expect(normalizeDiacritics("gât")).toBe("gat");
      expect(normalizeDiacritics("învățătură")).toBe("invatatura");
      expect(normalizeDiacritics("ÎMPOTRIVA")).toBe("impotriva");
    });

    it("normalizes legacy Romanian cedillas (ş, ţ, Ş, Ţ)", () => {
      expect(normalizeDiacritics("înştiinţare")).toBe("instiintare");
      expect(normalizeDiacritics("credincioşia")).toBe("credinciosia");
      expect(normalizeDiacritics("tăbliţa")).toBe("tablita");
      expect(normalizeDiacritics("ŞI")).toBe("si");
      expect(normalizeDiacritics("ŢARĂ")).toBe("tara");
    });

    it("handles quotes, apostrophes, dashes, and whitespace", () => {
      expect(normalizeDiacritics("  PROVERBS  ")).toBe("proverbs");
      expect(normalizeDiacritics("Faithful")).toBe("faithful");
      expect(normalizeDiacritics("‘Don’t’")).toBe("'don't'");
      expect(normalizeDiacritics("“Inscribed”")).toBe('"inscribed"');
      expect(normalizeDiacritics("auto–reset")).toBe("auto-reset");
    });

    it("handles empty or falsy strings safely", () => {
      expect(normalizeDiacritics("")).toBe("");
    });
  });

  describe("stripPunctuation", () => {
    it("removes common punctuation marks and leaves word text", () => {
      expect(stripPunctuation("Cuvântul,")).toBe("Cuvântul");
      expect(stripPunctuation("inimii!")).toBe("inimii");
      expect(stripPunctuation("„Domnul”")).toBe("Domnul");
      expect(stripPunctuation("«adevăr»")).toBe("adevăr");
      expect(stripPunctuation("")).toBe("");
    });
  });

  describe("validateWord", () => {
    it("returns true for matching words with or without diacritics", () => {
      expect(validateWord("Cuvântul", "cuvantul")).toBe(true);
      expect(validateWord("cuvantul", "Cuvântul")).toBe(true);
      expect(validateWord("tablita", "tăblița")).toBe(true);
      expect(validateWord("tăbliţa", "tăblița")).toBe(true); // cedilla vs comma
    });

    it("returns true regardless of case and punctuation", () => {
      expect(validateWord("PĂRĂSEASCĂ", "părăsească,")).toBe(true);
      expect(validateWord("  credincioșia.  ", "credinciosia")).toBe(true);
      expect(validateWord("LORD", "Lord")).toBe(true);
    });

    it("returns false for distinct words", () => {
      expect(validateWord("inimii", "sufletului")).toBe(false);
      expect(validateWord("păcat", "har")).toBe(false);
      expect(validateWord("", "Cuvântul")).toBe(false);
      expect(validateWord("Cuvântul", "")).toBe(false);
    });
  });

  describe("validateWordDetailed", () => {
    it("distinguishes exact match from normalized match", () => {
      const exact = validateWordDetailed("Cuvântul", "Cuvântul");
      expect(exact.isValid).toBe(true);
      expect(exact.isExactMatch).toBe(true);
      expect(exact.isNormalizedMatch).toBe(true);
      expect(exact.levenshteinDistance).toBe(0);

      const normalizedOnly = validateWordDetailed("cuvantul", "Cuvântul");
      expect(normalizedOnly.isValid).toBe(true);
      expect(normalizedOnly.isExactMatch).toBe(false);
      expect(normalizedOnly.isNormalizedMatch).toBe(true);
      expect(normalizedOnly.levenshteinDistance).toBe(0);
    });

    it("computes Levenshtein edit distance for typos", () => {
      const typo = validateWordDetailed("cuvntul", "Cuvântul");
      expect(typo.isValid).toBe(false);
      expect(typo.levenshteinDistance).toBe(1);

      const diff = validateWordDetailed("paine", "vin");
      expect(diff.isValid).toBe(false);
      expect(diff.levenshteinDistance).toBeGreaterThan(2);
    });
  });

  describe("levenshteinDistance", () => {
    it("calculates edit distance correctly", () => {
      expect(levenshteinDistance("kitten", "sitting")).toBe(3);
      expect(levenshteinDistance("book", "back")).toBe(2);
      expect(levenshteinDistance("", "test")).toBe(4);
      expect(levenshteinDistance("test", "")).toBe(4);
      expect(levenshteinDistance("same", "same")).toBe(0);
    });
  });

  describe("calculateDrillScore", () => {
    it("awards base XP and speed bonus when under 60 seconds with no mistakes", () => {
      const result = calculateDrillScore({
        stage: 2,
        totalBlanks: 5,
        mistakes: 0,
        secondsElapsed: 42,
      });

      expect(result.accuracy).toBe(100);
      expect(result.perfect).toBe(true);
      expect(result.speedBonus).toBe(true);
      expect(result.xpEarned).toBe(15 + 10 + 5); // base 15 + perfect 10 + speed 5 = 30
    });

    it("calculates accurate percentage when mistakes are made", () => {
      const result = calculateDrillScore({
        stage: 3,
        totalBlanks: 10,
        mistakes: 2,
        secondsElapsed: 75,
      });

      expect(result.accuracy).toBe(80);
      expect(result.perfect).toBe(false);
      expect(result.speedBonus).toBe(false);
      expect(result.xpEarned).toBe(25); // base 25, no bonuses
    });

    it("handles zero blanks safely", () => {
      const result = calculateDrillScore({
        stage: 1,
        totalBlanks: 0,
        mistakes: 0,
        secondsElapsed: 30,
      });

      expect(result.accuracy).toBe(100);
      expect(result.xpEarned).toBeGreaterThan(0);
    });
  });

  describe("getMaskPlaceholder", () => {
    const dummyToken: VerseToken = {
      id: "tok-1",
      raw: "Cuvântul",
      clean: "cuvantul",
      display: "Cuvântul",
      isPunctuation: false,
      isKeyword: true,
    };

    it("returns standard 4-underscore default", () => {
      expect(getMaskPlaceholder(dummyToken, "default")).toBe("____");
    });

    it("returns first-letter hint format", () => {
      expect(getMaskPlaceholder(dummyToken, "firstLetter")).toBe("C_______");
    });

    it("returns exact-length underscores", () => {
      expect(getMaskPlaceholder(dummyToken, "exactLength")).toBe("________");
    });
  });

  describe("tokenizeVerse", () => {
    it("tokenizes Romanian verse preserving diacritics, cedillas, and punctuation", () => {
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

    it("tokenizes Romanian verse with legacy cedillas as words not punctuation", () => {
      const verse = "Domnul este înştiinţat de credincioşia ta.";
      const tokens = tokenizeVerse(verse);
      const wordWithCedilla = tokens.find((t) => t.raw === "înştiinţat");

      expect(wordWithCedilla).toBeDefined();
      expect(wordWithCedilla?.isPunctuation).toBe(false);
      expect(wordWithCedilla?.clean).toBe("instiintat");
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

    it("Stage 2 masks approximately 30% of words and provides firstLetter hints", () => {
      const { maskedTokens, wordBank } = generateMaskedTokens(tokens, 2);
      const wordTokens = tokens.filter((t) => !t.isPunctuation);
      const maskedList = maskedTokens.filter((t) => t.isMasked);

      const expectedMask = Math.floor(wordTokens.length * 0.3);
      expect(maskedList.length).toBe(expectedMask);
      expect(wordBank.length).toBe(expectedMask);

      // Punctuation should never be masked
      const maskedPunctuation = maskedTokens.filter((t) => t.isPunctuation && t.isMasked);
      expect(maskedPunctuation.length).toBe(0);

      // Masked tokens have firstLetter and maskLength populated
      maskedList.forEach((token) => {
        expect(token.firstLetter).toBe(token.raw.charAt(0));
        expect(token.maskLength).toBe(token.raw.length);
      });
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
