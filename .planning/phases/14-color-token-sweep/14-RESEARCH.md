# Phase 14: Color Token Sweep - Research

**Researched:** 2026-03-19
**Domain:** React Native theming, design tokens, dark mode compliance
**Confidence:** HIGH

## Summary

The codebase has a well-structured theme system (`ThemeContext` + `Colors` object in `constants/theme.ts`) that defines 11 semantic tokens for light and dark modes. The problem is adoption: 33 files outside `theme.ts` contain ~315 hardcoded hex color values and ~135 inline `rgba()` values. The most frequently hardcoded values are the brand tint `#E8834A` (57 occurrences), `#FFFFFF` (40), `#FEF3EC` (27), and `#F0EDE8` (22) -- all of which either already have theme tokens or need new ones.

The highest-impact files are `recipe/[id].tsx` (29 hex values), `settings.tsx` (27), `step-content.tsx` (20), `profile.tsx` (19), and `sign-up.tsx` (18). Recipe cards (`recipe-card-grid.tsx`, `recipe-card-row.tsx`) use `colors.background` for their container but have hardcoded `#FFFFFF` in their `StyleSheet.create` fallbacks and hardcoded badge/text colors, breaking dark mode. The onboarding and auth screens are light-only with no dark mode support at all.

**Primary recommendation:** Expand the `Colors` token set in `theme.ts` with ~10-12 new semantic tokens to cover the recurring patterns (brand tint on white, selected states, semantic status colors, overlay/backdrop), then sweep each file replacing hardcoded values with `colors.X` references. Category gradient palettes and step pastel palettes are intentional decorative colors that should be extracted to a separate `palette.ts` constant file (not theme-switched) to satisfy the "outside theme.ts and intentional gradient palettes" exemption in the success criteria.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UX-01 | Recipe cards have visible contrast against background in both dark and light mode | Cards currently use hardcoded `#FFFFFF` background in StyleSheet, only overridden inline. New `card` token already exists in theme but is not used in card StyleSheets. Adding `cardBorder` or `cardElevation` tokens and using `colors.card`/`colors.background` in cards will create visible boundary in both modes. Dark card (#161614) on dark background (#0C0C0A) needs a subtle border or shadow to be distinguishable. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Native StyleSheet | built-in | Static style definitions | Already used everywhere in project |
| ThemeContext (custom) | n/a | `useAppTheme()` hook providing `isDark`, `colors`, `toggleTheme` | Already the project's theme system; all components import it |
| constants/theme.ts | n/a | `Colors.light` / `Colors.dark` token definitions | Single source of truth for color tokens |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-linear-gradient | installed | Category gradient backgrounds | Gradient palettes remain as decorative constants, not theme-switched |
| @expo/vector-icons | installed | Icon colors that need theming | Icon `color` props currently hardcoded |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Expanding custom Colors object | NativeWind / Unistyles | Massive migration; project is 90%+ built. Not justified for a sweep. |
| Manual sweep | ESLint no-hardcoded-color rule | Good for prevention after sweep, but doesn't do the actual work |

## Architecture Patterns

### Current Theme Architecture
```
constants/theme.ts          -- Colors.light + Colors.dark (11 tokens each)
contexts/ThemeContext.tsx    -- ThemeProvider + useAppTheme() hook
hooks/use-theme-color.ts    -- useThemeColor() (older hook, used by ThemedView/ThemedText)
components/themed-view.tsx  -- ThemedView wrapper (rarely used in practice)
components/themed-text.tsx  -- ThemedText wrapper (rarely used in practice)
```

Most components use `useAppTheme()` directly: `const { isDark, colors } = useAppTheme();` This is the established pattern and should remain.

### Recommended Token Expansion

Current tokens (11):
```
text, background, tint, icon, tabIconDefault, tabIconSelected, surface, card, border, textSub, textMuted
```

New tokens needed (~12):
```typescript
// Brand / accent
tintBg: '#FEF3EC' / 'rgba(232,131,74,0.15)',     // tint-on-background (badges, selected states)
tintBgSelected: 'rgba(232,131,74,0.15)' / same,   // (may merge with tintBg if same in both modes)
onTint: '#FFFFFF' / '#FFFFFF',                      // text/icon on tint-colored backgrounds

// Card system (UX-01 critical)
cardBorder: 'rgba(0,0,0,0.06)' / 'rgba(255,255,255,0.06)', // visible card edge
shadow: '#000000' / '#000000',                      // shadowColor (same both modes)

// Text variants
textSecondary: 'rgba(26,26,24,0.65)' / 'rgba(240,237,230,0.65)',  // between textSub and text

// Semantic status colors
success: '#16A34A' / '#16A34A',
successBg: '#F0FDF4' / 'rgba(22,163,74,0.12)',
warning: '#D97706' / '#FBBF24',
warningBg: '#FFFBEB' / 'rgba(217,119,6,0.12)',
error: '#DC2626' / '#EF4444',
errorBg: '#FEF2F2' / 'rgba(239,68,68,0.1)',

// Interactive
disabledIcon: '#D1D5DB' / 'rgba(255,255,255,0.15)',
overlay: 'rgba(0,0,0,0.4)' / 'rgba(0,0,0,0.4)',

// Skeleton
skeleton: '#E8E4DC' / '#1E1E1B',

// Placeholder text
placeholder: 'rgba(26,26,24,0.35)' / 'rgba(240,237,230,0.35)',

// Input/searchbar
inputBg: '#F5F4F0' / '#1E1E1C',
```

### Pattern 1: Replace StyleSheet Hardcodes with Inline Token Reference
**What:** Move color from `StyleSheet.create` static object into inline style using `colors.X`
**When to use:** Every component that reads `useAppTheme()` and has hardcoded colors in its StyleSheet

**Before:**
```typescript
const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', shadowColor: '#000000' },
  title: { color: '#1A1A18' },
});
// In JSX:
<View style={styles.card}>
```

**After:**
```typescript
const styles = StyleSheet.create({
  card: { borderRadius: 14, overflow: 'hidden' },  // keep non-color styles
});
// In JSX:
<View style={[styles.card, { backgroundColor: colors.background, shadowColor: colors.shadow }]}>
```

### Pattern 2: Extract Decorative Palettes to palette.ts
**What:** Category gradients, step pastel backgrounds, and category-specific badge colors are intentional design palettes that do not switch between light/dark
**When to use:** Gradient arrays, category color maps, step background pastel arrays

```typescript
// constants/palette.ts
export const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  'ana yemek': ['#E8834A', '#D4572A'],
  'kahvalti':  ['#F59E0B', '#D97706'],
  // ...
};

export const STEP_PASTEL_BACKGROUNDS = [
  '#FDE8D8', '#D4F0E8', '#E8DFF5', '#FFF3CD',
  '#D1ECF1', '#F5D5D5', '#E2F0CB', '#FCE4EC',
];

export const DEFAULT_GRADIENT: [string, string] = ['#9CA3AF', '#6B7280'];
```

### Pattern 3: Eliminate isDark Ternaries for Colors Already in Theme
**What:** Many components do `isDark ? '#161614' : '#F0EDE8'` which is exactly `colors.card`. Replace with token.
**When to use:** Any `isDark ? X : Y` where X/Y map to existing theme tokens

**Before:**
```typescript
backgroundColor: isDark ? '#161614' : '#F0EDE8'
```
**After:**
```typescript
backgroundColor: colors.card
```

### Anti-Patterns to Avoid
- **Adding tokens for every unique color value:** Only add tokens for colors that appear 3+ times or have semantic meaning. One-off auth screen brand colors (#E8612C, #4285F4 for Google) can use the tint token or remain hardcoded if auth screens have no dark mode.
- **Theme-switching gradients:** The category gradient palette is the same in both modes (it sits on top of an image area). Do not create dark/light variants.
- **Over-abstracting overlays on colored backgrounds:** Colors like `#FFFFFF` used on gradient overlays (bookmark icon on gradient, text on hero image) are intentionally white regardless of theme. Use `onTint` or leave as `'#FFFFFF'` with a comment.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color opacity variants | Manual rgba() strings everywhere | Pre-computed theme tokens with correct opacity | 20+ inline rgba() patterns repeat the same base color at different opacities |
| Dark/light branching in every component | `isDark ? X : Y` in JSX | Named token in `Colors.light` / `Colors.dark` | Eliminates ~50 ternary expressions, centralizes all decisions |
| Category palette deduplication | Shared constant in one file | Single `palette.ts` imported by card-row, card-grid, recipe detail | Currently duplicated in 3 files identically |

**Key insight:** The existing theme system is well-designed. The work is purely mechanical: expand tokens, then find-and-replace across files. No new architecture needed.

## Common Pitfalls

### Pitfall 1: StyleSheet.create Colors Are Static
**What goes wrong:** Putting `colors.background` inside `StyleSheet.create()` -- it captures the value at module load time, not at render time.
**Why it happens:** Developers treat StyleSheet like CSS and expect it to be reactive.
**How to avoid:** Keep all theme-dependent colors in inline style arrays: `style={[styles.card, { backgroundColor: colors.background }]}`. Only non-color properties (borderRadius, padding, flex) belong in StyleSheet.
**Warning signs:** Colors that look correct on first render but don't update when theme toggles.

### Pitfall 2: Forgetting shadowColor in Dark Mode
**What goes wrong:** Cards use `shadowColor: '#000000'` which is invisible on dark backgrounds. Cards appear to "melt" into background.
**Why it happens:** Shadow is the same color as dark background.
**How to avoid:** For dark mode card visibility (UX-01), rely on subtle border (`cardBorder` token with `borderWidth: 1`) rather than shadow. Shadow can remain for light mode elevation.
**Warning signs:** Cards indistinguishable from background in dark mode.

### Pitfall 3: Auth/Onboarding Screens Left Light-Only
**What goes wrong:** Onboarding screens (skill-level, equipment, allergens, account-nudge) and auth screens (sign-in, sign-up) have hardcoded `#FFFFFF` backgrounds and no `useAppTheme()` for layout styles.
**Why it happens:** They were built before the theme system was adopted broadly.
**How to avoid:** These screens already import `useAppTheme` for some inline styles. Extend to cover the StyleSheet colors too.
**Warning signs:** White flash when navigating to these screens in dark mode.

### Pitfall 4: Breaking the Category Color System
**What goes wrong:** Accidentally theming the category gradient colors, making them different in dark mode.
**Why it happens:** Overzealous token sweep touches decorative palettes.
**How to avoid:** Category gradients, step pastel backgrounds, and the star rating gold (#F59E0B) are explicitly exempt per success criteria ("intentional gradient palettes"). Extract to `palette.ts`, mark with comments, and do not theme-switch them.
**Warning signs:** Category identity lost when switching modes.

### Pitfall 5: Inline Style Performance
**What goes wrong:** Creating new objects on every render via `{ backgroundColor: colors.X }`.
**Why it happens:** Moving colors from StyleSheet to inline.
**How to avoid:** For this app's scale (~30 screens, no virtualized list of 1000+ items), inline style objects are negligible. React Native optimizes flat style merges. Do NOT over-optimize with useMemo for every style -- it adds complexity without measurable benefit.
**Warning signs:** None expected at this scale. Only flag if profiler shows style-related jank.

## Code Examples

### Expanded theme.ts
```typescript
// Source: Analysis of all hardcoded values in codebase
export const Colors = {
  light: {
    // Existing tokens (keep as-is)
    text: '#1A1A18',
    background: '#FFFFFF',
    tint: '#E8834A',
    icon: '#9CA3AF',
    tabIconDefault: 'rgba(26,26,24,0.35)',
    tabIconSelected: '#E8834A',
    surface: '#F5F4F0',
    card: '#F0EDE8',
    border: 'rgba(0,0,0,0.08)',
    textSub: 'rgba(26,26,24,0.5)',
    textMuted: 'rgba(26,26,24,0.28)',

    // New tokens
    tintBg: '#FEF3EC',
    onTint: '#FFFFFF',
    textSecondary: 'rgba(26,26,24,0.65)',
    cardBorder: 'rgba(0,0,0,0.06)',
    shadow: '#000000',
    success: '#16A34A',
    successBg: '#F0FDF4',
    warning: '#D97706',
    warningBg: '#FFFBEB',
    error: '#DC2626',
    errorBg: '#FEF2F2',
    disabledIcon: '#D1D5DB',
    overlay: 'rgba(0,0,0,0.4)',
    skeleton: '#E8E4DC',
    placeholder: 'rgba(26,26,24,0.35)',
    inputBg: '#F5F4F0',
    separator: 'rgba(0,0,0,0.05)',
  },
  dark: {
    text: '#F0EDE6',
    background: '#0C0C0A',
    tint: '#E8834A',
    icon: '#5A5A56',
    tabIconDefault: '#5A5A56',
    tabIconSelected: '#E8834A',
    surface: '#111110',
    card: '#161614',
    border: 'rgba(255,255,255,0.07)',
    textSub: 'rgba(240,237,230,0.45)',
    textMuted: 'rgba(240,237,230,0.25)',

    // New tokens
    tintBg: 'rgba(232,131,74,0.15)',
    onTint: '#FFFFFF',
    textSecondary: 'rgba(240,237,230,0.65)',
    cardBorder: 'rgba(255,255,255,0.06)',
    shadow: '#000000',
    success: '#16A34A',
    successBg: 'rgba(22,163,74,0.12)',
    warning: '#FBBF24',
    warningBg: 'rgba(217,119,6,0.12)',
    error: '#EF4444',
    errorBg: 'rgba(239,68,68,0.1)',
    disabledIcon: 'rgba(255,255,255,0.15)',
    overlay: 'rgba(0,0,0,0.4)',
    skeleton: '#1E1E1B',
    placeholder: 'rgba(240,237,230,0.35)',
    inputBg: '#1E1E1C',
    separator: 'rgba(255,255,255,0.06)',
  },
};
```

### Recipe Card with Proper Dark Mode (UX-01)
```typescript
// RecipeCardGrid - after token sweep
export function RecipeCardGrid({ recipe, ... }: RecipeCardGridProps) {
  const { isDark, colors } = useAppTheme();

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.card,       // was: hardcoded #FFFFFF
          shadowColor: colors.shadow,          // was: #000000
          borderColor: colors.cardBorder,      // NEW: visible edge in dark mode
          borderWidth: isDark ? 1 : 0,         // border only needed in dark mode
        },
      ]}
      onPress={() => onPress(recipe.id)}
    >
      {/* ... */}
      <View style={styles.metaRow}>
        <View style={[styles.skillBadge, { backgroundColor: colors.tintBg }]}>
          <Text style={[styles.skillText, { color: colors.tint }]}>
            {SKILL_LABELS[recipe.skillLevel]}
          </Text>
        </View>
        <Text style={[styles.cookTimeText, { color: colors.textSub }]}>{totalTime} dk</Text>
      </View>
    </Pressable>
  );
}
```

### palette.ts - Intentional Decorative Colors (Exempt from Sweep)
```typescript
// constants/palette.ts
// These are decorative/brand colors intentionally NOT theme-switched.
// They are exempt from the "zero hardcoded hex" rule per Phase 14 success criteria.

export const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  'ana yemek': ['#E8834A', '#D4572A'],
  'kahvalti':  ['#F59E0B', '#D97706'],
  'corba':     ['#0891B2', '#0E7490'],
  'tatli':     ['#EC4899', '#DB2777'],
  'salata':    ['#16A34A', '#15803D'],
  'aperatif':  ['#7C3AED', '#6D28D9'],
};

export const DEFAULT_GRADIENT: [string, string] = ['#9CA3AF', '#6B7280'];

export const STEP_PASTEL_BACKGROUNDS = [
  '#FDE8D8', '#D4F0E8', '#E8DFF5', '#FFF3CD',
  '#D1ECF1', '#F5D5D5', '#E2F0CB', '#FCE4EC',
];

export const CATEGORY_STRIP_COLORS: Record<string, string> = {
  'ana yemek': '#E8834A',
  'kahvalti':  '#D97706',
  'corba':     '#0E7490',
  'tatli':     '#DB2777',
  'salata':    '#15803D',
  'aperatif':  '#6D28D9',
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `isDark ? '#161614' : '#F0EDE8'` inline ternaries | Named semantic tokens via `colors.card` | This phase | Eliminates ~50 ternary expressions |
| Duplicate CATEGORY_GRADIENTS in 3 files | Single `palette.ts` import | This phase | DRY, single source of truth |
| No card border in dark mode | `cardBorder` token + conditional borderWidth | This phase | Solves UX-01 (card distinguishability) |

**Deprecated/outdated:**
- `useThemeColor` hook and `ThemedView`/`ThemedText` components: Still work but `useAppTheme()` is the project's actual pattern. These wrappers are unused by most screens. Can be left as-is (not blocking).

## Open Questions

1. **Auth screens dark mode depth**
   - What we know: sign-in.tsx and sign-up.tsx are entirely light-themed with colors like #FAFAF8, #E8612C, #4285F4 (Google blue). They have no useAppTheme() calls for layout.
   - What's unclear: Should auth screens fully support dark mode, or are they acceptable as light-only since they are seen once?
   - Recommendation: Wire them to useAppTheme() for backgrounds, text, inputs. Skip Google-brand-specific colors (#4285F4) -- those must stay per brand guidelines.

2. **Onboarding screens dark mode depth**
   - What we know: Onboarding screens (skill-level, equipment, allergens, account-nudge) have some isDark conditional styling but heavy StyleSheet hardcoding for light mode.
   - What's unclear: Full dark mode parity vs. just preventing jarring white flash.
   - Recommendation: Full parity. Users who set dark mode expect all screens to follow. These screens are small and the token replacement is mechanical.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 with jest-expo preset |
| Config file | `package.json` jest section |
| Quick run command | `npx jest --testPathPattern=theme --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UX-01-a | Zero hardcoded hex colors in component files outside theme.ts and palette.ts | static analysis | `grep -r --include="*.tsx" '#[0-9a-fA-F]' TheCook/ --exclude-dir=node_modules \| grep -v theme.ts \| grep -v palette.ts \| grep -c .` | No - Wave 0 |
| UX-01-b | Colors.light and Colors.dark have identical token keys | unit | `npx jest --testPathPattern=theme-tokens --no-coverage -x` | No - Wave 0 |
| UX-01-c | Recipe card uses colors.card / colors.cardBorder (not hardcoded) | static analysis / visual | Manual visual check in Expo Go dark mode | Manual-only: visual contrast |
| UX-01-d | All CATEGORY_GRADIENTS references come from palette.ts, not inline | static analysis | `grep -r 'CATEGORY_GRADIENTS' TheCook/ --include="*.tsx" \| grep -v palette.ts \| grep -v node_modules` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --no-coverage` (existing tests still pass)
- **Per wave merge:** `npx jest --no-coverage` + grep audit script
- **Phase gate:** Full suite green + zero hardcoded colors in component files (grep returns 0)

### Wave 0 Gaps
- [ ] `__tests__/theme-tokens.test.ts` -- covers UX-01-b (token key parity between light/dark)
- [ ] `scripts/audit-colors.sh` -- covers UX-01-a, UX-01-d (grep-based static analysis script that returns non-zero on violations)

## Scope Inventory

### Files Requiring Changes (33 files, grouped by priority)

**Priority 1 - Recipe Cards (UX-01 core):**
| File | Hex Count | Key Issue |
|------|-----------|-----------|
| `components/ui/recipe-card-grid.tsx` | 16 | Hardcoded #FFFFFF bg, duplicate gradients, no dark border |
| `components/ui/recipe-card-row.tsx` | 16 | Same as grid |
| `components/ui/skeleton-card.tsx` | 6 | Hardcoded shimmer/card colors |
| `components/ui/feed-section.tsx` | 1 | Hardcoded title color |

**Priority 2 - Core Screens (high user visibility):**
| File | Hex Count | Key Issue |
|------|-----------|-----------|
| `app/recipe/[id].tsx` | 29 | Duplicate gradient palette, many inline colors |
| `app/(tabs)/index.tsx` | 5 | Skeleton colors, button, RefreshControl tint |
| `app/(tabs)/search.tsx` | 7 | Search bar bg, filter toggle colors |
| `app/(tabs)/profile.tsx` | 19 | Heavy isDark ternaries that map to tokens |
| `app/(tabs)/cookbook.tsx` | 1 | Heart icon color |
| `app/(tabs)/_layout.tsx` | 2 | Tab bar tint colors |
| `app/settings.tsx` | 27 | Massive light-only StyleSheet |

**Priority 3 - Cooking Flow:**
| File | Hex Count | Key Issue |
|------|-----------|-----------|
| `components/cooking/step-content.tsx` | 20 | Status colors, duplicate palettes |
| `components/cooking/sefim-sheet.tsx` | 12 | Sheet bg, brand colors |
| `components/cooking/ingredients-sheet.tsx` | 5 | Sheet bg, swap button |
| `components/cooking/completion-screen.tsx` | 5 | Star color, brand |
| `components/cooking/circular-timer.tsx` | 2 | Timer arc color |
| `components/cooking/progress-bar.tsx` | 1 | Active step color |
| `components/cooking/resume-banner.tsx` | 6 | Banner colors |
| `components/cooking/timer-indicator.tsx` | 3 | Badge colors |
| `app/recipe/cook/[id].tsx` | 5 | Sefim button, brand colors |

**Priority 4 - Search Components:**
| File | Hex Count | Key Issue |
|------|-----------|-----------|
| `src/components/search/CategoryStrip.tsx` | 8 | Category colors, chip bg |
| `src/components/search/FilterPanel.tsx` | 5 | Light-only styles |
| `components/discovery/category-filter.tsx` | 4 | Light-only gray palette |
| `components/discovery/ingredient-chips.tsx` | 6 | Chip colors |

**Priority 5 - UI Primitives:**
| File | Hex Count | Key Issue |
|------|-----------|-----------|
| `components/ui/chip.tsx` | 8 | Chip styling |
| `components/recipe/serving-stepper.tsx` | 7 | Stepper colors |
| `components/themed-text.tsx` | 1 | Link color |

**Priority 6 - Onboarding & Auth (lowest traffic):**
| File | Hex Count | Key Issue |
|------|-----------|-----------|
| `app/onboarding/skill-level.tsx` | 13 | Light-only |
| `app/onboarding/equipment.tsx` | 14 | Light-only |
| `app/onboarding/allergens.tsx` | 8 | Light-only |
| `app/onboarding/account-nudge.tsx` | 8 | Light-only |
| `app/(auth)/sign-in.tsx` | 14 | Light-only, Google brand colors |
| `app/(auth)/sign-up.tsx` | 18 | Light-only |

### Files NOT Requiring Changes
- `constants/theme.ts` -- this IS the token source (will be expanded)
- `constants/palette.ts` -- will be created as intentional palette constant file
- `contexts/ThemeContext.tsx` -- no changes needed
- `hooks/use-theme-color.ts` -- no changes needed
- All `src/db/`, `src/hooks/`, `src/services/`, `scripts/` files -- no color values

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis via grep and file reading -- all color counts and patterns verified
- `constants/theme.ts` -- current token set (11 tokens)
- `contexts/ThemeContext.tsx` -- useAppTheme() pattern
- All 33 affected files read and analyzed

### Secondary (MEDIUM confidence)
- React Native StyleSheet documentation -- static nature of StyleSheet.create confirmed via project observation (components already use inline style merging pattern)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries needed, pure token expansion + mechanical replacement
- Architecture: HIGH - existing ThemeContext pattern is well-established across the codebase
- Pitfalls: HIGH - all pitfalls observed directly in codebase (StyleSheet static capture, missing dark borders, auth light-only)
- Scope: HIGH - exact file list and color counts from grep analysis

**Research date:** 2026-03-19
**Valid until:** No expiry (codebase-specific findings, no external dependency concerns)
