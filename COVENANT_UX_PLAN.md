# Covenant (Partner) Feature UX Plan

Currently, if a user does not have a partner, the Progress tab completely hides the Covenant feature. The user never knows it exists! 

To make this a core part of the Inscribe experience, we need a smooth onboarding flow directly inside the Progress tab.

## 1. The "Empty State" (No Partner)

If `partnerProfile` is null, we shouldn't just hide the feature. We should display an inviting "Form a Covenant" card right below the Hero Stats on the Progress tab.

**UI Component:**
- **Icon:** Two overlapping rings, or a heart, or a flame.
- **Title:** "Memorize Together"
- **Subtitle:** "Invite a partner to share streaks, keep each other accountable, and watch your faith grow together."
- **Primary Button:** "Invite a Partner"
- **Secondary Link:** "Enter an invite code"

## 2. The Invitation Flow (Bottom Sheet)

When the user taps "Invite a Partner" or "Enter an invite code", a Bottom Sheet slides up.

### Scenario A: Generating an Invite
- **Visual:** A large, readable code (e.g., `A7X-9B2`).
- **Text:** "Send this code to your partner. When they enter it, your streaks will be linked."
- **Action:** A "Share Link" button that uses the native iOS/Android Share sheet (so they can send it via iMessage, WhatsApp, etc.).

### Scenario B: Entering a Code
- **Visual:** A clean, large `TextInput` optimized for uppercase letters/numbers.
- **Action:** "Link Accounts". When successful, it triggers haptic feedback, closes the sheet, and refreshes the Progress tab to show the new active Covenant.

## 3. The "Active State" (Connected Covenant)

Once they have a partner, the current "Partner Status Card" in `progress.tsx` becomes visible, but we can make it much more engaging:

**The Shared Streak:**
Instead of just showing "Done/Pending", we should prominently display the **Shared Streak** (a value already in your database). The shared streak only goes up if *both* partners complete their practice.

**UI Layout for Active Covenant Card:**
- **Header:** "Your Covenant" with the 3-dot kebab menu (for "Manage Partner" or "Disconnect").
- **Center:** A visual "Shared Streak" counter (e.g., a flame with "12 Days").
- **Bottom Row:** Two avatars side-by-side.
  - **You:** Green Checkmark (if completed) or Gray Circle (if pending).
  - **Sarah (Partner):** Green Checkmark (if completed) or Gray Circle (if pending).

## 4. Implementation Steps
1. Create a `CovenantOnboardingCard` component in `progress.tsx` to render when `!partnerProfile`.
2. Build the `CovenantModal` (using the same BottomSheet logic from the Discover screen) to handle viewing and entering `invite_codes`.
3. Update the existing "Partner Status Card" to show the `activeCovenant.shared_streak` and the 3-dot menu we discussed previously.
4. Hook up the backend RPC calls for joining a covenant by code.
