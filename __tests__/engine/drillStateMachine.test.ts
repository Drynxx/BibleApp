import {
  DrillStateMachine,
  createDrillStateMachine,
  createInitialDrillState,
  drillReducer,
  DrillState,
} from '@/engine/drillStateMachine';
import { BlankingStage } from '@/engine/blanking';

describe('60-Second Drill State Machine', () => {
  const sampleVerse =
    'Să nu te părăsească bunătatea și credincioșia: leagă-le la gât, scrie-le pe tăblița inimii tale!';

  describe('Initialization', () => {
    it('initializes in idle state with 60 seconds duration by default', () => {
      const drill = createDrillStateMachine({
        verseText: sampleVerse,
        stage: 2,
      });

      const state = drill.getState();
      expect(state.status).toBe('idle');
      expect(state.durationSeconds).toBe(60);
      expect(state.timeRemaining).toBe(60);
      expect(state.timeElapsed).toBe(0);
      expect(state.completedBlanks).toBe(0);
      expect(state.mistakes).toBe(0);
      expect(state.streak).toBe(0);
      expect(state.maxStreak).toBe(0);
      expect(state.score).toBeNull();
      expect(state.totalBlanks).toBeGreaterThan(0);
      expect(state.wordBank.length).toBe(state.totalBlanks);
      expect(state.blanks.length).toBe(state.totalBlanks);
    });

    it('supports custom duration seconds', () => {
      const drill = createDrillStateMachine({
        verseText: sampleVerse,
        stage: 2,
        durationSeconds: 45,
      });

      expect(drill.timeRemaining).toBe(45);
      expect(drill.getState().durationSeconds).toBe(45);
    });

    it('initializes Stage 1, 2, 3, and 4 in standard mode', () => {
      // Stage 1: 0 blanks (read mode)
      const d1 = createDrillStateMachine({ verseText: sampleVerse, stage: 1 });
      expect(d1.totalBlanks).toBe(0);

      // Stage 2: ~30% blanks
      const d2 = createDrillStateMachine({ verseText: sampleVerse, stage: 2 });
      expect(d2.totalBlanks).toBeGreaterThan(0);

      // Stage 3: ~70% blanks
      const d3 = createDrillStateMachine({ verseText: sampleVerse, stage: 3 });
      expect(d3.totalBlanks).toBeGreaterThan(d2.totalBlanks);

      // Stage 4: 100% blanks
      const d4 = createDrillStateMachine({ verseText: sampleVerse, stage: 4 });
      const nonPunctCount = d4.getState().tokens.filter((t) => !t.isPunctuation).length;
      expect(d4.totalBlanks).toBe(nonPunctCount);
    });

    it('supports progressive mode (Level 1: 30%, Level 2: 70%, Level 3: first letters, Level 4: 100%)', () => {
      const p1 = createDrillStateMachine({
        verseText: sampleVerse,
        stage: 1,
        progressiveMode: true,
      });
      expect(p1.totalBlanks).toBeGreaterThan(0);

      const p2 = createDrillStateMachine({
        verseText: sampleVerse,
        stage: 2,
        progressiveMode: true,
      });
      expect(p2.totalBlanks).toBeGreaterThan(p1.totalBlanks);

      const p3 = createDrillStateMachine({
        verseText: sampleVerse,
        stage: 3,
        progressiveMode: true,
      });
      const nonPunctCount = p3.getState().tokens.filter((t) => !t.isPunctuation).length;
      expect(p3.totalBlanks).toBe(nonPunctCount);
      // All blanks have firstLetter defined
      p3.getState().blanks.forEach((b) => {
        expect(b.firstLetter).toBeDefined();
      });

      const p4 = createDrillStateMachine({
        verseText: sampleVerse,
        stage: 4,
        progressiveMode: true,
      });
      expect(p4.totalBlanks).toBe(nonPunctCount);
    });

    it('initializes first_letter mode with all words masked to first letters', () => {
      const drill = createDrillStateMachine({
        verseText: sampleVerse,
        mode: 'first_letter',
      });
      const nonPunctCount = drill.getState().tokens.filter((t) => !t.isPunctuation).length;
      expect(drill.totalBlanks).toBe(nonPunctCount);
      drill.getState().blanks.forEach((b) => {
        expect(b.firstLetter).toBe(b.raw.charAt(0));
      });
    });
  });

  describe('Lifecycle and Timer Control', () => {
    it('transitions through start, pause, resume, and tick', () => {
      const drill = createDrillStateMachine({ verseText: sampleVerse, stage: 2 });
      expect(drill.status).toBe('idle');
      expect(drill.isRunning).toBe(false);

      drill.start();
      expect(drill.status).toBe('running');
      expect(drill.isRunning).toBe(true);

      drill.tick(1);
      expect(drill.timeRemaining).toBe(59);
      expect(drill.timeElapsed).toBe(1);

      drill.tick(4);
      expect(drill.timeRemaining).toBe(55);
      expect(drill.timeElapsed).toBe(5);

      drill.pause();
      expect(drill.status).toBe('paused');
      expect(drill.isRunning).toBe(false);

      // Ticking while paused should do nothing
      drill.tick(5);
      expect(drill.timeRemaining).toBe(55);
      expect(drill.timeElapsed).toBe(5);

      drill.resume();
      expect(drill.status).toBe('running');

      drill.tick(10);
      expect(drill.timeRemaining).toBe(45);
      expect(drill.timeElapsed).toBe(15);
    });

    it('transitions to time_up when 60 seconds expire', () => {
      const drill = createDrillStateMachine({ verseText: sampleVerse, stage: 2 });
      drill.start();

      drill.tick(30);
      expect(drill.timeRemaining).toBe(30);
      expect(drill.isTimeUp).toBe(false);

      drill.tick(30);
      expect(drill.timeRemaining).toBe(0);
      expect(drill.status).toBe('time_up');
      expect(drill.isTimeUp).toBe(true);
      expect(drill.isRunning).toBe(false);
      expect(drill.score).not.toBeNull();
    });

    it('does not allow submitting words when drill is not running', () => {
      const drill = createDrillStateMachine({ verseText: sampleVerse, stage: 2 });
      // In idle
      const res = drill.submitWord('bunatatea');
      expect(res.isCorrect).toBe(false);
      expect(drill.completedBlanks).toBe(0);

      drill.start();
      drill.pause();
      // In paused
      const res2 = drill.submitWord('bunatatea');
      expect(res2.isCorrect).toBe(false);
      expect(drill.completedBlanks).toBe(0);
    });
  });

  describe('Word Submission & Romanian Diacritic Tolerance', () => {
    it('validates matching words with and without Romanian diacritics', () => {
      const drill = createDrillStateMachine({
        verseText: 'Strâng Cuvântul Tău în inima mea.',
        stage: 4,
        shuffleWordBank: false,
      });
      drill.start();

      // First blank is "Strâng"
      const r1 = drill.submitWord('strang'); // ASCII without â
      expect(r1.isCorrect).toBe(true);
      expect(drill.completedBlanks).toBe(1);
      expect(drill.streak).toBe(1);

      // Second blank is "Cuvântul"
      const r2 = drill.submitWord('Cuvântul'); // Exact with diacritics
      expect(r2.isCorrect).toBe(true);
      expect(drill.completedBlanks).toBe(2);
      expect(drill.streak).toBe(2);

      // Third blank is "Tău"
      const r3 = drill.submitWord('tau'); // ASCII without ă
      expect(r3.isCorrect).toBe(true);
      expect(drill.completedBlanks).toBe(3);
      expect(drill.streak).toBe(3);

      // Fourth blank is "în"
      const r4 = drill.submitWord('in'); // ASCII without î
      expect(r4.isCorrect).toBe(true);
      expect(drill.completedBlanks).toBe(4);

      // Fifth blank is "inima"
      const r5 = drill.submitWord('INIMA'); // Uppercase
      expect(r5.isCorrect).toBe(true);
      expect(drill.completedBlanks).toBe(5);

      // Sixth blank is "mea"
      const r6 = drill.submitWord('mea.'); // Attached punctuation
      expect(r6.isCorrect).toBe(true);
      expect(drill.completedBlanks).toBe(6);

      // Drill should now be completed
      expect(drill.isCompleted).toBe(true);
      expect(drill.status).toBe('completed');
      expect(drill.score).not.toBeNull();
      expect(drill.score?.perfect).toBe(true);
      expect(drill.score?.accuracy).toBe(100);
      expect(drill.score?.speedBonus).toBe(true);
    });

    it('handles legacy Romanian cedillas (ş, ţ) vs comma-below (ș, ț)', () => {
      const drill = createDrillStateMachine({
        verseText: 'tăblița credincioșiei',
        stage: 4,
        shuffleWordBank: false,
      });
      drill.start();

      // Submit with legacy cedilla: "tăbliţa" for "tăblița"
      const r1 = drill.submitWord('tăbliţa');
      expect(r1.isCorrect).toBe(true);

      // Submit with legacy cedilla: "credincioşiei" for "credincioșiei"
      const r2 = drill.submitWord('credincioşiei');
      expect(r2.isCorrect).toBe(true);

      expect(drill.isCompleted).toBe(true);
    });

    it('rejects wrong words, increments mistakes, and resets streak', () => {
      const drill = createDrillStateMachine({
        verseText: 'Domnul este Păstorul meu.',
        stage: 4,
        shuffleWordBank: false,
      });
      drill.start();

      // First blank is "Domnul"
      const wrongAttempt = drill.submitWord('gresit');
      expect(wrongAttempt.isCorrect).toBe(false);
      expect(drill.mistakes).toBe(1);
      expect(drill.streak).toBe(0);
      expect(drill.completedBlanks).toBe(0);

      // Now submit correctly
      const correctAttempt = drill.submitWord('Domnul');
      expect(correctAttempt.isCorrect).toBe(true);
      expect(drill.completedBlanks).toBe(1);
      expect(drill.streak).toBe(1);

      // Second blank is "este" - another mistake
      drill.submitWord('altceva');
      expect(drill.mistakes).toBe(2);
      expect(drill.streak).toBe(0);
    });

    it('removes submitted word from wordBank', () => {
      const drill = createDrillStateMachine({
        verseText: 'Har și pace de la Dumnezeu.',
        stage: 4,
      });
      drill.start();

      const initialBankCount = drill.getState().wordBank.length;
      const targetWord = drill.getState().blanks[0].raw;

      drill.submitWord(targetWord);
      expect(drill.getState().wordBank.length).toBe(initialBankCount - 1);
    });
  });

  describe('First-Letter Recitation Mode', () => {
    it('advances through letter-by-letter input with Romanian diacritics', () => {
      const drill = createDrillStateMachine({
        verseText: 'Să nu te părăsească bunătatea.',
        mode: 'first_letter',
      });
      drill.start();

      expect(drill.getState().mode).toBe('first_letter');
      expect(drill.totalBlanks).toBe(5); // Să, nu, te, părăsească, bunătatea

      // Să -> 's'
      const l1 = drill.submitLetter('s');
      expect(l1.isCorrect).toBe(true);
      expect(drill.completedBlanks).toBe(1);
      expect(drill.streak).toBe(1);

      // nu -> 'N' (uppercase input)
      const l2 = drill.submitLetter('N');
      expect(l2.isCorrect).toBe(true);
      expect(drill.completedBlanks).toBe(2);

      // te -> 't'
      const l3 = drill.submitLetter('t');
      expect(l3.isCorrect).toBe(true);
      expect(drill.completedBlanks).toBe(3);

      // Wrong letter for părăsească
      const lWrong = drill.submitLetter('z');
      expect(lWrong.isCorrect).toBe(false);
      expect(drill.mistakes).toBe(1);
      expect(drill.streak).toBe(0);

      // părăsească -> 'p'
      const l4 = drill.submitLetter('p');
      expect(l4.isCorrect).toBe(true);
      expect(drill.completedBlanks).toBe(4);

      // bunătatea -> 'b'
      const l5 = drill.submitLetter('b');
      expect(l5.isCorrect).toBe(true);
      expect(drill.completedBlanks).toBe(5);

      expect(drill.isCompleted).toBe(true);
      expect(drill.status).toBe('completed');
    });

    it('matches Romanian diacritic first letters (ș, ț, î, ă, â)', () => {
      const drill = createDrillStateMachine({
        verseText: 'Și Țara Împăratului Adevărat.',
        mode: 'first_letter',
      });
      drill.start();

      // 'Și' matches 's' or 'ș'
      expect(drill.submitLetter('s').isCorrect).toBe(true);

      // 'Țara' matches 't' or 'ț'
      expect(drill.submitLetter('t').isCorrect).toBe(true);

      // 'Împăratului' matches 'i' or 'î'
      expect(drill.submitLetter('i').isCorrect).toBe(true);

      // 'Adevărat' matches 'a'
      expect(drill.submitLetter('a').isCorrect).toBe(true);

      expect(drill.isCompleted).toBe(true);
    });
  });

  describe('Hints and Assistance', () => {
    it('returns first letter of current blank when requesting hint', () => {
      const drill = createDrillStateMachine({
        verseText: 'Credincioșia Domnului ține veșnic.',
        stage: 4,
        shuffleWordBank: false,
      });
      drill.start();

      const hint = drill.requestHint();
      expect(hint).toBe('C');
      expect(drill.getState().hintsUsed).toBe(1);
    });

    it('returns null if drill is not running', () => {
      const drill = createDrillStateMachine({
        verseText: 'Domnul este bun.',
        stage: 2,
      });
      expect(drill.requestHint()).toBeNull();
    });
  });

  describe('Restart and Configuration Changes', () => {
    it('restarts drill to initial fresh state', () => {
      const drill = createDrillStateMachine({
        verseText: sampleVerse,
        stage: 2,
      });
      drill.start();
      drill.tick(15);
      drill.submitWord('gresit');

      expect(drill.timeElapsed).toBe(15);
      expect(drill.mistakes).toBe(1);

      drill.restart();
      expect(drill.status).toBe('idle');
      expect(drill.timeRemaining).toBe(60);
      expect(drill.timeElapsed).toBe(0);
      expect(drill.mistakes).toBe(0);
      expect(drill.completedBlanks).toBe(0);
    });

    it('updates stage with setStage', () => {
      const drill = createDrillStateMachine({
        verseText: sampleVerse,
        stage: 2,
      });
      const s2Blanks = drill.totalBlanks;

      drill.setStage(4);
      expect(drill.getState().stage).toBe(4);
      expect(drill.totalBlanks).toBeGreaterThan(s2Blanks);
      expect(drill.status).toBe('idle');
    });

    it('updates mode with setMode', () => {
      const drill = createDrillStateMachine({
        verseText: sampleVerse,
        stage: 2,
        mode: 'word_bank',
      });
      expect(drill.getState().mode).toBe('word_bank');

      drill.setMode('first_letter');
      expect(drill.getState().mode).toBe('first_letter');
    });
  });

  describe('Subscription and Reactivity', () => {
    it('notifies subscribers on state changes and un-subscribes properly', () => {
      const drill = createDrillStateMachine({
        verseText: sampleVerse,
        stage: 2,
      });

      const states: DrillState[] = [];
      const unsubscribe = drill.subscribe((s) => {
        states.push({ ...s });
      });

      // Initial subscription triggers once immediately
      expect(states.length).toBe(1);

      drill.start();
      expect(states.length).toBe(2);
      expect(states[1].status).toBe('running');

      drill.tick(1);
      expect(states.length).toBe(3);

      unsubscribe();
      drill.tick(1);
      expect(states.length).toBe(3); // No new notification
    });
  });

  describe('Pure Reducer Independence', () => {
    it('pure drillReducer handles START, TICK, SUBMIT_WORD, and PAUSE immutably', () => {
      const initial = createInitialDrillState({
        verseText: 'Pace vouă.',
        stage: 4,
        shuffleWordBank: false,
      });

      expect(initial.status).toBe('idle');

      const s1 = drillReducer(initial, { type: 'START' });
      expect(s1.status).toBe('running');
      expect(initial.status).toBe('idle'); // Pure / immutable

      const s2 = drillReducer(s1, { type: 'TICK', deltaSeconds: 5 });
      expect(s2.timeRemaining).toBe(55);
      expect(s2.timeElapsed).toBe(5);

      const s3 = drillReducer(s2, { type: 'SUBMIT_WORD', word: 'Pace' });
      expect(s3.completedBlanks).toBe(1);
      expect(s3.streak).toBe(1);

      const s4 = drillReducer(s3, { type: 'PAUSE' });
      expect(s4.status).toBe('paused');
    });
  });
});
