# Project Research Summary

**Project:** The Cook — AI-powered mobile cooking companion
**Domain:** Offline-first mobile app with LLM integration (Turkish market)
**Researched:** 2026-03-08
**Confidence:** MEDIUM

## Executive Summary

The Cook is a Turkish-market cooking companion app targeting 18–30 year olds. Research across four domains converges on a single architectural truth: this product is an **offline-first mobile app with a thin, secure cloud layer for AI**. The recipe library and step-by-step cooking experience must work without internet; AI features degrade gracefully. The recommended implementation path is Expo (managed workflow) + React Native + Supabase (BaaS + Edge Functions as AI proxy) + SQLite (offline recipe store) + Claude API (Haiku for chat, Sonnet for personalization). This is a well-documented stack for this problem shape. The architectural decisions are high-confidence; version numbers should be confirmed at project init.

The competitive gap The Cook occupies is real and uncontested: no app combines curated Turkish recipe content with goal-aware silent personalization, per-step why/mistake annotations, and real-time contextual AI chat mid-cook. The v1 scope is correctly bounded. The 30–50 curated recipe library is the right size for validation — it is a content moat, not a tech moat. The AI features differentiate, but only if the underlying content schema and recipe data model are built correctly before a single recipe is authored. The recipe data schema is the highest-leverage early decision in this project.

The three risks that require early, deliberate mitigation are: (1) allergen filtering must be deterministic and data-layer enforced — LLM output must never be the sole allergen gate; (2) AI chat latency must be treated as a hard constraint (P95 under 1.5s) with streaming responses and pre-warmed connections from day one; and (3) Turkish language quality of AI output must be validated in Turkish from the first prototype — not as a localization afterthought. The ordered build sequence from ARCHITECTURE.md (schema → local DB → profile → discovery → cooking mode → AI integration → personalization → chat → offline hardening) reflects real dependency chains and should be followed.

---

## Key Findings

### Recommended Stack

The stack centers on **Expo SDK 52 (managed workflow)** as the mobile shell, eliminating native toolchain complexity for a solo build. React Native 0.76 ships with the New Architecture (Fabric + JSI) enabled by default, which matters for timer and camera interactions. Expo Router v4 handles navigation with file-system routing and deep linking out of the box.

**Supabase** handles auth, database (PostgreSQL), and — critically — Edge Functions (Deno) that serve as the AI proxy. This is the correct backend choice because: PostgreSQL's relational model enables ingredient-overlap queries that Firestore cannot do cleanly; Edge Functions proxy Claude API calls without exposing the API key to the client; and the free tier handles v1 scale. Claude API is called exclusively through Edge Functions — never from the mobile client.

**SQLite via expo-sqlite** (or WatermelonDB for added sync complexity if needed later) is the offline database. The 30–50 curated recipes ship bundled inside the app binary as JSON, seeded into SQLite on first launch. This eliminates any cold-start network dependency. Zustand manages in-session state (current cooking step, timer state). MMKV handles fast synchronous storage for cooking session persistence across app kills.

**Core technologies:**
- Expo SDK 52 (managed workflow): mobile shell, OTA updates, EAS Build — eliminates native toolchain
- React Native 0.76: core framework, New Architecture on by default
- Expo Router v4: file-system navigation with deep linking
- Supabase: PostgreSQL + Auth + Edge Functions as AI proxy — one platform, free tier covers v1
- expo-sqlite: offline recipe store (skip WatermelonDB for v1; 50 recipes is not a sync problem)
- Zustand + MMKV: client state + fast persistent storage for cooking sessions
- Claude Haiku: in-cook chat (fast, cheap, sufficient for single-turn Q&A)
- Claude Sonnet: goal-aware personalization (richer reasoning for constraint handling)
- i18next + expo-localization: Turkish UI localization; no translation layer needed for AI output (Claude handles Turkish natively)
- FlashList: recipe feed rendering (10x faster than FlatList; use from day one)
- expo-keep-awake: screen stays on during cooking — one line, critical UX

**Version note:** Claude model IDs change frequently. Verify at console.anthropic.com before coding. All library versions should be confirmed with `npm info [package] version` at project init.

### Expected Features

The Turkish 18–30 demographic expects all table-stakes features from any modern recipe app. Missing or broken table stakes = immediate churn.

**Must have (table stakes):**
- Recipe browsing with strong hero photos — text-only feels unfinished
- Ingredient-based search with fuzzy matching — "I have eggs, tomato, onion" is the entry point
- Allergen and dietary restriction filtering — set-once, always-applied, never re-prompted
- Saved/favorited recipes with offline access
- Step-by-step cooking mode — full-recipe scroll is considered poor UX since 2020
- Built-in cooking timers — must survive screen lock and app backgrounding
- Skill-level indication — silently matched to user profile
- Offline recipe access — Turkish mobile network conditions and kitchen environments make this non-negotiable
- Turkish-language content throughout — UI, recipe content, and AI responses

**Should have (competitive differentiators — The Cook's moat):**
- Goal-aware silent personalization — adapt quantities/suggestions per goal (muscle gain, weight loss, maintenance) without showing a tracker UI; no competitor in Turkey does this
- Real-time AI chat mid-cook with full context — current step + recipe ID + user profile injected per call; no dedicated app does this
- Per-step "why" annotations — reasons behind instructions at step level, not just instructions
- Per-step common-mistake warnings — pre-emptive error prevention for beginners
- Profile-aware ingredient substitutions — checks allergens + goal + skill simultaneously
- Curated Turkish recipe library with deep annotations — culturally relevant content moat

**Defer (v2+):**
- Meal planning and weekly schedules — out of scope by design; "tonight" mindset
- Social features — external platforms (TikTok, Instagram) are the social layer for GTM
- Video content — drives app discovery externally; keep production costs out of the app
- AI-generated recipe expansion — quality risk; validate curation model first
- Grocery list / shopping cart — separate product problem
- Offline AI responses — LLM on-device adds cost and complexity without proven need
- Push notification campaigns — need behavioral data before building triggers
- User-submitted recipes (UGC) — quality and moderation burden; Hira owns content pipeline for v1

### Architecture Approach

The Cook follows an **offline-first architecture with a secure AI proxy layer**. All recipe content ships bundled in the app binary (JSON, ~200KB estimated for 50 recipes) and is seeded into a local SQLite database on first launch — zero cold-start network dependency. The network is used for: initial profile sync to Supabase, background recipe version checks, and all AI calls (which route through Supabase Edge Functions, never directly from client). The client authenticates to Supabase with a per-user JWT; the Edge Function holds the Claude API key.

The AI call strategy is: **AI is a last resort, not a first resort.** Recipe discovery, allergen filtering, step display, and timers are all fully local. AI fires only for goal enhancement (when no pre-authored enhancement exists for that recipe+goal combo), AI-assisted substitution (when local substitutions don't cover the case), and explicit mid-cook chat. This design controls cost, improves perceived performance, and ensures offline mode is genuinely functional rather than a degraded fallback.

**Major components:**
1. Mobile App (React Native/Expo) — UI, navigation, step state machine, timers, offline recipe access
2. Local DB (expo-sqlite) — offline store for recipes, user profile, cooking session state, cached AI enhancements
3. Supabase Auth + PostgreSQL — canonical user profile, usage analytics, recipe version metadata
4. Supabase Edge Functions (Deno) — AI proxy: builds prompts with server-side profile context, calls Claude, streams responses, caches results
5. Anthropic Claude API — goal-aware personalization, real-time chat, substitution reasoning; accessed only via Edge Functions
6. Bundled Recipe JSON — 30–50 curated recipes shipped with app binary; no network required for initial library

**The recipe data schema is the most critical architectural decision.** A flat schema cannot support goal enhancements, allergen flags, step-level metadata, and substitution lookups. The full schema (see ARCHITECTURE.md) must be designed and validated against 2–3 test recipes before any recipe content work begins.

### Critical Pitfalls

1. **AI Chat Latency Breaks Mid-Cook UX** — Unoptimized Claude API calls take 3–6s; Turkish mobile networks add 2–3x overhead vs. office wifi. Mitigation: SSE streaming (first tokens in 300–500ms), pre-warm API connection on cooking mode entry, structured/shorter prompts with Anthropic prompt caching for static context (system prompt + recipe). Treat P95 under 1.5s as a hard engineering constraint. Test on Turkish carrier networks, not wifi.

2. **Allergen Substitution Errors — The Highest-Stakes Bug** — LLMs hallucinate ingredient compositions and miss hidden allergens. "Most of the time" is not acceptable for allergy safety. Mitigation: deterministic allergen blocklist at the data layer; every ingredient allergen-tagged at content creation time; LLM substitution suggestions routed through the blocklist validator before display; LLM output never trusted as sole allergen gate. Add UI disclaimer ("Always verify ingredients if you have a severe allergy").

3. **Turkish Ingredient NLP — Fuzzy Matching Failures** — Turkish agglutinative morphology (inflected forms like "domatesten", "biberlerin") breaks simple string matching. Regional naming variations compound the problem. Mitigation: curated Turkish ingredient synonym dictionary for every ingredient in the recipe set + LLM-powered ingredient normalization to canonical names + disambiguation UI for ambiguous input. Consider Zemberek-NLP for morphological stemming.

4. **Offline Mode Silent Failures Mid-Recipe** — Recipe caching implemented as afterthought leaves users stranded mid-cook. Timers dependent on server timestamps fail on connectivity loss. Mitigation: cache full recipe (all steps, all annotations) the moment the user opens a recipe; timers run on device clock only; clear UI distinction between "Offline Safe" (steps, timers, pre-written tips) and "Online Enhanced" (AI chat). Never show a spinner with no timeout.

5. **Recipe Data Schema Migration Cost** — Flat or under-specified schema discovered mid-curation forces migration across all authored recipes. Mitigation: finalize the complete TypeScript recipe schema before the first recipe is written; validate against 2–3 test recipes manually; version the schema from day one; enforce schema at content entry time.

---

## Implications for Roadmap

Based on research, the architecture defines a clear dependency chain that should directly inform phase order. The schema must come first because everything else reads recipe data. The local DB and offline layer must come before AI because the AI layer is a thin enhancement on top of a complete local experience.

### Phase 1: Foundation — Recipe Schema and Content Pipeline

**Rationale:** Schema is the highest-leverage early decision. Every other component depends on it. Starting here prevents costly migration later. Parallel work: local DB setup and user profile/onboarding can proceed once the schema is stable. This is also the phase where allergen tagging requirements must be baked into the content creation workflow — it cannot be retrofitted.

**Delivers:** Finalized TypeScript recipe schema, 5–10 pilot recipes authored and fully annotated by Hira, allergen tags validated, content creation workflow established, Expo project bootstrapped with TypeScript and Expo Router.

**Addresses features:** Core recipe data foundation for all subsequent features.

**Avoids:** Pitfall 5 (schema migration cost), Pitfall 2 (allergen safety — tagging must be in from the start), Pitfall 9 (step card overflow — character limits set in content guidelines).

**Research flag:** Standard patterns. Schema design is straightforward given the TypeScript interface defined in ARCHITECTURE.md. No phase research needed — the schema is already specified.

---

### Phase 2: Offline Core — Local DB, User Profile, and Recipe Discovery

**Rationale:** Build the complete offline experience before any cloud or AI work. This proves the core value (recipe access, ingredient-based discovery, allergen filtering) works without internet. It also establishes the local data layer that AI enhancements will cache into. User profile/onboarding must come before discovery because filtering depends on declared allergens and skill.

**Delivers:** expo-sqlite with seeding from bundled recipe JSON, Zustand + MMKV state setup, onboarding screens (goal, allergens, skill), ingredient-based recipe discovery with fuzzy matching and allergen/skill filtering, Supabase auth (email + OAuth), profile sync local-to-remote.

**Addresses features:** Ingredient search, allergen filtering, recipe browsing, offline recipe access, Turkish localization (i18next).

**Avoids:** Pitfall 4 (offline failures — offline architecture decided here, not retrofitted), Pitfall 3 (Turkish ingredient matching — synonym dictionary and LLM normalization strategy decided here), Anti-Pattern 2 (never fetch recipes from network on launch), Anti-Pattern 3 (allergen filtering must be client-side).

**Research flag:** Needs `/gsd:research-phase`. Specifically: confirm expo-sqlite capabilities in current Expo SDK vs. WatermelonDB tradeoffs; evaluate Zemberek-NLP integration feasibility in React Native; confirm Supabase Edge Function SSE streaming support for React Native clients.

---

### Phase 3: Guided Cooking Mode

**Rationale:** Guided cooking mode is the primary retention mechanic and the feature that gives mid-cook AI chat its context. It must exist before AI chat can be built. All inputs are local — this phase requires no cloud or AI work, so it can be thoroughly validated offline first.

**Delivers:** Step-by-step cooking mode with state machine (IDLE → RECIPE_SELECTED → COOKING(step) → COMPLETE), per-step display (instruction, why annotation, looks_like_when_done, common_mistake), built-in countdown timers with expo-notifications for background firing, expo-keep-awake (screen stays on), cooking session persistence via MMKV (resume on app kill), swipe gesture navigation between steps.

**Addresses features:** Step-by-step cooking mode, built-in timers, per-step why annotations, common-mistake warnings.

**Avoids:** Pitfall 4 (timers device-clock only, full recipe pre-cached on open), Pitfall 9 (step card overflow — enforce content character limits), Anti-Pattern 5 (EAS Build from start — expo-notifications requires native build, not Expo Go).

**Research flag:** Needs `/gsd:research-phase` for background timer behavior on iOS (app backgrounded with active timer — behavior differs between iOS versions and depends on expo-notifications configuration).

---

### Phase 4: AI Integration — Infrastructure and Personalization

**Rationale:** AI features are built on top of a complete local experience. This phase sets up the Supabase Edge Functions AI proxy and implements goal-aware personalization (the highest-value AI feature after chat). Streaming infrastructure must be validated here before chat is built. Prompt cost instrumentation goes in from day one.

**Delivers:** Supabase Edge Functions project, Claude API proxy (streaming SSE), profile context injection pattern (server-side, from Supabase — not client-trusted), goal-aware recipe personalization (pre-authored enhancement served locally; AI fills gaps), structured AI output with JSON schema validation, Anthropic prompt caching for static context, token count logging per request, result caching in local DB (keyed: recipe_id + user_goal).

**Addresses features:** Goal-aware silent personalization, profile-aware ingredient substitutions.

**Avoids:** Anti-Pattern 1 (direct client-to-LLM calls), Pitfall 1 (streaming from day one, latency tested on Turkish mobile networks), Pitfall 6 (prompt cost instrumentation before launch), Pitfall 2 (substitution suggestions routed through allergen blocklist before display), Anti-Pattern 4 (structured JSON output enforced via tool_use/schema, not free text).

**Research flag:** Needs `/gsd:research-phase`. Verify: Claude tool_use / structured output current API state; Supabase Edge Function SSE streaming to React Native; Anthropic prompt caching current API and pricing; current Claude model IDs (haiku and sonnet).

---

### Phase 5: Real-Time AI Chat (Mid-Cook)

**Rationale:** Chat is the highest-complexity feature and depends on all previous phases: it needs the cooking mode context (current step, recipe), the profile (from Phase 2), the Edge Function infrastructure (from Phase 4), and the streaming pipeline (from Phase 4). Building it last ensures all dependencies are battle-tested.

**Delivers:** Mid-cook streaming chat UI (token-by-token rendering via SSE), context assembly (current_step + recipe_id + user_profile injected server-side), offline degradation (graceful: shows pre-written step.common_mistake + looks_like_when_done when offline; never a dead-end), connection pre-warming on cooking mode entry, profile-aware substitution requests through chat, per-session cost budget enforcement.

**Addresses features:** Real-time AI chat mid-cook with error recovery, profile-aware substitution (chat surface).

**Avoids:** Pitfall 1 (latency — streaming + pre-warmed connection), Pitfall 7 (Turkish AI quality — all quality testing in Turkish from first prototype; Hira reviews AI output as quality gate), Pitfall 6 (cost budget per session with graceful degradation), Pitfall 8 (allergen claim language in chat UI copy — "preference filter" not "safety guarantee").

**Research flag:** Needs `/gsd:research-phase` for Turkish LLM quality validation — test Claude's cooking domain Turkish output quality with native speaker review before committing to tone guide.

---

### Phase 6: Polish and App Store Submission

**Rationale:** Final phase consolidates offline hardening, UX polish, app store compliance review, and EAS submission pipeline. By deferring store submission, all feature phases can iterate without App Store release cycles.

**Delivers:** Offline degradation hardening (full test matrix with simulated network degradation), browse surfacing logic (skill/goal/context filtering to make 30 recipes feel curated), app store copy review (no "safe for allergies" language; allergen disclaimer UI; framed as preference filter), Apple/Google store metadata and screenshots, EAS Build pipeline for production, TestFlight/internal testing distribution.

**Addresses features:** Browse discovery polish, final offline validation.

**Avoids:** Pitfall 8 (app store rejection — Guideline 1.4 and 5.1 review before submission), Pitfall 11 (30-recipe library feels thin — surfacing logic required), Pitfall 4 (offline final validation with degraded network simulation).

**Research flag:** Standard patterns for EAS Build/Submit. App store guidelines review is a checklist item, not research. No phase research needed.

---

### Phase Ordering Rationale

- Schema first because every component reads recipe data; a migration at Phase 3 costs days, at Phase 5 costs weeks.
- Offline core before cloud because the local experience must be complete and testable in isolation; cloud is additive.
- Cooking mode before AI because mid-cook chat requires cooking mode context to exist; building them together creates untestable dependencies.
- AI personalization before chat because personalization establishes the Edge Function proxy, streaming pipeline, and cost instrumentation that chat depends on.
- This ordering means the app is functionally usable (offline, no AI) after Phase 3 — useful for early content validation with Hira before AI costs are incurred.

### Research Flags

Phases needing `/gsd:research-phase` during planning:

- **Phase 2:** expo-sqlite vs. WatermelonDB current capability comparison; Zemberek-NLP React Native integration; Supabase Edge Function SSE support confirmation.
- **Phase 4:** Claude structured output (tool_use) current API; Anthropic prompt caching current state and pricing; Supabase Edge Function streaming to React Native client confirmation; current Claude model IDs.
- **Phase 5:** Turkish LLM quality validation with native speaker test — this is a capability gate, not a localization task.

Phases with standard, well-documented patterns (skip research):

- **Phase 1:** Recipe schema design follows the TypeScript interfaces already specified in ARCHITECTURE.md. Expo project bootstrap is standard. No unknowns.
- **Phase 3:** Cooking mode state machine pattern is well-established in React Native. Expo notifications and expo-keep-awake are documented Expo packages. Background timer iOS behavior is the one exception (flagged above).
- **Phase 6:** EAS Build/Submit is standard Expo workflow. App store guidelines review is a checklist.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Framework and architecture choices are HIGH confidence (well-validated for this use case). Library version numbers are MEDIUM — training data cutoff August 2025; verify at project init. Claude model IDs are LOW — verify at console.anthropic.com. |
| Features | MEDIUM | Based on competitive analysis through August 2025 without live data verification. The Turkish market gap analysis is directionally correct but should be validated before roadmap lock. |
| Architecture | MEDIUM | Offline-first + BaaS + LLM proxy patterns are HIGH confidence (established). Specific concerns: Supabase Edge Function SSE streaming to React Native (needs verification), expo-sqlite vs. WatermelonDB current capability comparison (SDK changes), Claude tool_use structured output current state. |
| Pitfalls | HIGH | Allergen safety, latency patterns, offline architecture, and schema migration risks are well-established failure modes. Turkish NLP and LLM quality flags are directionally correct and confirmed by multiple convergent signals. App store health claim policies are stable. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Supabase Edge Function SSE streaming to React Native:** Confirmed as the right architecture but needs hands-on verification before Phase 4 begins. If SSE is problematic, WebSocket is the fallback (bidirectional, slightly higher complexity). Resolve in Phase 2 research.
- **expo-sqlite vs. WatermelonDB in current Expo SDK:** ARCHITECTURE.md recommends WatermelonDB for query power; STACK.md recommends starting with expo-sqlite. Expo SDK 51+ improved expo-sqlite significantly. Resolve at project init by checking current expo-sqlite documentation against query requirements.
- **Claude model IDs and pricing:** Model names and token pricing change frequently. Do not hardcode from this research. Check console.anthropic.com at Phase 4 start. Build model ID as a configuration constant, not a string literal in prompts.
- **Turkish cooking vocabulary gaps in Claude:** Claude's Turkish quality is good but not validated for cooking domain terminology. Resolve by running 20–30 representative cooking chat scenarios in Turkish with Hira reviewing quality before Phase 5 ships.
- **Zemberek-NLP React Native integration:** Library is real and actively maintained (August 2025) but its React Native packaging status is uncertain. If direct integration is impractical, the LLM normalization path (send raw input to Claude Haiku, return canonical ingredient name) is the fallback. Resolve in Phase 2.
- **Competitive landscape currency:** Feature research is based on training data through August 2025. Verify no direct Turkish-market competitor has launched a similar product before roadmap finalization.

---

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` — authoritative project spec and constraints
- React Native + Expo offline-first patterns — well-documented, stable, established
- Allergen safety architecture — deterministic vs. probabilistic patterns, well-documented in health-adjacent AI product literature
- Anthropic prompt caching documentation — documented live feature as of mid-2024
- Offline mobile architecture (SQLite + WatermelonDB) — established React Native patterns

### Secondary (MEDIUM confidence)
- Expo SDK 52 release notes (training data, August 2025) — framework versions
- Supabase documentation (training data, August 2025) — Edge Function streaming, PostgreSQL capabilities
- Competitive analysis: SideChef, Yummly, Mealime, PlantJammer, ChefGPT, Noodle, Flavorish (training data through August 2025) — feature landscape
- Turkish mobile market characteristics — directionally correct, not live-verified
- Zemberek-NLP Turkish NLP library (training data, August 2025) — active as of cutoff; verify current status

### Tertiary (LOW confidence)
- Claude model IDs and current pricing — changes frequently; verify at console.anthropic.com before implementation
- Current Turkish AI cooking app competitive landscape — may have shifted post-August 2025; verify before roadmap lock

**Verify before implementing:**
- Current Claude model IDs and prompt caching: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- Supabase Edge Functions streaming docs: https://supabase.com/docs/guides/functions
- Apple App Store Review Guidelines 1.4 and 5.1: https://developer.apple.com/app-store/review/guidelines/
- Zemberek-NLP: https://github.com/ahmetaa/zemberek-nlp
- Google Play health content policies: https://support.google.com/googleplay/android-developer/answer/9876714

---
*Research completed: 2026-03-08*
*Ready for roadmap: yes*
