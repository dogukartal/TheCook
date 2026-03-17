# The Cook

## What This Is

The Cook is a personalized cooking companion for 18–30 year-olds in Turkey who want to cook at home but keep stopping before they start. They are not helpless in the kitchen — they can boil pasta, make eggs, put together a basic sandwich. What they lack is a way out of the loop: they know three or four meals, rotate through them, get bored, order food, feel guilty, cook one of their three meals again. The Cook breaks that loop.

You pick something that looks good — something trendy, satisfying, better than your usual rotation — and the app makes sure it fits your dietary needs, your skill level, and your actual kitchen tools. Then it walks you through it, step by step, without assuming you already know what you are doing.

## Core Promise

The Cook is not a cooking school. It is the shortest path between "I want to make something different tonight" and a finished meal you are proud of.

## Jobs to Be Done

| # | Job |
|---|-----|
| 1 | Eat something that is not delivery or the same three meals |
| 2 | Cook something in under 30 minutes |
| 3 | Not waste the ingredients sitting in my fridge |
| 4 | Feel like a functioning adult who made something real |
| 5 | Not miss out on a dish that is trending or looks genuinely good |
| 6 | Learn one technique I can quietly reuse without having to look it up again |

## Primary Persona

**Yagiz, 24** — Solo renter in Kadikoy, Istanbul. Works at a tech startup. Moved out 18 months ago.

Knows how to cook, just not many things. Three or four recipes in rotation — pasta, some kind of chicken, eggs. He actually enjoys cooking when he does it. The problem is his repertoire ran out and he has no reliable way to expand it.

He does not search for recipes habitually. Content creator reference: Emir Eli Demir — beginner-friendly, fast, Gen Z manner. His comfort zone is back-of-package instructions: short, formatted, right in front of him.

Dishes he'd immediately want: smash burger, creamy garlic pasta, crispy rice bowl with fried egg, upgraded instant ramen.

**Decision moment:** Gets home at 7:30pm tired. Either end of month (money tight) or after a streak of restaurant meals.

## The Five Segments

| Segment | Age | Status | MVP Focus |
|---------|-----|--------|-----------|
| Yagiz — Solo Renter | 20–27 | Recently moved out | **Primary — MVP built around him** |
| Ege — Bored Repeater | 24–32 | Cooks regularly, stuck in a rut | v1.1+ |
| Gorkem — University Student | 18–23 | Shared flat, tight budget | v1.1+ |
| Bora — Health-Conscious Optimizer | 22–30 | Gym-going, macro tracker | v1.1+ |
| Zeynep — Constrained Cook | 20–28 | Dietary rules or allergies | v1.1+ |

## Three Value Pillars

### Pillar 1 — A Recipe That Already Fits You

Before you see a single recipe, the app knows your dietary rules, how many people you are cooking for, and your skill level. Every recipe on your feed has already been matched to your situation. Personalization is the starting point, not a feature you find.

### Pillar 2 — The Recipe Adapts, Not You

Change a serving size — quantities update everywhere. Mark an ingredient as unavailable — substitution offered with honest notes. The burden of adaptation is removed from the user.

### Pillar 3 — It Stays With You While You Cook

Each step has a photo so you know what you are aiming at. A checkpoint tells you what you should see or feel before moving forward. An "I'm stuck" shortcut surfaces the most common failure points. A chatbot (Sef'im) knows which recipe you are on and which step you are at — answers like a friend in the kitchen.

## What Makes The Cook Different

| Alternative | Problem |
|-------------|---------|
| Delivery apps | Zero effort, recurring cost, same food |
| TikTok / YouTube | Interesting but chaotic, hard to follow while cooking, skips steps |
| ChatGPT | Useful but no awareness of kitchen, tools, or current step |
| Back of package | Works but limited to what you buy |

**The Cook wins on:**
1. Present during cooking, not just before (Sef'im knows the recipe and step)
2. Speaks his kitchen reality (one pan, an Ikea pot, no oven thermometer)
3. Removes adaptation work (serving size, missing ingredients, dietary rules)
4. Explains without assuming (plain-language Turkish for every technique)

## Profile — Hard vs Soft Filters

| Field | Type | Effect |
|-------|------|--------|
| Skill level | Hard filter | Recipes above skill ceiling never surface |
| Kitchen tools | Hard filter | Recipes requiring unselected tools never surface |
| Dietary restrictions | Hard filter | Violated restrictions never surface |
| Cuisine preferences | Soft preference | Feeds AI ranking (order, not eligibility) |
| App goals | Soft preference | Feeds feed section weighting (prominence, not eligibility) |

All profile changes take effect on next feed load. No real-time re-filtering of current screen.

## App Structure

**Four tabs:** Feed / Search / Cookbook / Profile

- **Feed** — 4 horizontal sections: Su an trend, 30 dakikada bitir, Sana ozel, Denemediklerin. Passive discovery. AI-driven personalization for Sana ozel.
- **Search** — Search bar (keyword against recipe names + ingredients) + category strip. Search results: dietary-only filter. Category results: optional skill/tool filter panel.
- **Cookbook** — Kaydedilenler (saved) + Gecmis (cooking history). Completion auto-logs to Gecmis.
- **Profile** — All preference fields, editable. Changes propagate on next feed load.

**Recipe Detail** — Serving size scaler, ingredient substitution ("Elimde yok"), step preview, Start Cooking.

**Cooking Mode** — Full-screen step-by-step. Step image + action + Boyle gorunmeli (checkpoint) + Dikkat et! (warning). Nav bar hidden. Exit confirmation modal. Completion → celebration → rating → Gecmis.

**Sef'im** — AI companion in cooking mode. 3 pre-loaded Q&A chips per step (instant). Open text/voice → live AI call. Pulse when lingering. Context-aware (recipe, step, skill, swaps).

## Context

- **Audience:** Turkish 18–30 year-olds; primary language Turkish
- **Content ownership:** Hira owns and produces the hand-curated recipe library and social media content
- **Go-to-market:** Zero paid ads; ~10,000 TL budget directed at content creation. Organic flywheel through Hira's authentic social videos
- **AI usage:** Claude (or equivalent) powers Sef'im companion, Sana ozel ranking, and future goal-aware adaptation
- **Content model:** Hand-curated core (30–50 recipes) validates the model; AI-generated expansion comes later

## Constraints

- **Platform:** iOS + Android (Expo / React Native)
- **Language:** Turkish (primary); English in v1.1
- **Team:** Small / solo build; content pipeline owned by Hira; frontend collaborator planned
- **Budget:** ~10,000 TL marketing budget; no paid UA in v1
- **Monetization:** Not decided; no paywall in v1

## Out of Scope

| Feature | Reason |
|---------|--------|
| Calorie / macro display | Cooking enabler, not health tracker; numbers change the product identity |
| Meal planning / weekly schedules | Too much friction for target audience |
| Social features (sharing, following) | GTM happens on external platforms |
| In-app video content | Text + photo per step is sufficient; video on Hira's channels |
| Monetization / paywall | Deferred to post-validation |
| AI-generated recipe expansion | v1 is hand-curated only |
| Language toggle | Turkish only at MVP; English in v1.1 |

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Skill level + equipment = hard filters | If Yagiz can't make it, don't show it — reduces overwhelm |
| 4-tab nav (Feed/Search/Cookbook/Profile) | Each tab serves a distinct mental state |
| Feed sections over algorithmic scroll | Named sections (trend, fast, personal, novel) are legible and trustworthy |
| Sef'im as pre-loaded + AI hybrid | Instant answers for common questions, AI fallback for everything else |
| Dynamic variables in step copy | Ingredient refs resolve at cook time — serves scaler + substitution |
| Screen data hooks for parallel work | Backend/frontend developers can work without merge conflicts |

---
*Last updated: 2026-03-17 — product vision evolved after Phase 6 completion*
