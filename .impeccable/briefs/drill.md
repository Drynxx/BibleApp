# Surface Brief: 60-Second Active Recall Drill Screen

<!-- impeccable:surface-brief 1 -->

## 1. Job and Audience
- **Visitor Mode**: **Operate** (habitual daily practice, high focus, calm reverent tone).
- **Audience**: Believers and scripture memory partners performing daily micro-sessions (60–90 seconds) to commit Scripture to heart and maintain their shared Duo Streak.
- **User Mindset**: Arrives desiring spiritual grounding and discipline without cognitive friction or overwhelming UI clutter.

## 2. Outcome and Proof
- **Primary Task**: Recite and reconstruct the day's assigned verse across 4 progressive active-recall stages.
- **Success State**: 100% reconstruction of the verse through Stage 4 mastery, immediate synchronization of partner status, and feeling of spiritual retention.
- **Proof & Evidence**: Real Scripture texts in Romanian (VDC with full diacritics: *ă, î, ș, ț, â*) and English (WEB), accurate book/chapter/verse citation.

## 3. Selected Direction
- **Structural Thesis**: Handheld, thumb-first vertical mobile layout:
  - **Top Bar**: Minimalist breadcrumb (*Proverbe 3:3*), stage progress dots (`● ● ○ ○`), and ambient elapsed-time filament bar.
  - **Core Canvas**: Prominent verse display card with elevated typography, where words transform into interactive blank slots.
  - **Bottom Tray**: Scrambled Word Tile Bank displaying tactile rounded chips for instant tap-to-fill input.
- **Focal Moment**: Seamless transition into the **Duo Completion Reveal** celebrating session success and showing live partner accountability status (*"You did your part today! 21-Day Streak preserved. Waiting for Andrei..."*).

## 4. Scope and Boundaries
- **Named Target**: `src/screens/DrillScreen.tsx` (with `DrillHeader`, `WordCanvas`, `WordTileTray`, `DuoCompletionModal`).
- **In Scope**:
  - 4-stage progressive blanking (Stage 1: Familiarize 100% → Stage 2: 30% mask → Stage 3: 70% mask → Stage 4: 100% mastery).
  - Scrambled word tile picker with tap-to-place and undo affordance.
  - Tactile haptic cues on placement (success vs. retry).
  - Reversible hint mechanism (reveal first letter).
  - Duo Streak status sync and completion modal.
- **Explicit Anti-Goals**:
  - No full on-screen alphanumeric QWERTY keyboard (prevents screen crowding and high cognitive typing friction).
  - No high-anxiety ticking countdown clock or buzzer failures.
  - No intrusive gamification popups (retains peace and reverence).

## 5. States and Ranges
- **Stage 1 (Inscribe / 10s)**: Full verse visible with core theological verbs/nouns gently highlighted.
- **Stage 2 (Step In / 20s)**: 30% of words masked as dashed pill outlines; bottom tray presents scrambled candidate word chips.
- **Stage 3 (Deep Recall / 20s)**: 70% of words masked; user taps word chips in sequential grammatical order.
- **Stage 4 (Mastery / 10s)**: Full canvas masked with only punctuation and first-letter prompts.
- **Mistake State**: Chip glows amber with subtle horizontal shake; returns cleanly to tray without penalty.
- **Completion State**: Entire verse illuminates with gentle gold border, triggering immediate Duo Streak sync and completion modal.

## 6. Interaction and Layout
- **Topology**:
  - Safe-area insets at top and bottom.
  - Center-weighted reading plane maintaining stable line wraps as words are masked/revealed.
  - Bottom-pinned tray ensuring all touch targets stay within natural thumb reach.
- **Touch Targets**: All word chips minimum 48×48 dp touch envelope, 8 dp spacing.
- **Transitions**: Smooth shared-element transition between stages; spring physics on word chip placement.

## 7. Constraints and Open Decisions
- **Platform**: Android (Material Design 3 tokens, predictive back, dynamic system bars) + iOS parity.
- **Localization**: Strict Romanian diacritic normalization (typing/tapping tolerates standard ASCII while UI displays full diacritics).
- **Accessibility**: Screen reader (TalkBack/VoiceOver) announces current blank and stage progress; dynamic type scaling supported.
