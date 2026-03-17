# Feature: Profile

## What This Feature Is

The Profile is where Yagiz's identity in the app lives. It is the single place where he views and edits the preferences that shape everything he sees — skill level, kitchen tools, dietary restrictions, cuisine preferences, and app goals.

## Why It Exists

Every field in the Profile is not a setting — it is a preference that directly affects the recipes Yagiz sees. Changing his skill level changes his feed. Adding an oven unlocks a new category of recipes. Updating his dietary restrictions ensures he never sees something he cannot eat.

The Profile should feel alive and connected to his experience — not a form he filled in once and forgot about. The causality between profile and feed is the mechanism that makes personalisation feel real rather than cosmetic.

## Cooking Profile Fields

All fields are collected during onboarding and editable here at any time. All changes take effect on the next feed load.

**Skill level** — four options: Total Beginner, Know the Basics, Cook Regularly, Pretty Advanced. Sets the complexity ceiling for all recipe surfaces in the app. This is a hard filter — recipes above Yagiz's skill level do not appear anywhere.

**Kitchen tools** — multi-select: Pan, Pot, Knife, Oven, Microwave. Determines which recipes are eligible to appear at all. This is a hard filter — a recipe requiring a tool Yagiz has not selected never surfaces, regardless of how well it matches his other preferences.

**Dietary restrictions** — predefined list, multi-select. Applied universally across the entire app. This is a hard filter — dietary restrictions are never overridden anywhere.

**Cuisine preferences** — the dish photo grid from onboarding, always editable. Feeds the AI ranking logic for Sana ozel.

**App goals** — why Yagiz is here. Multi-select. Feeds the feed weighting logic — selecting "I want to stop ordering delivery" surfaces quicker recipes, selecting "I want to try trending dishes" boosts the Su an trend section weight.

## Account Details

Name and email. Editable. Standard.

## Editing Pattern

Every field follows the same pattern: tap to expand inline, make the change, tap Save. Tapping away without saving discards the change silently. This pattern is consistent across every field.

## Hard Filters vs Soft Preferences

| Field | Type | When it applies |
|-------|------|-----------------|
| Skill level | Hard filter | Recipes above skill ceiling never surface anywhere |
| Kitchen tools | Hard filter | Recipes requiring an unselected tool never surface anywhere |
| Dietary restrictions | Hard filter | Violated restrictions never surface anywhere |
| Cuisine preferences | Soft preference | Feeds AI ranking score — affects order, not eligibility |
| App goals | Soft preference | Feeds feed weighting — affects section prominence, not eligibility |

## Change Propagation

All profile changes take effect on the next feed load. No real-time re-filtering of the current screen.

## What This Feature Is Not

- Not a settings screen (no notification preferences, privacy controls at MVP beyond name/email)
- Not a dashboard (no stats, cook counts, achievements)
- Language toggle not in MVP (Turkish only; English in v1.1)

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| Removes a kitchen tool | Recipes requiring that tool disappear on next load. Mid-cook unaffected. |
| Filter combination returns no results | Feed shows prompt to update profile. |
| Taps away without saving | Change silently discarded. No confirmation dialog. |
| Lowers skill level | Recipes above new ceiling disappear on next load. |
