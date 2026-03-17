---
phase: 10-recipe-detail-evolution
verified: 2026-03-17T19:30:00Z
status: human_needed
score: 5/6 must-haves verified (automated); criterion 6 requires human confirmation
human_verification:
  - test: "Open Menemen recipe detail. Tap + to increase servings to 4. Verify all scalable ingredient amounts double (e.g., 8 Yumurta) while Tuz, Karabiber remain at original quantities."
    expected: "ServingStepper stepper visible in metadata row. Scalable quantities update in real-time. Non-scalable (scalable=false) ingredients unchanged."
    why_human: "Real-time React state update and UI rendering cannot be confirmed by static grep."
  - test: "Tap 'Elimde yok' next to Tereyagi in the ingredients list. Verify it swaps to Zeytinyagi. Tap 'Geri al' to revert. Verify ingredients without alternatives show no swap button."
    expected: "Swap button only on Tereyagi (has alternatives). After swap, 'Geri al' appears. Ingredients without alternatives (Yumurta, Domates, etc.) show no swap button."
    why_human: "Conditional rendering and tap interaction cannot be verified statically."
  - test: "Set servings to 4, tap 'Pismek Baslat'. In cooking mode, open Malzemeler sheet. Verify ingredient amounts are 2x scaled. Verify swap buttons ('Elimde yok') appear for ingredients with alternatives."
    expected: "Adapted servings carry forward. Malzemeler sheet reflects adapted (scaled/swapped) groups. Swap buttons functional in cooking mode."
    why_human: "Session persistence, navigation, and cooking mode rendering requires live device/simulator."
  - test: "In cooking mode with Menemen, navigate to step 2 ('Soğan ve biberi kavurun'). Verify the instruction text shows resolved ingredient references (e.g., '1 yemek kaşığı Tereyağı' not '{{Tereyağı.amount}} ...'). If Tereyağı was swapped, verify step text shows 'Zeytinyağı' instead."
    expected: "Dynamic variables {{Tereyağı.amount}}, {{Tereyağı.unit}}, {{Tereyağı.name}}, {{Yumurta.amount}} etc. resolve to adapted values."
    why_human: "Variable resolution in rendered step text requires live rendering verification."
  - test: "On recipe detail screen, confirm two 'Pismek Baslat' buttons are present: one fixed at the bottom of the screen, and one inline after the ingredients list (before the steps section)."
    expected: "Both buttons call startCooking and navigate to cooking mode. The inline button is positioned between the ingredient list and the steps preview."
    why_human: "UI placement and navigation trigger require visual and interactive confirmation."
---

# Phase 10: Recipe Detail Evolution Verification Report

**Phase Goal:** Add serving size scaling, ingredient substitution, and step preview to the recipe detail page — all adaptation happens before cooking starts
**Verified:** 2026-03-17T19:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from phase success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Serving size scaler (inline stepper) proportionally adjusts all ingredient quantities | ? NEEDS HUMAN | ServingStepper wired in [id].tsx line 234-238; scaleIngredientGroups logic verified by 4 passing tests |
| 2 | Adjusted serving size carries forward into Cooking Mode | ? NEEDS HUMAN | startCooking persists adaptation.servings to session (useRecipeDetailScreen.ts line 112); cook/[id].tsx restores from session lines 108-115 |
| 3 | Ingredients with pre-defined alternatives show "Elimde yok" swap button | ? NEEDS HUMAN | Conditional render in [id].tsx line 281: `hasAlts && !isSwapped`; IngredientsSheet line 171: `item.hasAlternatives && !item.isSwapped` |
| 4 | Swapped ingredients reflect in step copy via dynamic variables (not hardcoded strings) | ? NEEDS HUMAN | resolveStepVariables wired via adaptedSteps (useRecipeAdaptation.ts lines 134-140); 5 passing tests confirm logic |
| 5 | Step preview shows step titles as read-only inline list | VERIFIED | [id].tsx lines 321-351 renders adaptation.adaptedSteps with pastel boxes; step.title or instruction fallback shown |
| 6 | Start Cooking accessible from both main screen and ingredients bottom sheet | ? NEEDS HUMAN | Two buttons in [id].tsx confirmed (fixed bottom bar lines 359-370; inline after ingredients lines 308-317). Note: "ingredients bottom sheet" in criterion refers to the inline button in the ingredients *section* of the detail screen, not the IngredientsSheet cooking modal — this matches Plan 03 how-to-verify step #6 wording |

**Automated score:** 5/6 truths have verified implementation (1 definitively confirmed by static analysis; 5 require human confirmation of rendering/interaction)

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `TheCook/src/types/recipe.ts` | VERIFIED | SubstitutionSchema (line 80), IngredientSchema with alternatives (line 91) + scalable (line 92), Substitution type exported (line 147) |
| `TheCook/src/db/client.ts` | VERIFIED | DB_VERSION = 7 (line 3); migration v7 adds adapted_servings INTEGER + ingredient_swaps TEXT DEFAULT '{}' (lines 110-115) |
| `TheCook/src/db/cooking-session.ts` | VERIFIED | CookingSession interface includes adaptedServings: number \| null (line 14) and ingredientSwaps: Record<string, string> (line 15); saveSession and getActiveSession fully handle both fields |
| `TheCook/src/hooks/useRecipeAdaptation.ts` | VERIFIED | Exports formatAmount, scaleIngredientGroups, applySwaps, resolveStepVariables (pure functions) + useRecipeAdaptation hook (172 lines, well above 60-line minimum) |
| `TheCook/src/hooks/useRecipeDetailScreen.ts` | VERIFIED | Exports useRecipeDetailScreen; composes useRecipeAdaptation; startCooking persists adaptation.servings + adaptation.swaps to session (lines 105-117) |
| `TheCook/components/recipe/serving-stepper.tsx` | VERIFIED | ServingStepper renders +/- controls with min/max bounds, disabled states, and visual modification indicator (isModified color change line 97) |
| `TheCook/app/recipe/[id].tsx` | VERIFIED | Uses useRecipeDetailScreen (line 15+123); renders ServingStepper (line 234); adaptedGroups for ingredients (line 256); swap buttons conditional on alternatives (line 281); adaptedSteps for preview (line 321); two Start Cooking buttons (lines 308-317, 359-370) |
| `TheCook/app/recipe/cook/[id].tsx` | VERIFIED | Imports useRecipeAdaptation (line 24); restores adaptation from session (lines 108-115); passes adaptation.adaptedSteps to PagerView (line 431); passes adaptation.adaptedGroups to IngredientsSheet (line 475); wires onSwap + onResetSwap (lines 480-482) |
| `TheCook/components/cooking/ingredients-sheet.tsx` | VERIFIED | Accepts onSwap, onResetSwap, swaps props (lines 26-29); conditional "Elimde yok" button (line 171); "Geri al" button (line 181); formatAmount display (line 67) |
| `TheCook/__tests__/recipe-adaptation.test.ts` | VERIFIED | 15 implemented tests (not todos) — all pass: scaleIngredientGroups (4 tests), applySwaps (3), resolveStepVariables (5), formatAmount (3) |
| `TheCook/content/recipes/menemen.yaml` | VERIFIED | Tereyağı has alternatives (Zeytinyağı, lines 48-52); Tuz scalable:false (line 56); Karabiber scalable:false (line 62); dynamic vars in step 2 ({{Tereyağı.amount}} {{Tereyağı.unit}} {{Tereyağı.name}}) and step 4 ({{Yumurta.amount}} {{Yumurta.unit}} {{Yumurta.name}}) |
| `TheCook/content/recipes/borek.yaml` | VERIFIED | Zeytinyağı has alternatives (Tereyağı, lines 43-46); Tuz scalable:false; dynamic vars in step 2 ({{Yumurta.amount}}, {{Süt.amount}}, {{Zeytinyağı.amount}}, {{Zeytinyağı.name}}) |
| `TheCook/content/recipes/mercimek-corbasi.yaml` | VERIFIED | Zeytinyağı has alternatives (Tereyağı, lines 47-50); Kimyon scalable:false; dynamic vars in step 1 ({{Kırmızı mercimek.amount}} {{Kırmızı mercimek.unit}}) and step 2 ({{Zeytinyağı.amount}} {{Zeytinyağı.unit}} {{Zeytinyağı.name}}) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/recipe/[id].tsx` | `useRecipeDetailScreen` | import + call | WIRED | Line 15 import, line 116-123 destructure |
| `app/recipe/[id].tsx` | `serving-stepper.tsx` | ServingStepper render | WIRED | Line 16 import, line 234 render with adaptation.servings |
| `app/recipe/cook/[id].tsx` | `useRecipeAdaptation` | import + hook call | WIRED | Line 24 import, line 64 hook call, lines 431+475 use adaptedSteps/adaptedGroups |
| `components/cooking/ingredients-sheet.tsx` | `recipe.ts` | alternatives field access | WIRED | Line 14 imports IngredientGroup; line 68 `item.alternatives` access |
| `useRecipeAdaptation.ts` | `recipe.ts` | imports Recipe, IngredientGroup types | WIRED | Line 2: `import type { Recipe, IngredientGroup } from "../types/recipe"` |
| `useRecipeDetailScreen.ts` | `useRecipeAdaptation.ts` | composes hook | WIRED | Line 17 import, line 40 `const adaptation = useRecipeAdaptation(recipe ?? null)` |
| `useRecipeAdaptation.ts` | `recipe-adaptation.test.ts` | exported pure functions tested directly | WIRED | Test file imports scaleIngredientGroups, applySwaps, resolveStepVariables, formatAmount (lines 4-9) |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| ADAPT-01 | 10-01, 10-02, 10-03 | User can adjust serving size; quantities scale proportionally and carry into cooking mode | SATISFIED | ServingStepper wired; scaleIngredientGroups tested (4 passing tests); session persists adaptedServings; cook screen restores from session |
| ADAPT-02 | 10-01, 10-02, 10-03 | User can swap missing ingredient for pre-defined alternative ("Elimde yok"); reflected in step copy | SATISFIED | applySwaps tested (3 passing tests); "Elimde yok" button conditional on alternatives.length > 0; cook screen wires onSwap + onResetSwap; adaptedSteps resolve after swaps |
| ADAPT-03 | 10-01, 10-02, 10-03 | Step copy uses dynamic variables that resolve to active (scaled/substituted) state at cook time | SATISFIED | resolveStepVariables tested (5 passing tests); adaptedSteps computed from ingredientMap post-swap; 3 YAML recipes use {{IngredientName.field}} syntax; StepContent renders step.instruction which receives resolved text |

No orphaned requirements — all ADAPT-01, ADAPT-02, ADAPT-03 are accounted for across all 3 plans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/recipe/cook/[id].tsx` | 127 | Comment `// Timer still has time — manual start per CONTEXT.md` with empty block (no actual timer restore) | INFO | Timer state not restored from session — pre-existing behavior, out of Phase 10 scope |

No PLACEHOLDER, TODO, stub returns, or empty implementations found in Phase 10 files.

### Human Verification Required

The automated layer is fully verified — all logic is implemented, tested, and wired. The following require human confirmation of rendered UI behavior:

#### 1. Serving Scaler — Real-Time Quantity Update

**Test:** Navigate to Menemen recipe detail. Tap "+" stepper to set servings from 2 to 4. Observe ingredients list.
**Expected:** Yumurta shows 8 adet (was 4), Domates shows 600gr (was 300gr), Tereyağı shows 2 yemek kaşığı (was 1). Tuz remains 1 tatlı kaşığı, Karabiber remains 1 tutam.
**Why human:** React state update driving real-time re-render cannot be verified by static analysis.

#### 2. Swap Button Conditional Rendering

**Test:** On Menemen recipe detail, inspect the ingredients list. Find Tereyağı and an ingredient without alternatives (e.g., Yumurta, Domates).
**Expected:** "Elimde yok" button appears only next to Tereyağı. No button appears next to Yumurta, Domates, Soğan, Karabiber, Beyaz peynir.
**Why human:** Conditional render based on `alternatives.length > 0` requires visual confirmation.

#### 3. Adapted Servings Carry Forward to Cooking Mode

**Test:** Set servings to 4 on Menemen, then tap "Pismek Baslat". In cooking mode, open Malzemeler sheet.
**Expected:** Ingredients show 2x amounts (Yumurta: 8, Domates: 600gr etc.). Tereyağı shows "Elimde yok" button. Non-scalable items unchanged.
**Why human:** Session persistence → navigation → cooking mode render chain requires live execution.

#### 4. Dynamic Variables Resolve in Step Text

**Test:** In cooking mode for Menemen, navigate to step 2 ("Soğan ve biberi kavurun"). Read the instruction text.
**Expected:** Instruction shows actual ingredient values, not `{{Tereyağı.amount}}` literals. If servings doubled, shows "2 yemek kaşığı". If Tereyağı was swapped, shows "Zeytinyağı" instead.
**Why human:** Runtime variable resolution in rendered step text requires live verification.

#### 5. Two Start Cooking Buttons on Detail Screen

**Test:** On recipe detail screen, scroll through the full page.
**Expected:** One "Pismek Baslat" button pinned at bottom of screen. A second "Pismek Baslat" button appears inline after the ingredients list, before the steps section.
**Why human:** UI layout and scrollable position require visual confirmation.

### Gaps Summary

No gaps found in implementation. All 6 phase success criteria have complete implementation in the codebase:

1. **Serving scaler** — ServingStepper component wired, scaleIngredientGroups logic tested (4 tests), adaptedGroups displayed in [id].tsx
2. **Carry-forward to Cooking Mode** — startCooking persists adaptedServings; cook screen restores with setServings + swapIngredient calls
3. **"Elimde yok" conditional on alternatives** — Both [id].tsx and IngredientsSheet conditionally render based on alternatives.length > 0
4. **Dynamic variables in step copy** — resolveStepVariables tested (5 tests), adaptedSteps computed and passed to StepContent; 3 YAML recipes use {{}} syntax
5. **Step preview read-only list** — [id].tsx renders adaptation.adaptedSteps with pastel step boxes (static, no interactions)
6. **Start Cooking from two locations** — [id].tsx has fixed bottom button + inline post-ingredients button; both call startCooking

The 5 human verification items are behavioral confirmations, not gaps — the logic and wiring are all in place.

---

*Verified: 2026-03-17T19:30:00Z*
*Verifier: Claude (gsd-verifier)*
