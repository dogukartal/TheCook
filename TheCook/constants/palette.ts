// constants/palette.ts
// Decorative/brand colors intentionally NOT theme-switched.
// Exempt from "zero hardcoded hex" rule per Phase 14 success criteria
// ("outside theme.ts and intentional gradient palettes").

export const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  'ana yemek': ['#E8834A', '#D4572A'],
  'kahvaltı':  ['#F59E0B', '#D97706'],
  'çorba':     ['#0891B2', '#0E7490'],
  'tatlı':     ['#EC4899', '#DB2777'],
  'salata':    ['#16A34A', '#15803D'],
  'aperatif':  ['#7C3AED', '#6D28D9'],
};

export const DEFAULT_GRADIENT: [string, string] = ['#9CA3AF', '#6B7280'];

export const STEP_PASTEL_BACKGROUNDS: string[] = [
  '#FDE8D8', '#D4F0E8', '#E8DFF5', '#FFF3CD',
  '#D1ECF1', '#F5D5D5', '#E2F0CB', '#FCE4EC',
];

export const CATEGORY_STRIP_COLORS: Record<string, string> = {
  'ana yemek': '#E8834A',
  'kahvaltı':  '#D97706',
  'çorba':     '#0E7490',
  'tatlı':     '#DB2777',
  'salata':    '#15803D',
  'aperatif':  '#6D28D9',
};

// Star rating gold -- same in both modes
export const STAR_RATING_COLOR = '#F59E0B';

// Google brand color -- must stay per brand guidelines
export const GOOGLE_BRAND_BLUE = '#4285F4';
