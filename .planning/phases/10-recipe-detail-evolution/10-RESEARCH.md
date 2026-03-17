# Phase 10: Recipe Detail Evolution - Research

**Researched:** 2026-03-17
**Domain:** React Native recipe adaptation — serving scaler, ingredient substitution, dynamic step variables
**Confidence:** HIGH

## Summary

Phase 10 adds three adaptation features to the existing recipe detail screen (`app/recipe/[id].tsx`): a serving size scaler, ingredient substitution ("Elimde yok"), and step preview improvements. All adaptation happens before cooking starts; cooking mode reads the adapted state.

The existing codebase is well-structured for this work. The recipe detail screen already displays ingredients with amounts/units and step previews. The IngredientsSheet component already has a placeholder "Degistir" (swap) button. The CookingSession DB model already stores session state. The key challenge is designing the **adaptation state layer** that sits between the raw recipe data and what the UI/cooking mode renders, plus extending the recipe YAML/schema with substitution definitions.

**Primary recommendation:** Create a `useRecipeAdaptation` hook that owns serving multiplier and ingredient swap state, derives scaled/substituted ingredient groups and step text from the raw recipe, and exposes the adapted recipe to both the detail screen and cooking mode. No schema migration needed for the `recipes` DB table itself -- substitution data is added to the YAML/JSON content (inside the existing `ingredient_groups` JSON column). A new DB migration (version 7) adds `adapted_servings` and `ingredient_swaps` columns to `cooking_sessions` so adaptations persist into cooking mode.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADAPT-01 | User can adjust serving size on recipe detail; all ingredient quantities scale proportionally and carry into cooking mode | Serving scaler stepper component + useRecipeAdaptation hook with multiplier state; CookingSession extended with adaptedServings |
| ADAPT-02 | User can swap a missing ingredient for a pre-defined alternative ("Elimde yok"); substitution reflected in step copy via dynamic variables | Substitution definitions added to IngredientSchema (alternatives array); swap state in hook; IngredientsSheet swap button wired |
| ADAPT-03 | Step copy uses dynamic variables for ingredient references -- quantities and names resolve to active state (scaled/substituted) at cook time | Template variable syntax `{{ingredient_name}}` in step instruction text, resolved at render time by adaptation hook |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Native | 0.81.5 | UI framework | Already in use |
| expo-sqlite | ~16.0.10 | Local DB for session persistence | Already in use, v2 API |
| Zod | ^4.3.6 | Schema validation | Already in use for recipe types |
| react-native-pager-view | 6.9.1 | Cooking mode step swiping | Already in use |

### Supporting (no new dependencies needed)
This phase requires **zero new npm packages**. All features are built with existing primitives:
- Stepper UI: Pressable + Text (no external stepper library needed)
- State management: React useState/useMemo in a custom hook
- String interpolation: Simple regex replace for dynamic variables

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom stepper | react-native-stepper-ui | Over-engineered for a simple +/- control; custom is 30 lines |
| Template literals for variables | Handlebars/Mustache | Overkill; we have <20 variable patterns, regex is sufficient |

## Architecture Patterns

### Recommended Project Structure
```
src/
  hooks/
    useRecipeAdaptation.ts       # NEW: adaptation state (servings, swaps, derived data)
    useRecipeDetailScreen.ts     # NEW: extract from [id].tsx per hook pattern
  types/
    recipe.ts                    # MODIFIED: add SubstitutionSchema to IngredientSchema
  db/
    cooking-session.ts           # MODIFIED: add adaptedServings + ingredientSwaps to session
    client.ts                    # MODIFIED: migration v7 for session columns
app/
  recipe/
    [id].tsx                     # MODIFIED: use hook, add stepper, wire swap
    cook/[id].tsx                # MODIFIED: read adaptation from session, pass to components
components/
  cooking/
    ingredients-sheet.tsx        # MODIFIED: show swap button only when alternatives exist
    step-content.tsx             # MODIFIED: render resolved step text with dynamic variables
  recipe/
    serving-stepper.tsx          # NEW: inline +/- stepper component
```

### Pattern 1: Adaptation Hook (useRecipeAdaptation)
**What:** Single hook that owns all adaptation state and derives adapted data from raw recipe.
**When to use:** Any screen that needs scaled/substituted recipe data.
**Example:**
```typescript
// useRecipeAdaptation.ts
interface AdaptationState {
  servings: number;           // current serving count
  swaps: Record<string, string>; // ingredientName -> substituteName
}

interface AdaptedRecipe {
  servings: number;
  multiplier: number;
  ingredientGroups: IngredientGroup[]; // amounts scaled, names swapped
  steps: RecipeStep[];                 // instruction text with variables resolved
}

function useRecipeAdaptation(recipe: Recipe) {
  const [servings, setServings] = useState(recipe.servings);
  const [swaps, setSwaps] = useState<Record<string, string>>({});

  const multiplier = servings / recipe.servings;

  const adapted: AdaptedRecipe = useMemo(() => {
    // 1. Scale ingredient amounts by multiplier
    // 2. Apply swaps to ingredient names
    // 3. Resolve dynamic variables in step instructions
    return { servings, multiplier, ingredientGroups: ..., steps: ... };
  }, [recipe, servings, swaps]);

  return { adapted, servings, setServings, swaps, swapIngredient, resetSwap };
}
```

### Pattern 2: Dynamic Variable Resolution in Steps
**What:** Step instruction text contains `{{ingredient.name}}` and `{{ingredient.amount}}` placeholders that resolve to the current adapted state.
**When to use:** Every step text render (detail preview and cooking mode).
**Example:**
```typescript
// Variable syntax in YAML step instructions:
// "{{Yumurta.amount}} {{Yumurta.unit}} {{Yumurta.name}} kirin"
// Resolves to: "6 adet Yumurta kirin" (if scaled from 4 to 6)
// Or: "6 adet Tavuk yumurtasi kirin" (if swapped)

function resolveStepVariables(
  instruction: string,
  ingredientMap: Map<string, { name: string; amount: number; unit: string }>
): string {
  return instruction.replace(
    /\{\{(\w+)\.(name|amount|unit)\}\}/g,
    (match, ingredientKey, field) => {
      const ingredient = ingredientMap.get(ingredientKey);
      if (!ingredient) return match; // leave unresolved if not found
      return String(ingredient[field as keyof typeof ingredient]);
    }
  );
}
```

### Pattern 3: Session Persistence for Adaptation
**What:** Adapted servings and swaps are saved to cooking_sessions so cooking mode reads them.
**When to use:** When starting cooking from recipe detail.
**Example:**
```typescript
// Extended CookingSession
interface CookingSession {
  recipeId: string;
  currentStep: number;
  timerRemaining: number | null;
  timerStartTimestamp: number | null;
  ingredientChecks: number[];
  sessionStartedAt: string;
  adaptedServings: number | null;    // NEW
  ingredientSwaps: Record<string, string>; // NEW: JSON serialized
}
```

### Pattern 4: Screen Hook Extraction (project convention)
**What:** Recipe detail screen currently has inline state management. Per project convention (Phase 7+), extract to `useRecipeDetailScreen` hook.
**When to use:** This phase, since we're significantly modifying the screen.
**Example:**
```typescript
// useRecipeDetailScreen.ts — owns all state, effects, handlers
// [id].tsx becomes a thin rendering shell
export function useRecipeDetailScreen(id: string) {
  const db = useSQLiteContext();
  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined);
  const adaptation = useRecipeAdaptation(recipe);
  // ... bookmark state, session check, etc.
  return { recipe, adaptation, isBookmarked, handleBookmarkToggle, ... };
}
```

### Anti-Patterns to Avoid
- **Mutating the recipe object directly:** Never modify the original recipe from getRecipeById. All adaptation is derived via useMemo in the hook. The raw recipe remains the source of truth.
- **Storing adapted recipe in DB:** Only store the adaptation delta (servings number + swap map). The adapted recipe is always recomputed from raw + delta.
- **Hardcoding substitution maps in code:** Substitutions are content data, not app logic. They live in the YAML recipe files alongside ingredient definitions.
- **Scaling non-scalable quantities:** Some amounts (e.g., "1 tutam tuz") should not scale linearly. The `scalable` flag on ingredients controls this.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fraction display | Custom fraction parser | Simple rounding with toFixed(1) | Turkish cooking uses grams/ml (metric), not cups/fractions; amounts are always numeric |
| Complex template engine | Regex-based interpolation is sufficient | N/A | Only ~3 variable types (name, amount, unit) with simple `{{key.field}}` syntax |

**Key insight:** This is a relatively simple feature set. The ingredient amounts are always numeric (no "1/4 cup" fractions since Turkish recipes use metric), substitutions are pre-defined in content (not AI-generated), and dynamic variables are simple string interpolation. Resist overengineering.

## Common Pitfalls

### Pitfall 1: Floating Point Scaling Artifacts
**What goes wrong:** Scaling 1 tatlı kaşığı by 1.5x gives 1.5000000001 due to IEEE 754.
**Why it happens:** JavaScript floating point arithmetic.
**How to avoid:** Round scaled amounts: `Math.round(amount * multiplier * 10) / 10` (one decimal place). For display, use a smart formatter: show "1.5" not "1.50", show "2" not "2.0".
**Warning signs:** Amounts like "0.30000000000000004" appearing in UI.

### Pitfall 2: Swap State Lost on Navigation
**What goes wrong:** User swaps ingredients on detail screen, navigates to cooking mode, swaps are gone.
**Why it happens:** Adaptation state lives in detail screen hook, not persisted to session.
**How to avoid:** Save `adaptedServings` and `ingredientSwaps` to cooking_sessions before navigating to cook screen. Cook screen reads from session on mount.
**Warning signs:** Cooking mode shows original ingredient names/amounts after user made swaps.

### Pitfall 3: Step Variables Not in Existing Recipe Content
**What goes wrong:** ADAPT-03 requires dynamic variables in step text, but all 30 existing recipes have hardcoded ingredient names/amounts in instructions.
**Why it happens:** Recipe content was authored before this feature was designed.
**How to avoid:** This is a content migration task. Add a plan step that updates recipe YAML files to use `{{variable}}` syntax where ingredient references appear in step instructions. Start with a few key recipes, not all 30.
**Warning signs:** Dynamic variables feature "works" but no recipe actually uses it.

### Pitfall 4: IngredientsSheet Shows Swap for All Ingredients
**What goes wrong:** Every ingredient row shows "Elimde yok" button, even those with no alternatives defined.
**Why it happens:** Current IngredientsSheet already renders a swap button for every row (placeholder).
**How to avoid:** Only show swap button when `ingredient.alternatives` array exists and has entries.
**Warning signs:** User taps swap on an ingredient with no alternatives and gets an error/empty state.

### Pitfall 5: Stepper Allows Invalid Servings
**What goes wrong:** User decrements servings to 0 or negative, or increments to absurd numbers.
**Why it happens:** No bounds on stepper.
**How to avoid:** Clamp servings to min=1, max=recipe.servings * 4 (or a fixed max like 20). Disable minus button at min, plus button at max.
**Warning signs:** Division by zero or astronomical ingredient quantities.

### Pitfall 6: Cooking Mode IngredientsSheet Not Adapted
**What goes wrong:** IngredientsSheet in cooking mode shows original amounts, not scaled/swapped.
**Why it happens:** Cooking screen passes raw `recipe.ingredientGroups` to IngredientsSheet.
**How to avoid:** Cooking screen must reconstruct adaptation from session data and pass adapted ingredient groups to IngredientsSheet.
**Warning signs:** Mismatch between step text (adapted) and ingredient list (raw).

## Code Examples

### Serving Stepper Component
```typescript
// components/recipe/serving-stepper.tsx
interface ServingStepperProps {
  value: number;
  originalValue: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function ServingStepper({ value, originalValue, min = 1, max = 20, onChange }: ServingStepperProps) {
  const isModified = value !== originalValue;
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={[styles.button, value <= min && styles.buttonDisabled]}
      >
        <MaterialCommunityIcons name="minus" size={18} color={value <= min ? '#D1D5DB' : '#E07B39'} />
      </Pressable>
      <Text style={[styles.value, isModified && styles.valueModified]}>
        {value} kisi
      </Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={[styles.button, value >= max && styles.buttonDisabled]}
      >
        <MaterialCommunityIcons name="plus" size={18} color={value >= max ? '#D1D5DB' : '#E07B39'} />
      </Pressable>
    </View>
  );
}
```

### Schema Extension for Substitutions
```typescript
// Addition to IngredientSchema in recipe.ts
const SubstitutionSchema = z.object({
  name: z.string().min(1),       // e.g., "Zeytinyagi"
  amount: z.number().positive(), // may differ from original
  unit: UnitEnum,
});

export const IngredientSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  unit: UnitEnum,
  optional: z.boolean().default(false),
  alternatives: z.array(SubstitutionSchema).default([]),  // NEW
  scalable: z.boolean().default(true),                     // NEW: false for "1 tutam tuz"
});
```

### YAML Content with Substitutions
```yaml
ingredientGroups:
  - label: null
    items:
      - name: Tereyagi
        amount: 1
        unit: yemek kasigi
        optional: false
        alternatives:
          - name: Zeytinyagi
            amount: 1
            unit: yemek kasigi
        scalable: true
      - name: Tuz
        amount: 1
        unit: tutam
        optional: false
        alternatives: []
        scalable: false  # don't scale "1 tutam"
```

### Amount Formatting
```typescript
function formatAmount(amount: number): string {
  if (Number.isInteger(amount)) return String(amount);
  // One decimal max, strip trailing zero
  const rounded = Math.round(amount * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
// formatAmount(1.0) -> "1"
// formatAmount(1.5) -> "1.5"
// formatAmount(2.333) -> "2.3"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| IngredientsSheet swap button shows alert placeholder | Functional swap with pre-defined alternatives | Phase 10 | Enables ADAPT-02 |
| Fixed servings display ("2 kisi") | Interactive stepper with proportional scaling | Phase 10 | Enables ADAPT-01 |
| Hardcoded ingredient refs in step text | Dynamic variable resolution | Phase 10 | Enables ADAPT-03 |

**Existing placeholders already in code:**
- `IngredientsSheet.handleSwap()` shows `Alert.alert('Yakin zamanda!')` -- ready to be replaced
- Recipe detail shows `{recipe.servings} kisi` in metadata row -- ready for stepper
- Step preview already renders step titles -- success criterion 5 is already met

## Open Questions

1. **How many recipes need dynamic variable content?**
   - What we know: All 30 recipes currently have hardcoded text in step instructions. Variable syntax needs to be authored into the YAML.
   - What's unclear: Should all 30 be migrated, or just a representative subset for v1?
   - Recommendation: Migrate 5-10 key recipes that frequently reference ingredient amounts in steps (menemen, borek, etc.). The rest can be done incrementally. The system works with or without variables -- unresolved `{{}}` patterns simply stay as-is (graceful degradation).

2. **Should "scalable: false" be the default or explicit?**
   - What we know: Most ingredients should scale. "tutam" (pinch), "demet" (bunch) are edge cases.
   - What's unclear: How many ingredients across 30 recipes are non-scalable?
   - Recommendation: Default `scalable: true` in schema. Only mark false explicitly for "tutam" and "demet" units. Can be pattern-matched: if unit is "tutam", auto-treat as non-scalable without explicit flag.

3. **Step preview (success criterion 5) -- any changes needed?**
   - What we know: The current recipe detail screen already shows step titles as read-only pastel boxes with number badges and timer indicators.
   - What's unclear: The requirement says "step titles as read-only inline list" -- the current implementation already does this.
   - Recommendation: Current step preview meets the requirement. No changes needed unless user wants a different visual treatment.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + jest-expo ~54.0.17 |
| Config file | package.json `jest` section |
| Quick run command | `npx jest --testPathPattern=adaptation --no-coverage -x` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADAPT-01 | Serving scaler scales all ingredient amounts proportionally | unit | `npx jest __tests__/recipe-adaptation.test.ts -x` | No -- Wave 0 |
| ADAPT-01 | Adapted servings persisted to cooking session | unit | `npx jest __tests__/cooking-session.test.ts -x` | Yes (extend) |
| ADAPT-02 | Ingredient swap replaces name in adapted output | unit | `npx jest __tests__/recipe-adaptation.test.ts -x` | No -- Wave 0 |
| ADAPT-02 | Swap button only shown when alternatives exist | unit | `npx jest __tests__/recipe-adaptation.test.ts -x` | No -- Wave 0 |
| ADAPT-03 | Dynamic variables in step text resolve to adapted values | unit | `npx jest __tests__/recipe-adaptation.test.ts -x` | No -- Wave 0 |
| ADAPT-03 | Unresolved variables left as-is (graceful degradation) | unit | `npx jest __tests__/recipe-adaptation.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest __tests__/recipe-adaptation.test.ts --no-coverage -x`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/recipe-adaptation.test.ts` -- covers ADAPT-01, ADAPT-02, ADAPT-03 (pure logic tests, no DB/render context needed)
- [ ] Extend `__tests__/cooking-session.test.ts` -- add adapted servings/swaps persistence tests
- [ ] Schema test update in `__tests__/schema.test.ts` -- validate new `alternatives` and `scalable` fields

## Sources

### Primary (HIGH confidence)
- Project codebase direct inspection: `src/types/recipe.ts`, `app/recipe/[id].tsx`, `app/recipe/cook/[id].tsx`, `src/db/cooking-session.ts`, `src/db/client.ts`, `components/cooking/ingredients-sheet.tsx`, `components/cooking/step-content.tsx`
- Project decisions from `.planning/STATE.md` -- hook extraction pattern, immediate-save UX, session singleton
- Project requirements from `.planning/REQUIREMENTS.md` -- ADAPT-01, ADAPT-02, ADAPT-03 specifications

### Secondary (MEDIUM confidence)
- Existing recipe YAML content (`content/recipes/menemen.yaml`) -- verified ingredient structure, step text patterns
- Memory file `project_v1_pivot.md` -- confirmed serving scaler and substitution are planned features

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, all features use existing primitives
- Architecture: HIGH -- follows established project patterns (hook extraction, session persistence, Zod schemas)
- Pitfalls: HIGH -- identified from direct code inspection of existing components and data flow
- Content migration (dynamic variables): MEDIUM -- scope of YAML updates across 30 recipes needs clarification

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable -- no external dependencies involved)
