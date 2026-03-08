# The Cook

## What This Is

The Cook is a personalized AI cooking companion for 18–30 year olds in Turkey who want to cook at home but are stuck in a narrow recipe rotation. Users tell the app what they have, what they want to achieve, and any dietary restrictions — and the app finds recipes they can actually make, then guides them step by step through cooking with real-time AI support if anything goes wrong. It is the shortest path between "I want to make something different tonight" and a finished meal they are proud of.

## Core Value

The user must never feel like the app gave them a recipe and walked away — every interaction, from ingredient input to the last step, must feel like having a knowledgeable friend in the kitchen.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Onboarding & Profile**
- [ ] User can declare dietary goal at onboarding (lose weight / gain muscle / maintain / no goal)
- [ ] User can declare allergens and dietary restrictions at onboarding (gluten, lactose, etc.)
- [ ] User can set skill level (beginner / intermediate / advanced)
- [ ] Profile is applied silently across all interactions — user is never asked to re-enter it

**Recipe Discovery**
- [ ] User can input available ingredients and receive recipe recommendations that match
- [ ] Recipe recommendations are filtered by allergens and restrictions automatically
- [ ] Recipe recommendations are surfaced by skill level (beginner recipes first for beginner users)
- [ ] User can browse a curated feed of recipes without inputting ingredients

**Goal-Aware Personalization**
- [ ] Recipes are quietly enhanced for the user's dietary goal (e.g. extra egg + feta for muscle gain users cooking menemen)
- [ ] Ingredient quantities and suggestions reflect user's goal without surfacing calorie tracking

**Guided Cooking**
- [ ] Cooking mode shows one step at a time — no scrolling through the full recipe while cooking
- [ ] Each step includes: what to do, why you're doing it, what it should look like when done
- [ ] Each step flags the most common mistake at that point and how to avoid it
- [ ] Built-in timers are triggered at steps that require timing
- [ ] User can ask "is this done?" / "did I do this right?" and get AI confirmation or correction

**AI Error Recovery**
- [ ] User can open a real-time AI chat mid-cook to ask about anything that's going wrong
- [ ] AI can suggest fixes ("I think I burned this — can I save it?") or confirm it's okay to continue
- [ ] AI suggestions respect user's allergens and restrictions

**Ingredient Flexibility**
- [ ] If a user is missing an ingredient, they can request a substitution
- [ ] Substitutions are aligned to dietary profile (not generic swaps)
- [ ] Substitution flagged when it changes the dish meaningfully

**Content Library**
- [ ] 30–50 hand-curated core recipes (beginner-friendly, deeply annotated, Turkish-relevant)
- [ ] Each recipe contains step-level: instruction, why, common mistakes, alternatives

### Out of Scope

- Calorie counting / macro tracking — we are a cooking enabler, not a health tracker; users declared their goal once and never see numbers
- Meal planning / weekly schedules — too much friction for v1 audience
- Social features (sharing, following) — organic GTM happens on external platforms (social media), not in-app
- Video content inside the app — recipe steps are text + photos; video content lives on Hira's social channels
- Monetization / paywalls — deferred to a later milestone
- AI-generated recipe library for v1 — expansion is future; v1 ships on the hand-curated core

## Context

- **Audience:** Turkish 18–30 year olds; primary language Turkish. Recipe names and examples are Turkish (menemen, etc.)
- **Content ownership:** Hira owns and produces the hand-curated recipe library and social media content
- **Go-to-market:** Zero paid ads; ~10,000 TL budget directed at content creation. Organic flywheel through Hira's authentic social videos ("I tried to make X for the first time with my dietary goal")
- **AI usage:** Claude (or equivalent) powers goal-aware recipe adaptation, real-time cooking guidance responses, substitution suggestions, and error recovery chat
- **Content model:** Hand-curated core (30–50 recipes) validates the model; AI-generated expansion comes in a later milestone with feedback monitoring
- **Competitive gap:** No existing product (YouTube, ChatGPT, recipe sites, MyFitnessPal) combines beginner-friendly step-by-step guidance with meaningful personalization. That is the gap this app fills.

## Constraints

- **Platform:** iOS + Android (cross-platform build — React Native or equivalent); both stores for v1
- **Language:** Turkish (primary); UI, recipe content, and AI responses in Turkish
- **Team:** Small / solo build; content pipeline owned by Hira
- **Budget:** ~10,000 TL marketing budget; no paid UA in v1
- **Monetization:** Not decided; no paywall implemented in v1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Cross-platform (iOS + Android) from day one | Turkish Android market share is high; limiting to iOS misses the primary audience | — Pending |
| No calorie/macro display | We are a cooking enabler, not a health tracker; showing numbers changes the product's feel | — Pending |
| Hand-curated core library first, AI expansion later | 30–50 deeply annotated recipes validate the model before scaling with AI content | — Pending |
| Monetization deferred | Prioritize user acquisition and concept validation before introducing friction | — Pending |

---
*Last updated: 2026-03-08 after initialization*
