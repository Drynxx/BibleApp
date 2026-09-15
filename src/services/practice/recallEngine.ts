import {
  tokenizeVerse,
  generateMaskedTokens,
  normalizeDiacritics,
  stripPunctuation,
  validateWord,
  validateWordDetailed,
  calculateDrillScore,
  getMaskPlaceholder,
  VerseToken,
  MaskedToken,
  BlankingStage,
  WordValidationResult,
  DrillScoreInput,
  DrillScoreResult,
} from '../../engine/blanking';

export * from '../../engine/blanking';

export type PracticeToken = {
  type: 'text' | 'blank';
  value: string;
  options?: string[]; // Includes the correct value + 3 distractors, shuffled
};

const STOP_WORDS_EN = new Set([
  'the', 'and', 'of', 'to', 'unto', 'hath', 'thou', 'thy', 'thine', 'thee',
  'in', 'a', 'is', 'that', 'it', 'for', 'on', 'with', 'as', 'he', 'his', 'him',
  'be', 'shall', 'will', 'not', 'but', 'by', 'from', 'they', 'them', 'their',
  'are', 'was', 'were', 'which', 'who', 'whom', 'whose', 'this', 'these', 'those',
  'an', 'at', 'or', 'if', 'we', 'us', 'our', 'my', 'mine', 'me', 'ye', 'you', 'your'
]);

const STOP_WORDS_RO = new Set([
  'și', 'de', 'la', 'în', 'pentru', 'cu', 'pe', 'că', 'să', 'un', 'o', 'din',
  'care', 'este', 'sunt', 'au', 'a', 'al', 'ai', 'ale', 'lui', 'lor', 'el', 'ea',
  'ei', 'ele', 'voi', 'noi', 'tu', 'eu', 'mă', 'te', 'se', 'ne', 'vă', 'le', 'îi',
  'îl', 'o', 'nu', 'dar', 'iar', 'ci', 'sau', 'dacă', 'nici', 'cum', 'ce', 'cine',
  'unde', 'când', 'acest', 'această', 'acești', 'aceste', 'acel', 'acea', 'acei', 'acele',
  'fost', 'era', 'vor', 'ar', 'am', 'ai', 'ați', 'prin', 'spre', 'până', 'după', 'peste'
]);

const DISTRACTORS_EN = [
  'faith', 'spirit', 'flesh', 'blood', 'grace', 'mercy', 'truth', 'light', 'darkness',
  'heaven', 'earth', 'water', 'fire', 'word', 'sword', 'shield', 'mountain', 'valley',
  'righteousness', 'sin', 'love', 'hope', 'peace', 'joy', 'sorrow', 'life', 'death',
  'father', 'son', 'brother', 'king', 'servant', 'prophet', 'priest', 'temple',
  'heart', 'soul', 'mind', 'strength', 'wisdom', 'knowledge', 'understanding',
  'blessing', 'curse', 'glory', 'honor', 'power', 'dominion', 'salvation'
];

const DISTRACTORS_RO = [
  'credință', 'duh', 'carne', 'sânge', 'har', 'milă', 'adevăr', 'lumină', 'întuneric',
  'cer', 'pământ', 'apă', 'foc', 'cuvânt', 'sabie', 'scut', 'munte', 'vale',
  'neprihănire', 'păcat', 'dragoste', 'nădejde', 'pace', 'bucurie', 'întristare', 'viață', 'moarte',
  'tată', 'fiu', 'frate', 'împărat', 'rob', 'proroc', 'preot', 'templu',
  'inimă', 'suflet', 'minte', 'putere', 'înțelepciune', 'cunoștință', 'pricepere',
  'binecuvântare', 'blestem', 'slavă', 'cinste', 'domnie', 'stăpânire', 'mântuire'
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const recallEngine = {
  // Re-export core algorithms
  tokenizeVerse,
  generateMaskedTokens,
  normalizeDiacritics,
  stripPunctuation,
  validateWord,
  validateWordDetailed,
  calculateDrillScore,
  getMaskPlaceholder,

  /**
   * Transforms a raw verse text into an array of practice tokens (texts and blanks).
   */
  generateRecallPractice(rawText: string, difficultyLevel: number = 1, language: 'en' | 'ro' = 'en'): PracticeToken[] {
    if (!rawText) return [];

    const stopWords = language === 'ro' ? STOP_WORDS_RO : STOP_WORDS_EN;
    const distractors = language === 'ro' ? DISTRACTORS_RO : DISTRACTORS_EN;

    // Split text keeping words and non-words (punctuation/spaces) separate
    const rawTokens = rawText.split(/([a-zA-Z0-9ăîșțâĂÎȘȚÂşţŞŢ\u00C0-\u017F]+)/);

    // Identify candidate words for blanking
    const candidates: { index: number; word: string }[] = [];
    for (let i = 0; i < rawTokens.length; i++) {
      const token = rawTokens[i];
      if (/^[a-zA-Z0-9ăîșțâĂÎȘȚÂşţŞŢ\u00C0-\u017F]+$/.test(token)) {
        if (!stopWords.has(token.toLowerCase()) && !stopWords.has(normalizeDiacritics(token))) {
          candidates.push({ index: i, word: token });
        }
      }
    }

    // Determine how many blanks to create based on difficulty
    const numBlanks = Math.min(difficultyLevel, candidates.length);
    
    // Randomly select N candidates to become blanks
    const selectedBlanks = new Set(
      shuffle(candidates).slice(0, numBlanks).map(c => c.index)
    );

    // Build the final typed token array
    const result: PracticeToken[] = [];
    
    for (let i = 0; i < rawTokens.length; i++) {
      const token = rawTokens[i];
      if (!token) continue; // Skip empty strings from regex split

      if (selectedBlanks.has(i)) {
        // Generate options (3 random distractors + the correct word)
        const correctWord = token;
        // Filter out the correct word from the pool using diacritic-aware validation
        let availableDistractors = distractors.filter(d => !validateWord(d, correctWord));
        availableDistractors = shuffle(availableDistractors).slice(0, 3);
        
        // Capitalize distractors if the correct word is capitalized
        const isCapitalized = /^[A-ZĂÎȘȚÂŞŢ]/.test(correctWord);
        const capitalizedDistractors = availableDistractors.map(d => 
          isCapitalized ? d.charAt(0).toUpperCase() + d.slice(1) : d
        );

        const options = shuffle([correctWord, ...capitalizedDistractors]);

        result.push({
          type: 'blank',
          value: correctWord,
          options
        });
      } else {
        result.push({
          type: 'text',
          value: token
        });
      }
    }

    return result;
  }
};
