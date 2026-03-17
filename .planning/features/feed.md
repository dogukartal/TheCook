# Feature: Feed

## What This Feature Is

The Feed is the first screen Yagiz sees every time he opens the app. It is a vertically scrolling screen made up of four named, horizontally scrolling sections. He does not filter, search, or make any decision to get here — he just opens the app.

## Why It Exists

Yagiz's core problem is not that he cannot cook — it is that his recipe repertoire ran out and expanding it feels harder than ordering food. The Feed is the primary answer to this problem.

It serves two use cases: an evening decision moment when Yagiz needs to cook something now, and a daytime browse loop where he discovers and saves recipes for later. The second is arguably more important for retention.

## The Four Sections

All content is pre-filtered to Yagiz's profile before it reaches the screen. Section labels are fixed. Content inside each section refreshes dynamically.

**Su an trend — Trending Now**
Recipes that are popular right now, filtered to fit Yagiz's profile. Always the first section — speaks directly to "not missing out on a dish that is trending."

**30 dakikada bitir — Ready in 30 min**
Recipes Yagiz can finish in 30 minutes or less, matched to his tools and skill level. Speed is a filter, not a compromise.

**Sana ozel — Just for You**
Recipes with the highest AI match score for Yagiz. Day one: based on onboarding data alone. Over time: reflects cooking behaviour. Builds long-term retention.

**Denemediklerin — Not Tried Yet**
Recipes Yagiz has never cooked, deliberately surfacing novelty. Without this push, Yagiz defaults to the same meals.

New sections can be added in future versions.

## Section-Specific Logic (under consideration)

| Section | Current Direction |
|---------|-------------------|
| Su an trend | Ranked by trending score across all users. Factors (cook frequency, save rate, ratings, recency) under consideration. |
| 30 dakikada bitir | Hard filter: cook time <= 30 min. Ranking within filtered set under consideration. |
| Sana ozel | Ranked by AI match score. Factors (skill, tools, cuisine prefs, goals, history) and weighting under consideration. |
| Denemediklerin | Hard filter: not in Gecmis. Ranking within filtered set under consideration. |

## Feed Refresh

Content refreshes on each app open. Dynamic — evolves as behaviour changes and new recipes are added.

## Core Loops

**Evening loop:** Opens at 7:45pm, scrolls feed, card catches eye, taps it. Recipe Detail in two taps.

**Daytime loop:** Opens during lunch, bookmarks a smash burger and pasta. That evening opens Cookbook → Kaydedilenler, already knows what to make.

## What This Feature Is Not

- Not a search interface (Search is its own tab)
- Not a social feed (no comments, likes, shares, UGC at MVP)
- Not manually curated per user (AI-driven, section labels fixed, content dynamic)

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| Section returns zero recipes | Section hidden entirely — no empty state, no gap in layout. |
| Cooked every recipe in Denemediklerin | Surface lowest-rated or oldest cooked as fallback. Never show empty section. |
| No cooking history (day one) | Sana ozel ranks on onboarding data. Denemediklerin shows all recipes. |
| Very restrictive filters | Sections hidden silently if zero results. If ALL sections empty, full-screen prompt to update profile. |
