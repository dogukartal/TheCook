# Feature: Cookbook

## What This Feature Is

The Cookbook is Yagiz's personal recipe space. Two tabs — Kaydedilenler (saved recipes) and Gecmis (cooking history) — in one place.

## Why It Exists

The Cookbook gives Yagiz a reason to open the app even when he is not about to cook. Browsing saved recipes, planning what to make, reviewing what he has already cooked — lightweight engagement moments that build habit.

Gecmis serves a quieter purpose: a record of progress. Over time it becomes visible evidence that Yagiz is expanding as a cook.

## Kaydedilenler — Saved Recipes

Every recipe Yagiz has bookmarked appears here, sorted by date saved (most recent first). A holding space between discovery and action.

Can remove a recipe directly from this tab without going to the recipe card.

## Gecmis — Cooking History

Every completed recipe is logged automatically when Yagiz taps "Pisirmeyi Bitirdim" — no manual input. Reverse chronological order. Each entry includes date cooked and star rating if submitted.

Partial cooks (exits before completing) are NOT logged.

## What This Feature Is Not

- Not a meal planner (no assigning recipes to days or weekly schedule)

## Data Requirements

### Kaydedilenler
- Populated by bookmark action (available on every recipe card)
- Sorted by date saved, most recent first
- Removing unsaves globally — bookmark icon updates everywhere immediately
- No cap on saved recipes

### Gecmis
- Entry written on "Pisirmeyi Bitirdim" tap
- Entry contains: recipe ID, recipe name, date/time completed, star rating (nullable)
- Partial cooks do not create entry
- Gecmis feeds the Denemediklerin section — any recipe in Gecmis is excluded from that section

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| Kaydedilenler empty | "Henuz kaydettigin tarif yok. Feed'de begendigin tarifleri kaydet." with Feed prompt. |
| Gecmis empty | "Henuz bir tarif pisirmedin. Ilk tarifini pisirmeye hazir misin?" with Feed prompt. |
| Removes from Kaydedilenler | Bookmark icon updates to unfilled everywhere immediately. |
| Cooks same recipe twice | Two separate Gecmis entries. Still excluded from Denemediklerin after first. |
