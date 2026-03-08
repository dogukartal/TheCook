# Feature Landscape

**Domain:** AI-powered personalized mobile cooking companion
**Audience:** Turkish 18-30 year olds, narrow recipe rotation, beginner-to-intermediate skill
**Researched:** 2026-03-08
**Confidence note:** Web search and WebFetch tools were unavailable in this session. Analysis is based on training knowledge of the AI cooking app ecosystem (Whisk, Yummly, Mealime, PlantJammer, ChefGPT, Noodle, Flavorish, Samsung Food, Paprika, SideChef, BigOven, and market research through training cutoff August 2025). Confidence: MEDIUM. Claims rooted in well-established product patterns but not verified against 2026 live data.

---

## Table Stakes

Features users expect from any modern recipe/cooking app. Missing or broken = users leave immediately.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Recipe browsing with photos | Every recipe app since 2015 has this; text-only feels unfinished | Low | Strong hero photo per recipe is minimum; quality matters more than quantity |
| Search / filter by ingredient or dish name | Users arrive with "I have eggs, tomato, onion" — this is the entry point | Medium | Ingredient-matching logic must be fuzzy (partial matches surfaced, not zero results) |
| Allergen / dietary restriction filtering | GDPR-era awareness + health-conscious Gen Z baseline expectation | Medium | Must be set-once, always-applied — never re-prompted |
| Saved / favorited recipes | Basic content persistence; users expect to save things they like | Low | Needs offline access consideration |
| Readable recipe cards | Ingredient list, time, servings, difficulty — scannable at a glance | Low | Cognitive load matters; clean layout is table stakes |
| Step-by-step cooking mode | SideChef and Tasty normalized this; users expect one-step-at-a-time on mobile | Medium | Full-recipe scroll during cooking is considered poor UX since ~2020 |
| Built-in cooking timers | Every guided cooking app has this; missing it breaks the cooking flow | Low | Timer must survive screen lock and background |
| Skill-level indication on recipes | Yummly, Mealime, and most competitors surface difficulty — beginners rely on it | Low | Must match declared profile silently |
| Offline recipe access | Turkish mobile data costs and kitchen environments (greasy hands, wifi gaps) make this expected | Medium | At minimum: currently-open recipe must be cached |
| Turkish-language content | This is a Turkish-market product; English-only is a non-starter | Low | UI, recipe names, step instructions, AI responses — all Turkish |

---

## Differentiators

Features that are NOT expected but create meaningful competitive separation. The Cook's moat lives here.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Goal-aware silent personalization | No app in Turkey combines dietary goals with recipe adaptation without showing calorie data. Menemen adapted for muscle gain vs. weight loss vs. maintenance is genuinely novel. | High | The "silent" part is the hard design work — the AI must change quantities/suggestions without surfacing a tracker UI |
| Real-time AI chat mid-cook (error recovery) | ChatGPT can do this generically but breaks context (user has to explain the dish, their profile, the step). Having a contextual AI that knows what step you're on, what your profile is, and what the recipe is — is not available in any dedicated app | High | Context-window management is the engineering challenge: pass recipe state + user profile + current step into each AI call |
| "Why are you doing this?" annotations at every step | SideChef gives instructions. Serious Eats gives reasons. No mobile cooking app combines both at the step level for beginners. This is the "knowledgeable friend" moment. | Medium | Content labor-intensive (Hira must write these); AI cannot reliably generate them for v1 curated library |
| Common-mistake warnings per step | No competitor does per-step mistake flagging in a beginner-first format. Most errors are post-hoc (rating: "I burned it"). Pre-empting them is differentiated. | Medium | Also content-labor intensive; must be authored per step not generated |
| Profile-aware ingredient substitutions | Generic apps (BigOven, Supercook) offer substitutions. None check substitutions against your allergens + goal + skill level simultaneously. | Medium | Substitution engine: (ingredient out) + (user profile) → (ranked valid alternatives) |
| Curated Turkish recipe library with deep annotations | Turkey is underserved by English-dominant apps. A 30-50 recipe library of well-known Turkish dishes (menemen, mercimek çorbası, kısır, etc.) with beginner-level annotations has no direct competitor in-app. | Medium | This is a content moat, not a tech moat — but it is real and defensible in the short term |
| Onboarding that shapes the entire experience silently | Most apps ask for preferences and then largely ignore them. The Cook's value promise is that the profile is *always active* — every screen, every recommendation, every AI response. | High | Requires profile to be injected into every AI prompt and every recipe-ranking query |

---

## Anti-Features

Features to deliberately NOT build in v1 (and likely beyond for some). These are confirmed out-of-scope per PROJECT.md plus additional reasoning.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Calorie / macro display | Changes product identity from "cooking enabler" to "diet tracker"; alienates the 18-30 audience who have negative associations with calorie counting; creates regulatory/medical advice risk | Silently route goal-awareness through ingredient quantity adaptation; user benefits without seeing the numbers |
| Meal planning / weekly schedules | High friction for the target audience ("I want to cook *tonight*" mindset); complex to build correctly; locks users into commitment they won't keep | Stay in the moment — ingredient input → tonight's recipe |
| In-app social features (sharing, following, comments) | Social dynamics require critical mass; moderation burden; distracts from core loop; organic GTM works better on TikTok/Instagram anyway | Encourage sharing to external platforms; Hira's social content is the social layer |
| Video content inside the app | Storage costs, streaming costs, production pipeline complexity; photo + text is faster to produce and equally effective for steps | Hira's social videos live on Instagram/TikTok and drive app discovery; keep them separate |
| AI-generated recipe expansion in v1 | Quality control risk; AI-generated Turkish recipes will hallucinate quantities and culturally wrong techniques; "knowledgeable friend" promise breaks if content is wrong | Launch with 30-50 hand-curated, deeply annotated recipes; monitor and expand later |
| Grocery list / shopping cart integration | Useful but a separate product problem; adds scope without validating core loop | Out of scope for v1; consider v2 based on user feedback |
| Nutritional scoring / health grades | Same problem as calorie display — medicalizes the experience; creates liability | Not built |
| User-submitted recipes / UGC | Quality control, moderation, trust issues in v1 | Hira owns content pipeline; UGC deferred post-validation |
| Push notification campaigns | Annoying if not earned; need retention data first to build useful triggers | Post-launch, behavior-triggered notifications only (e.g., "You bookmarked this recipe 3 days ago") |
| Offline AI responses | Technically very hard (LLM on-device or edge); adds cost and complexity without proven need | Cache recipe content offline; AI chat requires network (acceptable tradeoff for v1) |

---

## Feature Dependencies

```
User Profile (onboarding) → ALL personalization features
  └─ Goal declaration → Goal-aware recipe adaptation
  └─ Allergen declaration → Recipe filtering, Substitution filtering, AI chat filtering
  └─ Skill level → Recipe surface order, Step annotation depth

Recipe Library (curated content) → ALL recipe features
  └─ Step annotations (why, mistakes) → Guided cooking mode
  └─ Step annotations → AI chat context (AI must know what step user is on)
  └─ Ingredient list → Ingredient matching (fridge → recipes)
  └─ Ingredient list → Substitution engine

Ingredient Matching → Recipe Discovery
  └─ Requires fuzzy matching (partial ingredient coverage surfaced, not hidden)

Guided Cooking Mode → AI Error Recovery chat
  └─ Chat must receive: current step index + recipe ID + user profile
  └─ Step-level timers are a sub-feature of guided mode

AI Error Recovery → Ingredient Substitution (overlapping surface)
  └─ "I don't have X" can be resolved in chat OR in a dedicated substitution flow
  └─ Both must consult the same substitution logic + profile filter

Substitution Engine → Profile (allergens + goal)
  └─ A substitution that introduces a declared allergen must be blocked at engine level, not UI level
```

---

## MVP Recommendation

### Prioritize (ship in v1)

1. **Onboarding + persistent profile** — goal, allergens, skill. Everything else fails without this.
2. **Curated recipe library (30-50 recipes)** with photos, ingredient lists, difficulty, step-level annotations. This is the content foundation.
3. **Ingredient-based recipe discovery** — fridge input → matching recipes filtered by profile. Core discovery loop.
4. **Guided cooking mode** — one step at a time, why/mistake annotations, built-in timers. The primary retention mechanic.
5. **Real-time AI chat mid-cook** — error recovery with recipe + profile context. This is the differentiating experience moment.
6. **Goal-aware recipe adaptation** — silent quantity/suggestion adjustments based on declared goal.
7. **Profile-aware substitutions** — missing ingredient flow, allergen-safe alternatives.

### Defer (post-v1)

| Feature | Reason to Defer |
|---------|----------------|
| Offline AI responses | Engineering complexity; network acceptable for v1 |
| Push notifications | Need behavioral data first |
| Grocery list | Separate product problem; validate core loop first |
| AI-generated recipe expansion | Quality risk; validate curation model first |
| Meal planning | Out of scope by design |
| Social features | Not the GTM vehicle; external platforms serve this |

---

## Competitive Context

**Direct competitors (as of training cutoff, August 2025):**

- **SideChef** — Step-by-step guided cooking but no AI error recovery, no goal-awareness, weak personalization, English-dominant.
- **Yummly** — Strong recipe discovery, allergen filtering, some personalization. No real-time AI chat, no why-annotations.
- **PlantJammer** — AI-driven ingredient-to-recipe matching, good for plant-based. No step coaching, no error recovery.
- **ChefGPT / Spoonacular AI** — AI recipe generation but no curated quality, no step-level coaching, no profile-persistent chat.
- **Mealime** — Strong allergen filtering and meal planning. No guided cooking mode, no AI chat.
- **Noodle / Flavorish** — Newer AI cooking apps with some personalization but not step-level coaching.

**The gap:** No competitor in the Turkish market (or globally at the beginner level) combines: (a) culturally relevant curated content + (b) goal-aware silent personalization + (c) per-step why/mistake annotations + (d) real-time contextual AI chat. The Cook occupies this intersection.

**Confidence on competitive landscape:** MEDIUM — based on training data through August 2025. Landscape may have shifted; verify before roadmap finalization.

---

## Sources

- Training knowledge: SideChef, Yummly, Mealime, PlantJammer, ChefGPT, Noodle, Flavorish product analysis (through August 2025) — MEDIUM confidence
- Project context: `.planning/PROJECT.md` — HIGH confidence (authoritative)
- Web verification: Unavailable in this session (WebSearch and WebFetch tools restricted) — flag for validation before roadmap lock
