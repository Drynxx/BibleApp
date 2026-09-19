export type RecallToken = {
  type: 'text' | 'blank';
  value: string;
  options?: string[]; // Includes the correct value + 3 distractors
};

const STOP_WORDS = new Set([
  'the', 'and', 'of', 'to', 'unto', 'hath', 'thou', 'a', 'in', 'that', 'is', 'for', 'it', 'with', 'as', 'he', 'his', 'they', 'be', 'not', 'by', 'but', 'have', 'from', 'which', 'their', 'was', 'were', 'all', 'are', 'shall', 'will', 'this', 'on', 'at', 'or', 'an'
]);

const DISTRACTOR_POOL = [
  'faith', 'love', 'hope', 'peace', 'grace', 'mercy', 'truth', 'light', 'spirit', 'flesh', 'heart', 'soul', 'mind', 'strength', 'word', 'life', 'death', 'sin', 'righteousness', 'salvation', 'heaven', 'earth', 'water', 'fire', 'bread', 'wine', 'blood', 'body', 'church', 'temple', 'king', 'lord', 'servant', 'master', 'brother', 'sister', 'father', 'mother', 'son', 'daughter', 'day', 'night', 'morning', 'evening', 'time', 'eternity'
];

export class RecallEngine {
  /**
   * Generates an active recall practice session from raw verse text.
   * @param rawText The raw verse text.
   * @param difficultyLevel Determines how many words become blanks. (e.g., 1 = 1 blank, 2 = 2 blanks, etc.)
   */
  static generateRecallPractice(rawText: string, difficultyLevel: number): RecallToken[] {
    // 1. Tokenize preserving punctuation attached to words or as separate tokens?
    // Let's split by regex that captures words and non-words separately.
    // Example: "For God so loved the world," -> ["For", " ", "God", " ", "so", " ", "loved", " ", "the", " ", "world", ","]
    const regex = /([\w'-]+)|([^\w'-]+)/g;
    const rawTokens = [...rawText.matchAll(regex)].map(m => m[0]);

    // 2. Identify candidate words for blanking
    const candidateIndices: number[] = [];
    for (let i = 0; i < rawTokens.length; i++) {
      const token = rawTokens[i];
      // If it's a word and not a stop word
      if (/^[\w'-]+$/.test(token)) {
        if (!STOP_WORDS.has(token.toLowerCase())) {
          candidateIndices.push(i);
        }
      }
    }

    // 3. Select N words to blank based on difficultyLevel
    const blanksCount = Math.min(difficultyLevel, candidateIndices.length);
    const selectedIndices = new Set<number>();
    
    // Simple random selection
    const shuffledCandidates = [...candidateIndices].sort(() => 0.5 - Math.random());
    for (let i = 0; i < blanksCount; i++) {
      selectedIndices.add(shuffledCandidates[i]);
    }

    // 4. Build output array
    const output: RecallToken[] = [];
    
    // We can merge consecutive non-blank tokens to keep the array smaller
    let currentTextBuffer = "";

    for (let i = 0; i < rawTokens.length; i++) {
      const token = rawTokens[i];
      
      if (selectedIndices.has(i)) {
        // Push any accumulated text first
        if (currentTextBuffer.length > 0) {
          output.push({ type: 'text', value: currentTextBuffer });
          currentTextBuffer = "";
        }

        // Generate distractors
        const options = this.generateOptions(token);
        output.push({ type: 'blank', value: token, options });
      } else {
        currentTextBuffer += token;
      }
    }

    if (currentTextBuffer.length > 0) {
      output.push({ type: 'text', value: currentTextBuffer });
    }

    return output;
  }

  private static generateOptions(correctAnswer: string): string[] {
    const distractors = new Set<string>();
    const lowerCorrect = correctAnswer.toLowerCase();
    
    // Ensure we don't pick the correct answer as a distractor
    while (distractors.size < 3) {
      const randomDistractor = DISTRACTOR_POOL[Math.floor(Math.random() * DISTRACTOR_POOL.length)];
      if (randomDistractor.toLowerCase() !== lowerCorrect) {
        // Try to match capitalization roughly
        const isCapitalized = /^[A-Z]/.test(correctAnswer);
        const formattedDistractor = isCapitalized 
          ? randomDistractor.charAt(0).toUpperCase() + randomDistractor.slice(1)
          : randomDistractor;
          
        distractors.add(formattedDistractor);
      }
    }

    // Combine and shuffle
    const options = [correctAnswer, ...Array.from(distractors)];
    return options.sort(() => 0.5 - Math.random());
  }
}
