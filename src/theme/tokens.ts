import { Platform } from "react-native";

/**
 * Fintech macOS Design System Tokens
 * Engineered with Suisse Int'l, Lyon Display, and Roboto Mono typography,
 * comfortable 4px-grid spacing, macOS glassmorphism, and precise radii.
 */

const baseDisplay = Platform.select({
  web: "'DM Serif Display', 'Playfair Display', Georgia, serif",
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

const baseSans = Platform.select({
  web: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  ios: "-apple-system",
  android: "sans-serif",
  default: "sans-serif",
});

const baseMono = Platform.select({
  web: "'Roboto Mono', 'SF Mono', Consolas, monospace",
  ios: "Courier New",
  android: "monospace",
  default: "monospace",
});

export const fontFamilies = {
  display: baseDisplay,
  serif: baseDisplay,
  sans: baseSans,
  mono: baseMono,
};

export const tokens = {
  colors: {
    // Canvas & Surfaces
    canvas: "#F8F9FA",       // macOS window canvas
    card: "#FFFFFF",         // Clean elevated surface
    cardSubtle: "#F6F7F9",   // Secondary panel
    cardWash: "#F1F3F6",     // Segmented control / tag wash
    
    // Inks & Text Hierarchy
    inkPrimary: "#0F172A",   // Obsidian jet — high contrast
    inkSecondary: "#475569", // Steel slate — body & metadata
    inkMuted: "#94A3B8",     // Soft pewter — secondary labels
    inkFaint: "#CBD5E1",     // Placeholders, disabled markers

    // Borders & Hairlines
    borderHairline: "#E2E8F0", // 1px crisp macOS border
    borderSubtle: "#EEF2F6",   // Internal divider
    borderFocus: "#0F172A",    // Focused input / active chip ring

    // Accents & Functional
    accentFlame: "#D97706",    // Warm amber duo streak flame
    accentFlameWash: "#FEF3C7",// Warm wash behind duo streak
    accentSuccess: "#059669",  // Muted emerald verification
    accentSuccessWash: "#D1FAE5",
    accentError: "#DC2626",    // Crimson error
    accentErrorWash: "#FEE2E2",

    // Aliases for streak & status
    streakFlame: "#D97706",
    streakWash: "#FEF3C7",
    error: "#DC2626",
    success: "#059669",
    
    // Button & CTA
    btnPrimaryBg: "#0F172A",   // High-contrast carbon
    btnPrimaryText: "#FFFFFF",
    btnSecondaryBg: "#FFFFFF",
    btnSecondaryText: "#0F172A",

    // Legacy compatibility aliases
    paper: "#FFFFFF",
    cream: "#FFFFFF",
    jetInk: "#0F172A",
    steel: "#475569",
    fog: "#94A3B8",
    pewter: "#94A3B8",
    sand: "#F1F3F6",
    dove: "#E2E8F0",
    sunbeam: "#D97706",
    ember: "#DC2626",
  },

  typography: {
    fontFamilies,
    
    // Exact Type Scale from Prompt
    monoLabel: {
      fontFamily: fontFamilies.mono,
      fontSize: 12,
      lineHeight: 24,           // line-height: 2.0
      letterSpacing: 0.25,      // 0.021em
      textTransform: "uppercase" as const,
      fontWeight: "500" as const,
    },
    uppercaseTracked: {
      fontFamily: fontFamilies.sans,
      fontSize: 11,
      lineHeight: 18,
      letterSpacing: 1.8,       // 0.1820em tracking (~2px)
      textTransform: "uppercase" as const,
      fontWeight: "500" as const,
    },
    bodySm: {
      fontFamily: fontFamilies.sans,
      fontSize: 14,
      lineHeight: 23,           // line-height: 1.67
      fontWeight: "400" as const,
    },
    body: {
      fontFamily: fontFamilies.sans,
      fontSize: 16,
      lineHeight: 24,           // line-height: 1.5
      fontWeight: "400" as const,
    },
    subheading: {
      fontFamily: fontFamilies.sans,
      fontSize: 18,
      lineHeight: 27,           // line-height: 1.5
      fontWeight: "300" as const, // Suisse Int'l weight 300
    },
    headingLg: {
      fontFamily: fontFamilies.display,
      fontSize: 38,
      lineHeight: 34,           // line-height: 0.9
      fontWeight: "300" as const, // Lyon Display light 300
      letterSpacing: -1.2,
    },
    displaySm: {
      fontFamily: fontFamilies.display,
      fontSize: 80,
      lineHeight: 80,           // line-height: 1.0
      fontWeight: "300" as const,
      letterSpacing: -2.0,
    },
    display: {
      fontFamily: fontFamilies.display,
      fontSize: 96,
      lineHeight: 86,           // line-height: 0.9
      fontWeight: "300" as const,
      letterSpacing: -2.5,
    },
  },

  // Exact Spacing Scale (4px base) + micro increments
  spacing: {
    s4: 4,
    s6: 6,
    s8: 8,
    s10: 10,
    s12: 12,
    s14: 14,
    s16: 16,
    s20: 20,
    s24: 24,
    s32: 32,
    s40: 40,
    s48: 48,
    s60: 60,
    s68: 68,
    s100: 100,
    s120: 120,
    s140: 140,
  },

  // Exact Border Radius Tokens
  radii: {
    cards: 16,
    inputs: 8,
    buttons: 8,
    navItems: 8,
    statBlocks: 16,
    pillButtons: 9999,
    featureCards: 30,
    categoryTiles: 30,
    // legacy
    pills: 9999,
  },

  // macOS Shadows
  shadows: {
    lg: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 6,
    },
    card: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 12,
      elevation: 2,
    },
    subtle: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 3,
      elevation: 1,
    },
  },
};

