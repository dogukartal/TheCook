# Phase 11: Cooking Mode Evolution - Research

**Researched:** 2026-03-17
**Domain:** React Native cooking UX — step images, checkpoint/warning fields, celebration, rating, history logging
**Confidence:** HIGH

## Summary

Phase 11 evolves the existing cooking mode by adding visual polish and completion tracking. The current cooking implementation (PagerView-based step navigation, session persistence, adaptation support) is mature and well-structured. This phase layers on three capabilities: (1) step images with fallback color blocks, (2) checkpoint/warning text fields per step, and (3) a completion flow with star rating that logs to Gecmis (cooking_history).

The existing codebase already has most infrastructure in place. The `stepImage` field exists in `StepSchema` (nullable, defaults to null), the `cooking_history` table exists with a `rating` column, and `logCookingCompletion()` is already implemented. The `CompletionScreen` component exists but lacks rating UI. The `StepContent` component already renders a color-block placeholder where images will go. The main work is: extending the schema with checkpoint/warning fields, adding `Image` rendering with fallback, building a star rating widget, wiring completion to history logging, and adding an exit confirmation modal.

**Primary recommendation:** Extend StepSchema with `checkpoint` and `warning` optional fields, add Image rendering to StepContent's existing placeholder area, enhance CompletionScreen with star rating, and wire the "Bitir" flow to call `logCookingCompletion` only on full completion.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COOKX-01 | Each cooking step displays an AI-generated process image with fallback colour block | StepSchema already has `stepImage: z.string().nullable().default(null)`. StepContent already renders a pastel color block placeholder. Replace with `Image` component when stepImage is non-null, keep pastel fallback when null. |
| COOKX-02 | Each step shows Boyle gorunmeli (checkpoint) and Dikkat et! (warning) -- max one line each | StepContent already renders `looksLikeWhenDone` (Gormeli) and `commonMistake` (Dikkat). Requirements ask for shorter, distinct fields: `checkpoint` (one-liner visual cue) and `warning` (one-liner caution). Add to StepSchema as optional nullable strings with defaults. |
| COOKX-03 | Completing a recipe logs to Gecmis with date and optional star rating; partial cooks not logged | `cooking_history` table and `logCookingCompletion()` already exist. Wire CompletionScreen to call it. Add star rating UI. Ensure only full completion (reaching final step + tapping finish) triggers the log -- session abandonment must NOT log. |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native (Image) | built-in | Step image rendering | Native Image component with source/fallback support |
| expo-sqlite | ~5.0 | cooking_history logging | Already used for all DB operations |
| react-native-pager-view | ^7.0 | Step navigation | Already used in cooking mode |
| @expo/vector-icons | ^15.0 | Star icons for rating | Already used throughout app |
| react-native-reanimated | ~4.0 | Optional star animation | Already installed for shimmer effects |

### No New Dependencies Needed

All requirements can be met with existing installed packages. No new libraries required.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom star rating | react-native-ratings | Overkill -- 5 Pressable star icons is ~30 lines, no need for external dependency |
| expo-image for step images | RN Image | expo-image has better caching but RN Image is sufficient for local/bundled assets; stepImage is currently null for all recipes anyway |

## Architecture Patterns

### Existing Structure (extend, don't restructure)
```
TheCook/
  components/cooking/
    step-content.tsx       # ADD: Image rendering, checkpoint/warning sections
    completion-screen.tsx  # ADD: star rating widget, onRate callback
    ...existing files...
  src/
    types/recipe.ts        # ADD: checkpoint, warning fields to StepSchema
    db/cooking-history.ts  # EXISTING: logCookingCompletion already accepts rating
    db/client.ts           # BUMP: DB_VERSION for schema migration (checkpoint/warning columns not needed in SQL -- stored in JSON steps)
  app/recipe/cook/[id].tsx # MODIFY: wire completion to history log, add exit confirmation modal
```

### Pattern 1: Step Image with Fallback
**What:** Render `Image` when `stepImage` is non-null, pastel color block when null
**When to use:** StepContent image area
**Example:**
```typescript
// In step-content.tsx
{step.stepImage ? (
  <Image
    source={{ uri: step.stepImage }}
    style={styles.stepImage}
    resizeMode="cover"
  />
) : (
  <View style={[styles.imagePlaceholder, { backgroundColor: bgColor }]} />
)}
```

### Pattern 2: Checkpoint + Warning Fields (Schema Extension)
**What:** Add optional one-liner fields to StepSchema
**When to use:** StepSchema in recipe.ts
**Example:**
```typescript
export const StepSchema = z.object({
  // ...existing fields...
  checkpoint: z.string().nullable().default(null),  // "Boyle gorunmeli"
  warning: z.string().nullable().default(null),     // "Dikkat et!"
});
```
**Key insight:** These are DISTINCT from existing `looksLikeWhenDone` and `commonMistake` fields. The existing fields are longer-form explanations. The new fields are max-one-line visual cues displayed more prominently. Both can coexist -- `checkpoint` is a short visual checkpoint, `looksLikeWhenDone` is the detailed description. Similarly, `warning` is a short caution, while `commonMistake` + `recovery` are the detailed mistake/fix pair.

### Pattern 3: Star Rating Widget
**What:** Simple 5-star Pressable row with MaterialCommunityIcons
**When to use:** CompletionScreen
**Example:**
```typescript
function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)}>
          <MaterialCommunityIcons
            name={star <= value ? 'star' : 'star-outline'}
            size={36}
            color={star <= value ? '#F59E0B' : '#D1D5DB'}
          />
        </Pressable>
      ))}
    </View>
  );
}
```

### Pattern 4: Exit Confirmation Modal
**What:** Alert.alert when user taps close (X) during cooking
**When to use:** CookingScreen close button handler
**Example:**
```typescript
function handleExit() {
  Alert.alert(
    'Pisirmeden cikiyorsun',
    'Ilerlemen kaydedilecek. Sonra devam edebilirsin.',
    [
      { text: 'Devam et', style: 'cancel' },
      { text: 'Cik', style: 'destructive', onPress: () => router.back() },
    ]
  );
}
```

### Pattern 5: Completion Logging (only on full completion)
**What:** Call `logCookingCompletion` only when user finishes all steps and submits rating
**When to use:** CompletionScreen "done" action
**Key constraint:** Partial cooks must NOT be logged. The current flow already separates completion from exit -- `showCompletion` is set only when navigating past the last step. The session is cleared on completion page reach (`clearSession(db)` at line 198 of cook/[id].tsx). The logging call should happen when the user taps the final button on CompletionScreen, after optional rating.

### Anti-Patterns to Avoid
- **Logging on session clear:** Session clear happens for both completion and manual reset. Only log on explicit completion flow.
- **Requiring rating:** Rating must be optional. User can skip and still log completion.
- **Blocking navigation for rating:** The rating + log should happen when user taps the action button, not on unmount.
- **New SQL columns for checkpoint/warning:** Steps are stored as JSON TEXT. These fields go into the JSON, not as separate columns. No DB migration needed for step field additions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Star rating | Custom gesture handler | 5x Pressable + MaterialCommunityIcons star/star-outline | Simple, accessible, no gesture complexity |
| Image loading/caching | Custom cache layer | React Native Image (or expo-image if already installed) | Built-in; step images are bundled assets or null |
| Exit confirmation | Custom modal component | Alert.alert | Native feel, consistent with platform, zero layout code |

## Common Pitfalls

### Pitfall 1: Logging Partial Cooks
**What goes wrong:** User exits mid-cook, history row created, Gecmis shows incomplete recipes
**Why it happens:** Logging tied to wrong lifecycle event (session clear, component unmount)
**How to avoid:** Log ONLY in CompletionScreen's explicit action handler, never in cleanup/unmount
**Warning signs:** cooking_history rows appearing without user reaching completion screen

### Pitfall 2: Schema Migration for JSON Fields
**What goes wrong:** Developer bumps DB_VERSION and writes ALTER TABLE for checkpoint/warning
**Why it happens:** Forgetting that `steps` is stored as JSON TEXT, not individual columns
**How to avoid:** Add `checkpoint` and `warning` to StepSchema Zod definition only. Existing recipes will get `null` defaults via `.default(null)`. No SQL migration needed.
**Warning signs:** ALTER TABLE statements for step-level fields

### Pitfall 3: Existing "Dikkat" Section Confusion
**What goes wrong:** New `warning` field conflicts with or duplicates existing `commonMistake` rendering
**Why it happens:** StepContent already has a red "Dikkat!" section showing `commonMistake` + `recovery`
**How to avoid:** Keep existing Dikkat section as-is (it serves COOK-03). The new `warning` field from COOKX-02 is a short one-liner displayed in a different visual treatment (compact yellow/amber callout) above or near the checkpoint. The existing red Dikkat section with commonMistake+recovery remains for detailed mistake guidance.
**Warning signs:** Removing the existing Dikkat section or overwriting its content

### Pitfall 4: CompletionScreen Rendered Twice
**What goes wrong:** CompletionScreen appears both as PagerView's last page AND as the `showCompletion` conditional render
**Why it happens:** The current code has BOTH paths (line 366 conditional + line 452 PagerView child)
**How to avoid:** Consolidate to one path. The PagerView completion page should set `showCompletion=true` which triggers the full-screen render with rating. Or remove the PagerView completion child and only use the conditional.
**Warning signs:** Rating UI not appearing because user sees PagerView version without rating

### Pitfall 5: Star Rating State Lost on Navigation
**What goes wrong:** User selects rating, taps "Tariflere Don", rating not saved
**Why it happens:** Rating state is local to CompletionScreen, navigation happens before async DB write completes
**How to avoid:** Await `logCookingCompletion` before calling `router.replace`
**Warning signs:** cooking_history rows with NULL rating despite user selecting stars

### Pitfall 6: Nav Bar Already Hidden
**What goes wrong:** Developer implements nav bar hiding logic that already exists
**Why it happens:** Not realizing cook/[id].tsx is a Stack screen outside (tabs)
**How to avoid:** The cooking route is already outside the tab navigator. Nav bar is inherently hidden. No additional work needed for NAV-01 compliance during cooking mode.

## Code Examples

### Extending StepSchema (recipe.ts)
```typescript
export const StepSchema = z.object({
  title: z.string().optional().default(""),
  instruction: z.string().min(1),
  why: z.string().min(1),
  looksLikeWhenDone: z.string().min(1),
  commonMistake: z.string().min(1),
  recovery: z.string().min(1),
  stepImage: z.string().nullable().default(null),
  timerSeconds: z.number().int().positive().nullable().default(null),
  // NEW — Phase 11 COOKX-02
  checkpoint: z.string().nullable().default(null),  // "Boyle gorunmeli" one-liner
  warning: z.string().nullable().default(null),     // "Dikkat et!" one-liner
});
```

### Enhanced StepContent Checkpoint/Warning Rendering
```typescript
{/* Checkpoint — short visual cue */}
{step.checkpoint && (
  <View style={styles.checkpointSection}>
    <MaterialCommunityIcons name="check-circle" size={16} color="#16A34A" />
    <Text style={styles.checkpointText}>{step.checkpoint}</Text>
  </View>
)}

{/* Warning — short caution */}
{step.warning && (
  <View style={styles.warningSection}>
    <MaterialCommunityIcons name="alert" size={16} color="#D97706" />
    <Text style={styles.warningText}>{step.warning}</Text>
  </View>
)}
```

### Enhanced CompletionScreen with Rating
```typescript
export function CompletionScreen({
  recipeName,
  totalCookingTime,
  onComplete,  // (rating: number | null) => void
}: CompletionScreenProps) {
  const [rating, setRating] = useState<number>(0);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="party-popper" size={72} color="#E07B39" />
      <Text style={styles.title}>Afiyet olsun!</Text>
      <Text style={styles.recipeName}>{recipeName}</Text>
      <Text style={styles.cookingTime}>{totalCookingTime} dakika</Text>

      {/* Star rating */}
      <Text style={styles.ratingLabel}>Bu tarifi degerlendir</Text>
      <StarRating value={rating} onChange={setRating} />

      <Pressable
        style={styles.button}
        onPress={() => onComplete(rating > 0 ? rating : null)}
      >
        <Text style={styles.buttonText}>Tariflere Don</Text>
      </Pressable>
    </View>
  );
}
```

### Wiring Completion in cook/[id].tsx
```typescript
async function handleCompletion(rating: number | null) {
  if (id) {
    await logCookingCompletion(db, id as string, rating ?? undefined);
    await clearSession(db);
  }
  router.replace('/(tabs)');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pastel placeholder only | Image with pastel fallback | Phase 11 | stepImage field already in schema, just needs rendering |
| Single Dikkat section | Dikkat (detailed) + warning (one-liner) | Phase 11 | Two tiers of caution display |
| No completion tracking | cooking_history with rating | Phase 8 (table) + Phase 11 (wiring) | Enables Gecmis and "Denemediklerin" feed logic |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + jest-expo ~54.0.17 |
| Config file | TheCook/jest.config.js (or package.json jest section) |
| Quick run command | `npx jest --testPathPattern="cooking" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COOKX-01 | StepContent renders Image when stepImage present, fallback when null | unit | `npx jest __tests__/step-content.test.ts -x` | Exists (needs new cases) |
| COOKX-02 | StepContent renders checkpoint and warning when present, hides when null | unit | `npx jest __tests__/step-content.test.ts -x` | Exists (needs new cases) |
| COOKX-02 | StepSchema validates checkpoint and warning fields | unit | `npx jest __tests__/schema.test.ts -x` | Exists (needs new cases) |
| COOKX-03 | logCookingCompletion writes to cooking_history with rating | unit | `npx jest __tests__/cooking-history.test.ts -x` | Does not exist |
| COOKX-03 | Completion flow calls logCookingCompletion only on full cook | integration | Manual verification | N/A |
| COOKX-03 | Star rating widget selects 1-5 or skips | unit | `npx jest __tests__/completion-screen.test.ts -x` | Does not exist |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="(step-content|schema|cooking-history)" --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/cooking-history.test.ts` -- covers COOKX-03 (logCookingCompletion, rating persistence)
- [ ] New test cases in `__tests__/step-content.test.ts` -- covers COOKX-01 (image rendering) and COOKX-02 (checkpoint/warning)
- [ ] New test cases in `__tests__/schema.test.ts` -- covers COOKX-02 (checkpoint/warning schema validation)

## Open Questions

1. **Step image source format**
   - What we know: `stepImage` field exists as `z.string().nullable()`. Currently null for all 30 recipes.
   - What's unclear: Will images be bundled assets (require()), remote URLs, or local file paths? For v1 with AI-generated images, likely bundled or asset URIs.
   - Recommendation: Support both local require() and URI string. Use `Image source={{ uri: stepImage }}` which works for both http URLs and local file URIs. For bundled assets, a mapping object can resolve string names to require() calls.

2. **Checkpoint/Warning content for existing recipes**
   - What we know: 30 existing recipes have no checkpoint/warning content authored yet.
   - What's unclear: Will content be authored for all 30 recipes in this phase, or left null?
   - Recommendation: Schema defaults to null. Implement rendering. Content authoring is a separate concern -- even if fields are null for most recipes, the UI gracefully hides them. Could add to 3 sample recipes (menemen, mercimek corbasi, borek) to demonstrate.

3. **Celebration screen animation**
   - What we know: Requirements say "celebration screen" but don't specify animation level.
   - What's unclear: Simple static screen (current) or confetti/particle animation?
   - Recommendation: Keep it simple -- current party-popper icon + rating is sufficient. Avoid adding animation libraries (react-native-confetti, etc.) for v1.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `TheCook/components/cooking/step-content.tsx`, `completion-screen.tsx`, `app/recipe/cook/[id].tsx`
- Codebase inspection: `TheCook/src/types/recipe.ts` -- StepSchema with existing stepImage field
- Codebase inspection: `TheCook/src/db/cooking-history.ts` -- logCookingCompletion already implemented
- Codebase inspection: `TheCook/src/db/client.ts` -- DB_VERSION=7, cooking_history table at migration v6

### Secondary (MEDIUM confidence)
- React Native Image documentation -- standard `source={{ uri }}` pattern for image rendering

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and in use
- Architecture: HIGH - extending existing well-understood components
- Pitfalls: HIGH - identified from direct codebase analysis of current implementation

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable -- no external dependency changes expected)
