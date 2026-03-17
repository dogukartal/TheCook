# Feature: Search

## What This Feature Is

The Search tab is where Yagiz goes when he has something specific in mind. Two entry points: a search bar for when he knows what dish or ingredient he wants, and a category strip for when he wants to browse a specific type of meal.

## Why It Exists

The Feed is for when Yagiz does not know what he wants. Search is for when he does. Keeping them separate means neither experience is compromised.

## Search Bar

Yagiz types a dish name or ingredient. Results appear inline below the category strip as he types — no search button. Keyword-based — matches against recipe names and ingredient lists.

**Search results are NOT filtered by skill level or tools.** Yagiz actively searching has made a deliberate choice — the app should not second-guess it. Dietary restrictions are the only hard filter on search results.

## Category Strip

Horizontally scrolling strip of category cards below the search bar. Tapping a category filters results below.

**MVP categories:** Pasta, Burgers, Breakfast, Desserts, Chicken, Soups, Rice & Grains, Meat.

Categories expandable in future versions as catalogue grows.

A filter panel is available on the top right of category results to further narrow by skill level and kitchen tools. Filters reset at end of each session.

## Results List

Compact list — thumbnail, recipe name, cook time. Updates in real time. Tapping any result opens Recipe Detail.

## Core Loops

**Ingredient loop:** Opens fridge, sees chicken, opens Search, types "tavuk." Results immediately. Taps one → Recipe Detail.

**Category loop:** Saturday morning, wants breakfast. Taps Breakfast, browses, applies filter if needed.

## What This Feature Is Not

- Not AI-powered (keyword matching only, no NLP)
- Does NOT filter search results by skill or tools (intentional)
- Category filters do NOT persist (session-only, reset on close or tab switch)

## Data Requirements

### Search
- Matches against recipe name and ingredient list fields
- Hard filter: dietary restrictions always applied
- No skill/tool filtering on search results
- Results update in real time as user types

### Category Results
- Hard filter: dietary restrictions always applied
- Skill level and tool filters available via filter panel, off by default
- Filter state is session-only
- Each recipe tagged with one or more categories at content creation time

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| Search returns zero results | "Sonuc bulunamadi." No fallback recipes. |
| Category results zero after filtering | Empty state prompting to adjust or clear filters. |
| Clears search bar | Results list clears. Default state with category strip. |
| Types and selects category simultaneously | Both apply — results match keyword AND category. |
