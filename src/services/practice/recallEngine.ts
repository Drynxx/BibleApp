export type RecallToken = {
  type: 'text' | 'blank';
  value: string;
  options?: string[]; // Includes the correct value + 3 distractors
};

import { getBookName } from '../../constants/bibleBooks';

const STOP_WORDS_EN = new Set([
  'the', 'and', 'of', 'to', 'unto', 'hath', 'thou', 'a', 'in', 'that', 'is', 'for', 'it', 'with', 'as', 'he', 'his', 'they', 'be', 'not', 'by', 'but', 'have', 'from', 'which', 'their', 'was', 'were', 'all', 'are', 'shall', 'will', 'this', 'on', 'at', 'or', 'an'
]);

const DISTRACTOR_POOL_EN = [
  'faith', 'love', 'hope', 'peace', 'grace', 'mercy', 'truth', 'light', 'spirit', 'flesh', 'heart', 'soul', 'mind', 'strength', 'word', 'life', 'death', 'sin', 'righteousness', 'salvation', 'heaven', 'earth', 'water', 'fire', 'bread', 'wine', 'blood', 'body', 'church', 'temple', 'king', 'lord', 'servant', 'master', 'brother', 'sister', 'father', 'mother', 'son', 'daughter', 'day', 'night', 'morning', 'evening', 'time', 'eternity'
];

const STOP_WORDS_RO = new Set([
  'și', 'de', 'la', 'în', 'că', 'să', 'un', 'o', 'cu', 'din', 'pe', 'pentru', 'nu', 'mai', 'el', 'ei', 'lui', 'lor', 'care', 'este', 'sunt', 'a', 'al', 'ai', 'ale', 'cel', 'cea', 'cei', 'cele', 'căci', 'dar', 'iar', 'dacă', 'au', 'fost', 'sau', 'cum', 'prin'
]);

const DISTRACTOR_POOL_RO = [
  'credință', 'dragoste', 'speranță', 'pace', 'har', 'milă', 'adevăr', 'lumină', 'duh', 'carne', 'inimă', 'suflet', 'minte', 'putere', 'cuvânt', 'viață', 'moarte', 'păcat', 'neprihănire', 'mântuire', 'cer', 'pământ', 'apă', 'foc', 'pâine', 'vin', 'sânge', 'trup', 'biserică', 'templu', 'rege', 'domn', 'slujitor', 'stăpân', 'frate', 'soră', 'tată', 'mamă', 'fiu', 'fiică', 'zi', 'noapte', 'dimineață', 'seară', 'timp', 'veșnicie'
];

export class RecallEngine {
  /**
   * Generates an active recall practice session from raw verse text.
   * @param rawText The raw verse text.
   * @param difficultyLevel Determines how many words become blanks. (e.g., 1 = 1 blank, 2 = 2 blanks, etc.)
   * @param translation The translation code to determine the language for distractors.
   */
  static generateRecallPractice(rawText: string, difficultyLevel: number, translation: string = 'bsb'): RecallToken[] {
    const isRomanian = translation === 'vdcc' || translation === 'cornilescu';
    const stopWords = isRomanian ? STOP_WORDS_RO : STOP_WORDS_EN;
    const pool = isRomanian ? DISTRACTOR_POOL_RO : DISTRACTOR_POOL_EN;
    // 1. Tokenize preserving punctuation attached to words or as separate tokens?
    // Let's split by regex that captures words and non-words separately. Includes Romanian diacritics.
    // Example: "For God so loved the world," -> ["For", " ", "God", " ", "so", " ", "loved", " ", "the", " ", "world", ","]
    const regex = /([a-zA-ZăîșțâĂÎȘȚÂşţŞŢ'-]+)|([^a-zA-ZăîșțâĂÎȘȚÂşţŞŢ'-]+)/g;
    const rawTokens = [...rawText.matchAll(regex)].map(m => m[0]);

    // 2. Identify candidate words for blanking
    const candidateIndices: number[] = [];
    for (let i = 0; i < rawTokens.length; i++) {
      const token = rawTokens[i];
      // If it's a word and not a stop word
      if (/^[a-zA-ZăîșțâĂÎȘȚÂşţŞŢ'-]+$/.test(token)) {
        if (!stopWords.has(token.toLowerCase())) {
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
        const options = this.generateOptions(token, pool);
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

  static generateReferenceQuiz(bookId: number, chapter: number, verse: number, translation: string = 'bsb'): string[] {
    const correctName = getBookName(bookId, translation);
    const correctRef = `${correctName} ${chapter}:${verse}`;
    
    const distractors = new Set<string>();
    distractors.add(correctRef);
  
    while (distractors.size < 4) {
      const randomStrategy = Math.random();
      let fakeRef = "";
  
      if (randomStrategy < 0.33) {
        // Same book, wrong numbers
        fakeRef = `${correctName} ${chapter + Math.floor(Math.random() * 3 + 1)}:${verse + Math.floor(Math.random() * 5 + 1)}`;
      } else if (randomStrategy < 0.66) {
        // Wrong book, same numbers
        let fakeBook = Math.floor(Math.random() * 66) + 1;
        fakeRef = `${getBookName(fakeBook, translation)} ${chapter}:${verse}`;
      } else {
        // Totally random
        let fakeBook = Math.floor(Math.random() * 66) + 1;
        fakeRef = `${getBookName(fakeBook, translation)} ${Math.floor(Math.random() * 5 + 1)}:${Math.floor(Math.random() * 20 + 1)}`;
      }
      distractors.add(fakeRef);
    }
  
    return Array.from(distractors).sort(() => 0.5 - Math.random());
  }

  private static generateOptions(correctAnswer: string, distractorPool: string[]): string[] {
    const distractors = new Set<string>();
    const lowerCorrect = correctAnswer.toLowerCase();
    
    // Ensure we don't pick the correct answer as a distractor
    while (distractors.size < 3) {
      const randomDistractor = distractorPool[Math.floor(Math.random() * distractorPool.length)];
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
