# Requirements: The Cook

**Defined:** 2026-03-08
**Core Value:** The user must never feel like the app gave them a recipe and walked away — every interaction, from ingredient input to the last step, must feel like having a knowledgeable friend in the kitchen.

## v1 Requirements

Requirements for initial release. No AI features in v1 — AI personalization and real-time chat are a separate milestone.

### Onboarding & Profile

- [x] **ONBRD-01**: User can declare allergens and dietary restrictions at onboarding; stored and applied automatically to all recipe recommendations
- [x] **ONBRD-02**: User can set cooking skill level (beginner / intermediate / advanced); controls which recipes surface and step explanation depth
- [x] **ONBRD-03**: User can declare available kitchen equipment; recipes requiring unlisted equipment are de-prioritized or flagged

### Discovery

- [x] **DISC-01**: User can input available ingredients and receive recipe recommendations that match
- [x] **DISC-02**: User can browse a curated feed of recipes without ingredient input, ordered by skill level match
- [x] **DISC-03**: User can filter recipes by craving/mood (cuisine type, cooking time, dish type — breakfast / soup / main / etc.)
- [x] **DISC-04**: User can bookmark recipes to a personal saved list and return to them later
- [x] **DISC-05**: Allergen-incompatible recipes are automatically filtered out from all discovery surfaces

### Cooking Mode

- [x] **COOK-01**: User can enter cooking mode for any recipe; mode displays one step at a time — no full recipe visible while cooking
- [x] **COOK-02**: Each step displays: what to do, why you're doing it, and what it should look/smell/feel like when correctly done
- [x] **COOK-03**: Each step flags the most common mistake at that point and what to do if it happens
- [x] **COOK-04**: Steps that require timing automatically trigger a countdown timer; timer runs in foreground and is visible at a glance

### Content Library

- [x] **CONT-01**: App ships with 30–50 hand-curated beginner-friendly Turkish recipes
- [x] **CONT-02**: Each recipe contains structured metadata: step list (each with instruction, why, looks-like-when-done, common mistake, recovery), allergen flags, skill level tag, equipment requirements, ingredient list with quantities

### Authentication

- [x] **AUTH-01**: App works fully without an account — user profile and bookmarks stored locally on device
- [x] **AUTH-02**: User can optionally create an account; doing so syncs their profile and bookmarks across devices
- [x] **AUTH-03**: User can log in and out; local data syncs on sign-in

### Recipe Adaptation (v1 — Phases 10+)

- [ ] **ADAPT-01**: User can adjust serving size on recipe detail; all ingredient quantities scale proportionally and carry into cooking mode
- [ ] **ADAPT-02**: User can swap a missing ingredient for a pre-defined alternative ("Elimde yok"); substitution reflected in step copy via dynamic variables
- [ ] **ADAPT-03**: Step copy uses dynamic variables for ingredient references — quantities and names resolve to active state (scaled/substituted) at cook time

### Cooking Experience (v1 — Phases 11-12)

- [ ] **COOKX-01**: Each cooking step displays an AI-generated process image with fallback colour block
- [ ] **COOKX-02**: Each step shows Boyle gorunmeli (checkpoint) and Dikkat et! (warning) — max one line each
- [ ] **COOKX-03**: Completing a recipe logs to Gecmis with date and optional star rating; partial cooks not logged
- [ ] **COOKX-04**: Sef'im AI companion available in every cooking step — 3 pre-loaded Q&A chips (instant) plus open text/voice (live AI call)
- [ ] **COOKX-05**: Sef'im is context-aware (recipe, step, skill level, ingredient swaps) and pulses when user lingers beyond average step duration

### Profile Evolution (v1 — Phase 7+)

- [x] **PROF-01**: Skill level is a hard filter — recipes above user's skill ceiling never surface on any screen
- [x] **PROF-02**: Kitchen tools are a hard filter — recipes requiring unselected tools never surface on any screen
- [x] **PROF-03**: User can declare cuisine preferences and app goals; these feed AI ranking and feed weighting as soft preferences

### Feed & Navigation (v1 — Phase 7-8)

- [x] **NAV-01**: App has 4 tabs: Feed, Search, Cookbook, Profile. Nav bar hidden during Cooking Mode.
- [x] **FEED-01**: Feed displays 4 horizontal sections (Su an trend, 30 dakikada bitir, Sana ozel, Denemediklerin) all respecting hard filters
- [x] **FEED-02**: Sections with zero results after filtering are hidden silently; if all sections empty, prompt to update profile

## v2 Requirements

Deferred to a future milestone. Not in current roadmap.

### AI Personalization

- **AIPER-01**: Goal-aware recipe adaptation — dietary goal declared at onboarding; recipes enhanced silently (extra egg for muscle gain, reduced carbs for weight loss)
- **AIPER-02**: AI ingredient normalization — LLM handles Turkish morphology to match "soganı" to "sogan" in ingredient search

### Content Scaling

- **SCALE-01**: OTA recipe updates — new recipes can be pushed without an app store release

## Out of Scope

Explicitly excluded to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Calorie / macro display | We are a cooking enabler, not a health tracker; showing numbers changes the product's identity |
| Dietary goal collection in v1 | No AI to act on it; collecting without acting creates false promise |
| Meal planning / weekly schedules | Too much friction for the target audience; not core to the use case |
| Social features (in-app sharing, following) | GTM happens on external platforms; no in-app social needed |
| In-app video content | Text + photo per step is sufficient; video lives on Hira's social channels |
| Monetization / paywall | Deferred; focus v1 on user acquisition and concept validation |
| AI-generated recipe expansion | v1 is hand-curated only; AI scaling is a future milestone |

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONT-02 | Phase 1 | Complete |
| ONBRD-01 | Phase 2 | Complete |
| ONBRD-02 | Phase 2 | Complete |
| ONBRD-03 | Phase 6 | Complete |
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| AUTH-03 | Phase 2 | Complete |
| CONT-01 | Phase 3 | Complete |
| DISC-01 | Phase 4 | Complete |
| DISC-02 | Phase 4 | Complete |
| DISC-03 | Phase 9 | Complete |
| DISC-04 | Phase 4 | Complete |
| DISC-05 | Phase 7 | Complete |
| COOK-01 | Phase 5 | Complete |
| COOK-02 | Phase 5 | Complete |
| COOK-03 | Phase 5 | Complete |
| COOK-04 | Phase 5 | Complete |
| PROF-01 | Phase 7 | Complete |
| PROF-02 | Phase 7 | Complete |
| PROF-03 | Phase 7 | Complete |
| NAV-01 | Phase 7 | Complete |
| FEED-01 | Phase 8 | Complete |
| FEED-02 | Phase 8 | Complete |
| ADAPT-01 | Phase 10 | Pending |
| ADAPT-02 | Phase 10 | Pending |
| ADAPT-03 | Phase 10 | Pending |
| COOKX-01 | Phase 11 | Pending |
| COOKX-02 | Phase 11 | Pending |
| COOKX-03 | Phase 11 | Pending |
| COOKX-04 | Phase 12 | Pending |
| COOKX-05 | Phase 12 | Pending |

**Coverage:**
- v1 requirements: 31 total (17 original + 14 new from product evolution)
- Mapped to phases: 31
- Unmapped: 0
- Complete: 17
- Pending: 14 (Phases 7–12)

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-17 — product vision evolved, 14 new requirements added for Phases 7–12*
