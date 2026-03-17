# Feature: Recipe Detail

## What This Feature Is

The screen Yagiz sees after tapping any recipe card — from Feed, Search, or Cookbook. Where he decides whether to cook, reviews ingredients, adjusts serving size, handles missing ingredients, and starts cooking.

## Why It Exists

This screen sits at the most critical moment — the decision to cook. It has two jobs:
1. Give Yagiz enough information to confidently commit without overwhelming him
2. Let him resolve any blockers before starting (missing ingredient, wrong serving size)

If either fails, Yagiz abandons the recipe.

## Serving Size Scaler

Tappable servings pill on main screen. Tapping expands inline stepper (- / +). All ingredient quantities update proportionally. Adjustment carries forward into Cooking Mode.

## Step Preview

Steps pill shows total step count. Tapping expands inline list of step titles — read-only overview. No summaries, checkpoints, or warnings. Titles only.

## Ingredients Bottom Sheet

"View Ingredients" opens bottom sheet. Shows full ingredient list with quantities reflecting current serving size.

For ingredients with pre-defined alternatives, "Elimde yok" (Swap) button appears inline. Tapping reveals alternatives. Full substitution behaviour defined below.

Start Cooking accessible from bottom of ingredients sheet — no need to close and return.

## Ingredient Substitution

- Pre-defined alternatives per ingredient stored in DB (generated at recipe creation, manually reviewed)
- Max 2 alternatives per ingredient
- Not generated at runtime — instant response
- Each alternative optionally carries a one-line honesty note (shown before confirming, only when substitution meaningfully changes the dish)
- On selection: ingredient row updates in place with highlight animation
- Swap held in session state, passed into Cooking Mode on Start Cooking
- Step copy in Cooking Mode uses dynamic variables — substituted ingredient name renders automatically, no contradictions

## Start Cooking

Passes into Cooking Mode: recipe, adjusted serving size, active ingredient swaps. Cooking Mode renders entirely from this state — never reads recipe defaults.

## What This Feature Is Not

- Not a configuration screen for cooking mode (all adaptation here, cooking is execution only)
- Not a full recipe breakdown (detailed instructions in Cooking Mode only)

## Data Requirements

### Serving Size Scaler
- Default serving size defined at recipe level
- All quantities scale proportionally
- Adjusted quantities carry into Cooking Mode via dynamic variables

### Ingredient Substitution
- Alternatives stored per ingredient in DB
- Max 2 alternatives per ingredient
- Honesty note: optional one-line string, nullable
- Swap state: session-only, passed to Cooking Mode

### Step Preview
- Step titles stored as separate field from full step content
- Pre-written at recipe creation, not generated dynamically

### Dynamic Variables (structural requirement)
- Ingredient references in step copy are NOT hardcoded strings
- They resolve to active ingredient (original or substituted) at cook time
- Must be built from the start — retrofitting flat strings later is painful

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| Adjusts serving then swaps ingredient | Substituted quantity reflects adjusted serving, not original. |
| Opens ingredient sheet, no changes, closes | No state change. Start Cooking uses defaults. |
| Start Cooking without opening ingredient sheet | Defaults for serving size, no swaps. |
| Preview Steps before adjusting serving | Shows default. Read-only, does not reflect unapplied changes. |
