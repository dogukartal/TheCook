# Requirements: The Cook

**Defined:** 2026-03-08
**Core Value:** The user must never feel like the app gave them a recipe and walked away — every interaction, from ingredient input to the last step, must feel like having a knowledgeable friend in the kitchen.

## v1 Requirements

Requirements for initial release. No AI features in v1 — AI personalization and real-time chat are a separate milestone.

### Onboarding & Profile

- [ ] **ONBRD-01**: User can declare allergens and dietary restrictions at onboarding; stored and applied automatically to all recipe recommendations
- [ ] **ONBRD-02**: User can set cooking skill level (beginner / intermediate / advanced); controls which recipes surface and step explanation depth
- [ ] **ONBRD-03**: User can declare available kitchen equipment; recipes requiring unlisted equipment are de-prioritized or flagged

### Discovery

- [ ] **DISC-01**: User can input available ingredients and receive recipe recommendations that match
- [ ] **DISC-02**: User can browse a curated feed of recipes without ingredient input, ordered by skill level match
- [ ] **DISC-03**: User can filter recipes by craving/mood (cuisine type, cooking time, dish type — breakfast / soup / main / etc.)
- [ ] **DISC-04**: User can bookmark recipes to a personal saved list and return to them later
- [ ] **DISC-05**: Allergen-incompatible recipes are automatically filtered out from all discovery surfaces

### Cooking Mode

- [ ] **COOK-01**: User can enter cooking mode for any recipe; mode displays one step at a time — no full recipe visible while cooking
- [ ] **COOK-02**: Each step displays: what to do, why you're doing it, and what it should look/smell/feel like when correctly done
- [ ] **COOK-03**: Each step flags the most common mistake at that point and what to do if it happens
- [ ] **COOK-04**: Steps that require timing automatically trigger a countdown timer; timer runs in foreground and is visible at a glance

### Content Library

- [ ] **CONT-01**: App ships with 30–50 hand-curated beginner-friendly Turkish recipes
- [ ] **CONT-02**: Each recipe contains structured metadata: step list (each with instruction, why, looks-like-when-done, common mistake, recovery), allergen flags, skill level tag, equipment requirements, ingredient list with quantities

### Authentication

- [ ] **AUTH-01**: App works fully without an account — user profile and bookmarks stored locally on device
- [ ] **AUTH-02**: User can optionally create an account; doing so syncs their profile and bookmarks across devices
- [ ] **AUTH-03**: User can log in and out; local data syncs on sign-in

## v2 Requirements

Deferred to a future AI-integration milestone. Not in current roadmap.

### AI Personalization

- **AIPER-01**: Goal-aware recipe adaptation — dietary goal declared at onboarding; recipes enhanced silently (extra egg for muscle gain, reduced carbs for weight loss)
- **AIPER-02**: AI ingredient normalization — LLM handles Turkish morphology to match "soğanı" to "soğan" in ingredient search
- **AIPER-03**: Profile-aware substitution — user taps "I don't have this" and gets a substitute that respects their allergens and goal

### AI Cooking Assistance

- **AICOOK-01**: Real-time mid-cook error recovery chat — user can ask "I think I burned this, can I save it?" and get an AI response
- **AICOOK-02**: Step-level clarification — user can tap "I don't understand this step" and get a plain-language AI explanation

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
| CONT-02 | Phase 1 | Pending |
| ONBRD-01 | Phase 2 | Pending |
| ONBRD-02 | Phase 2 | Pending |
| ONBRD-03 | Phase 2 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| CONT-01 | Phase 3 | Pending |
| DISC-01 | Phase 4 | Pending |
| DISC-02 | Phase 4 | Pending |
| DISC-03 | Phase 4 | Pending |
| DISC-04 | Phase 4 | Pending |
| DISC-05 | Phase 4 | Pending |
| COOK-01 | Phase 5 | Pending |
| COOK-02 | Phase 5 | Pending |
| COOK-03 | Phase 5 | Pending |
| COOK-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-08 after roadmap creation — all 17 requirements mapped*
