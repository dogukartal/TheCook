# Domain Pitfalls: The Cook

**Domain:** AI-powered mobile cooking companion (Turkish market)
**Researched:** 2026-03-08
**Confidence note:** WebSearch and Context7 tools unavailable in this session. All findings are drawn from training knowledge (cutoff August 2025) applied to the specific technical risks in PROJECT.md. Confidence levels reflect this. Flag for verification during phase planning.

---

## Critical Pitfalls

Mistakes that cause rewrites, user harm, or unit economics failure.

---

### Pitfall 1: Real-Time AI Chat Latency Breaks Mid-Cook UX

**What goes wrong:** The AI chat feature is triggered at the worst possible moment — hands dirty, heat on, time-critical step in progress. If the round-trip to the LLM takes 3–6 seconds (standard for unoptimized Claude API calls), the user's window to act has already passed. The response arrives after they've already made the wrong call. This is not a minor annoyance — it destroys the core value proposition ("like having a knowledgeable friend in the kitchen").

**Why it happens:** Teams optimize latency for demo conditions (fast wifi, short prompts, pre-warmed connections) and discover the real-world number is 2–3x worse on Turkish mobile networks (4G with variable signal, common in the 18–30 demographic cooking at home). Additionally, cold API connections on first chat message add 500ms–1s overhead that is invisible in testing.

**Consequences:**
- User abandons AI chat and defaults to Googling mid-cook (product fails its primary job)
- Negative reviews citing "the app didn't help me in time"
- If the user follows a late/wrong AI response, the dish is ruined — trust is lost permanently

**Prevention:**
- Target P95 response time under 1.5 seconds as a hard engineering constraint, not a goal
- Use streaming responses (SSE) so the user sees the first tokens within 300–500ms — perceived latency drops dramatically even if total time is the same
- Pre-warm the API connection when the user enters cooking mode (a lightweight keepalive ping), not when they first type
- Use shorter, pre-structured prompts for cooking chat — avoid building the full user profile + recipe context + conversation history into every message; cache what doesn't change
- Test on Turkish mobile networks (Turkcell/Vodafone TR) with realistic signal conditions, not office wifi

**Warning signs:**
- Average chat response time over 2 seconds in staging
- First-message latency noticeably worse than subsequent messages
- Latency spikes on longer recipes (larger context = slower)

**Phase:** Address in the AI infrastructure phase, before cooking mode goes to user testing. Streaming must be in place before the first real user touches the app.

---

### Pitfall 2: Allergen Substitution Errors — The Highest-Stakes Bug

**What goes wrong:** The goal-aware personalization system suggests an ingredient substitution that the user's allergen profile should have blocked. A user with a gluten allergy gets a suggestion to substitute with soy sauce (which contains wheat). A lactose-intolerant user gets a butter substitution that is technically dairy-free but cross-contaminated. The LLM does not know what it does not know — it confidently suggests unsafe swaps.

**Why it happens:** LLMs are not reliable allergen safety checkers. They hallucinate ingredient compositions, miss hidden allergens (e.g., gluten in oats, soy in certain margarines), and do not have real-time knowledge of Turkish brand formulations. If allergen filtering is implemented by asking the LLM to "avoid X" in its system prompt, the LLM will comply most of the time — but not always. "Most of the time" is not acceptable for allergy safety.

**Consequences:**
- Medical harm to the user — the worst possible outcome
- Legal liability (Turkey has consumer protection law; health-related harm from digital products is actionable)
- App store removal if Apple/Google receive allergen-related harm reports
- Complete brand destruction; the content creator's personal brand (Hira) is attached to the product

**Prevention:**
- Never rely solely on the LLM to filter allergens. Build a deterministic allergen blocklist at the data layer: every ingredient in every recipe is tagged with allergen categories at content creation time. The LLM cannot override these tags.
- When the LLM suggests a substitution, route the suggestion through the allergen tag validator before displaying it to the user. If the suggested ingredient is not in the known-safe list for that user, reject it silently and ask the LLM to try again (or surface a generic "no safe substitution found" message).
- Add a hard warning at the UI layer for any dish that contains the user's declared allergens, regardless of what the AI said
- Add explicit legal disclaimer language: "Always verify ingredients if you have a severe allergy" — required for app store approval in health-adjacent categories
- During recipe curation (Hira's content pipeline), every ingredient must be allergen-tagged before the recipe is published

**Warning signs:**
- LLM suggests substitutions for ingredients not in the verified ingredient database
- Substitution feature bypasses the allergen tag check in any code path
- Recipes published without complete allergen tagging

**Phase:** The allergen validation layer must be designed before any recipe goes into the database. This is a data model and content pipeline decision, not an afterthought. Phase: Recipe data model + content pipeline.

---

### Pitfall 3: Turkish Ingredient NLP — Fuzzy Matching Failures Destroy Ingredient Input

**What goes wrong:** The user types their fridge contents in Turkish. They type "biber" (pepper — but which one? sivri biber, dolmalık biber, kırmızı biber, yeşil biber are different ingredients). They type "peynir" (cheese — but the recipe calls for beyaz peynir vs. kaşar vs. lor). They misspell "soğan" as "sogan". The ingredient matching either fails to find anything (too strict) or matches the wrong ingredient and suggests a recipe that doesn't work (too loose). Both outcomes break trust.

**Why it happens:** Turkish has agglutinative morphology — "domatesten" (from the tomato), "biberlerin" (of the peppers), "soğanı" (the onion, accusative). A simple string match on ingredient names fails for inflected forms. Turkish also has regional naming variations and colloquialisms (e.g., "çarliston" for çarliston biber, "roka" vs "rucola"). Generic NLP libraries trained on English are unreliable for Turkish morphological analysis.

**Consequences:**
- Fridge input returns no matches → user gives up and doesn't use the feature
- Wrong ingredient matched → recipe recommended that can't actually be made → user frustrated mid-cook
- The feature that differentiates the app becomes its biggest liability

**Prevention:**
- Do not use pure fuzzy string matching. Use a combination of: (1) a curated Turkish ingredient synonym dictionary covering common variants, regional names, and common misspellings for every ingredient in the recipe database; (2) LLM-powered ingredient normalization for free-text input — send the user's raw text to the LLM and ask it to return canonical ingredient names from the database vocabulary; (3) a disambiguation UI step when input is ambiguous ("Did you mean: sivri biber or dolmalık biber?")
- The ingredient database vocabulary is the source of truth — the LLM normalizes to it, not to open-ended ingredient names
- Turkish morphological stemming: use Zemberek-NLP (open source Turkish NLP library) or equivalent for stemming before matching, to handle inflected forms
- Test with 50+ real Turkish user inputs before shipping — have Hira and her audience submit test inputs
- Do not ship ingredient input without the synonym dictionary being substantially complete for the v1 recipe set

**Warning signs:**
- Ingredient input returns empty results for common items ("domates", "soğan", "yağ")
- Testing reveals users type ingredients in different forms than the database expects
- Disambiguation UI feels like an error state rather than a helpful clarification

**Phase:** Ingredient matching design and synonym dictionary must be built during the recipe content pipeline phase, not as a standalone feature phase. The dictionary is owned by Hira's content work.

---

### Pitfall 4: Offline Mode — Silent Failures Mid-Recipe

**What goes wrong:** The user starts cooking with internet, loses connectivity (kitchen wifi dead zone, Turkish mobile network drop), and the app either crashes, shows a blank screen, shows a spinner forever, or — worst — shows the step they were on but silently fails to submit their AI chat question. They don't know if the app heard them. They are mid-cook, hands dirty, and the app has abandoned them.

**Why it happens:** Teams implement offline mode as "cache the recipe" and consider it done. But cooking mode has dynamic state (which step, timers running, chat history) that must survive connectivity loss and resume cleanly. Most teams test offline by toggling airplane mode from a full-signal state — they don't test the degraded case (intermittent signal, slow responses, partial request failures).

**Consequences:**
- User burns food or makes an error because guidance was unavailable
- The one situation where the app matters most (they're mid-cook and need help) is the one where it fails
- The offline promise feels like a lie; organic word-of-mouth turns negative

**Prevention:**
- Define two clearly separate modes: "Offline Safe" (recipe steps, timers, common mistake tips — all pre-loaded, always work) and "Online Enhanced" (AI chat, substitution suggestions — require connectivity)
- The offline safe mode must be indistinguishable in quality from online mode for the step-by-step experience. The AI chat is the only thing that degrades — and it must degrade gracefully with a clear UI message ("AI chat needs internet — here's the common mistake tip for this step instead")
- Cache the full recipe (all steps, all annotations) the moment the user opens a recipe, not when they enter cooking mode
- Timers must run on-device (not server-side) and survive app backgrounding
- When AI chat fails due to connectivity, queue the message and attempt retry on reconnection — do not silently drop it
- Test with simulated network degradation (not just airplane mode): 2G speeds, packet loss, request timeouts

**Warning signs:**
- Recipe steps only load progressively (not pre-cached)
- Timers rely on server timestamps instead of device clock
- AI chat shows a spinner with no timeout or error state
- No UI difference between "loading" and "failed"

**Phase:** Offline architecture must be decided in the core architecture phase. Retrofitting offline support onto an online-first data model is a rewrite. The caching strategy is a data flow decision, not a feature addition.

---

### Pitfall 5: Recipe Data Model — Wrong Schema Is Painful to Migrate

**What goes wrong:** The team ships a recipe schema that is flat or under-specified, then discovers mid-production that it cannot represent all the required step-level data (instruction, why, common mistake, what to do if wrong, substitutions, goal enhancements, allergen flags). They add fields ad hoc. By the time 30 recipes are curated, the schema is inconsistent, Hira's content pipeline is working around missing fields, and the AI prompts are compensating for schema gaps. A migration is now required across all recipes.

**Why it happens:** Schema design is deferred ("we'll figure it out as we add recipes") because it feels like infrastructure, not product. But with hand-curated content, the schema IS the product — it defines what the AI can and cannot do.

**Consequences:**
- Content migration cost grows linearly with the number of recipes curated before the schema is fixed
- AI response quality is degraded where schema fields are missing
- Hira's content creation workflow is disrupted by mid-stream schema changes
- Goal enhancement and allergen filtering logic breaks on recipes created under the old schema

**Prevention:**
- Design the complete recipe schema before the first recipe is written. Every field listed in PROJECT.md requirements must be modeled: step.instruction, step.why, step.looks_like_when_done, step.common_mistake, step.recovery_if_wrong, step.substitutions (per ingredient), step.goal_enhancements (per dietary goal), step.allergen_flags, step.timer (optional)
- Validate the schema against 2–3 recipes manually before committing — can Hira actually fill every field for menemen? What fields are always empty? Prune or make optional before locking
- Use a structured content format (JSON schema or typed CMS schema) enforced at entry time, not validated retrospectively
- Version the schema from day one — even if v1 never changes, the discipline of having a version number prevents future "where did this field come from?" confusion

**Warning signs:**
- Recipe fields being filled with "N/A" or left empty consistently
- AI prompts referencing fields that don't exist in the data model
- Hira creating recipes in a format (doc, spreadsheet) that requires manual conversion to app schema

**Phase:** Recipe schema is a Phase 1 deliverable, not a Phase 2 improvement. No recipe content work begins before schema is finalized.

---

## Moderate Pitfalls

Mistakes that cause significant rework or quality degradation, but are recoverable.

---

### Pitfall 6: LLM Prompt Costs at Scale — Unoptimized Prompts Kill Unit Economics

**What goes wrong:** Every AI interaction sends the full user profile (allergens, goal, skill level), the full recipe (all steps, all annotations), and the full conversation history to the LLM on every turn. With Claude Sonnet-level models, this can cost $0.015–0.05 per chat turn. At 10 turns per cooking session and 1,000 active users, monthly AI costs exceed what the product can afford with no monetization.

**Why it happens:** Prompts are built for correctness during development (include everything so nothing is missed). The cost optimization step is deferred. By the time monetization is designed, the cost per user is already baked into the product behavior.

**Prevention:**
- Audit prompt token counts before launch. Log input and output tokens per request from day one.
- Use prompt caching (Anthropic supports prompt caching for repeated system prompt prefixes) — the user profile and recipe context qualify as cacheable prefix content. This reduces cost for multi-turn cooking sessions by 60–80%.
- Separate the AI use cases by cost profile: substitution suggestions (one-off, can use a smaller/faster model) vs. real-time cooking chat (needs quality, use full model) vs. initial recipe personalization (batch-able, can run on recipe open rather than on every step)
- Set a cost budget per user session (e.g., 50 cents maximum) and design graceful degradation when it's hit ("AI chat limit reached for this session — here are the pre-written tips for this step")
- Use Claude Haiku or equivalent for structured extraction tasks (ingredient normalization, substitution lookup) where quality is less critical than cost

**Warning signs:**
- Average tokens per chat turn above 2,000 input tokens
- Cost per daily active user exceeds $0.10/day without monetization offsetting it
- Prompt construction includes full recipe text on every turn rather than caching it

**Phase:** Prompt architecture and cost instrumentation in the AI infrastructure phase. Cost measurement before any user-facing AI feature is shipped.

---

### Pitfall 7: Turkish Language LLM Quality — Assuming Parity with English

**What goes wrong:** The team tests the AI in English during development and achieves excellent results. They add Turkish translation/localization late. In Turkish, the LLM outputs are grammatically awkward, miss culturally relevant cooking context (e.g., doesn't know what "çevirme" technique means in Turkish home cooking), or produces responses that feel machine-translated rather than natural. Users in the 18–30 Turkish demographic are extremely sensitive to unnatural digital Turkish — it signals inauthenticity.

**Why it happens:** Major LLMs (Claude, GPT-4, Gemini) are significantly better in English than Turkish due to training data distribution. Claude's Turkish quality is good but not equal to English — certain domain-specific terms, cooking idioms, and regional colloquialisms may not be well-represented. Testing in English hides this gap.

**Consequences:**
- AI responses feel robotic or formal in a product that promises a "knowledgeable friend" tone
- Users lose trust in AI suggestions because the language signals low competence
- The core differentiator (human-feeling AI guidance) fails at the language layer

**Prevention:**
- All AI quality testing must happen in Turkish from the first prototype. Do not validate English behavior and assume Turkish transfers.
- Write system prompts in Turkish (not translated English prompts) — prompts written natively in Turkish produce more natural outputs than translated prompts
- Define a tone guide for AI responses: the voice is warm, direct, and uses everyday Turkish cooking vocabulary — not formal or clinical. Include 5–10 example exchanges in the tone guide that the LLM uses as few-shot examples
- Test with Hira's review as the quality gate — she is the target voice and audience. If she finds an AI response unnatural, it fails quality review.
- Maintain a list of cooking terms where LLM knowledge is uncertain (technique names, regional ingredient names) and pre-define those in the system prompt

**Warning signs:**
- AI responses use formal Turkish ("gerçekleştirin" instead of "yapın") in conversational contexts
- AI doesn't recognize common Turkish dish names or regional variants
- Hira flags AI responses as "sounds weird" during quality review

**Phase:** Turkish language quality testing must begin in the AI prototype phase, not after UI is built. It is a core capability gate, not a localization task.

---

### Pitfall 8: App Store Health/Allergen Claims — Review Rejection Risk

**What goes wrong:** The app makes implicit or explicit health claims ("This recipe is safe for people with gluten allergy") without the required disclaimers. Apple App Store reviewers flag the app under health and safety guidelines (Guideline 5.1.3 — health data; Guideline 1.4 — physical harm). Google Play has similar health-adjacent content policies. The rejection delays launch by 2–4 weeks and requires redesigning the copy.

**Why it happens:** The allergen filtering feature is framed in product terms as a safety guarantee, and that framing leaks into the UI copy and app store description. App store reviewers search for health-adjacent language and apply strict standards.

**Consequences:**
- Launch delay of 2–4 weeks for redesign and resubmission
- If the app is approved but later flagged by a user complaint, it can be removed retroactively
- Forces post-launch copy changes that affect Hira's marketing narrative

**Prevention:**
- Frame allergen filtering as a "preference filter" not a "safety guarantee" in all UI copy and app store metadata. "Filters recipes to match your preferences" not "Safe for your allergies."
- Add a persistent disclaimer in the allergen settings screen: "Always check ingredient labels if you have a severe allergy. This app is not a substitute for medical advice."
- Review Apple's App Store Review Guidelines Section 5.1 and 1.4 before submitting. Have someone read the app description and in-app copy specifically looking for claim language.
- Avoid any marketing language that implies medical-grade safety certification

**Warning signs:**
- UI copy uses the word "safe" in conjunction with allergen features
- App store description mentions allergens without a disclaimer
- Goal-aware personalization features are framed as nutritional recommendations

**Phase:** App store copy review is a pre-submission checklist item. Build the disclaimer language into the UI components from the beginning — retrofitting it after launch creates inconsistency.

---

## Minor Pitfalls

Issues worth knowing, but recoverable without major rework.

---

### Pitfall 9: Step-by-Step UI — Scroll Regression Under Pressure

**What goes wrong:** The cooking mode is designed as one-step-at-a-time, but edge cases (long instructions, embedded timer, common mistake callout) cause the step card to overflow and require scrolling — exactly the behavior the design was meant to eliminate. On a phone with wet hands, scrolling a step card is a failure mode.

**Prevention:** Set a hard character limit for step instructions during content creation (150–200 characters for the primary instruction). The "why" and "common mistake" are progressive disclosure — hidden by default, available on tap. Test every step card with the longest possible content before finalizing the UI.

**Phase:** Content guidelines and UI component design, before recipe curation begins.

---

### Pitfall 10: Goal Enhancement Feeling Preachy or Intrusive

**What goes wrong:** The app silently adds a boiled egg to the user's menemen for muscle gain, but the user sees it as an unexpected change to a dish they know. Or the enhancement is surfaced with too much explanation ("We added extra protein because of your muscle gain goal") and feels like a lecture. The tone misses the "knowledgeable friend" bar.

**Prevention:** Goal enhancements must be presented as suggestions or natural extensions, not modifications. "We added an extra egg — great for your goals" is better than a clinical explanation. Give users a one-tap way to dismiss the enhancement and cook the original. Never force an enhancement — the dish the user knows is always available.

**Phase:** Goal personalization UI design phase.

---

### Pitfall 11: Cold Start — 30-Recipe Library Feels Thin for Discovery

**What goes wrong:** 30–50 recipes is the right size for validation but will feel sparse to users who open the browse feed without ingredients in mind. If the same 30 recipes appear in every browse session without meaningful surfacing logic, repeat visitors see nothing new.

**Prevention:** Invest in the browse surfacing logic before launch — skill-level filtering, goal filtering, and seasonal/contextual surfacing (breakfast vs. dinner) make 30 recipes feel like a curated menu rather than a short list. Do not launch browse with an unsorted flat list.

**Phase:** Recipe discovery and browse phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Recipe schema design | Fields added ad hoc mid-curation, requiring migration | Lock schema before first recipe; validate against 2–3 test recipes |
| Content pipeline (allergen tagging) | Tags incomplete or inconsistent; allergen filter unreliable | Allergen tags are required fields, validated at content entry |
| AI infrastructure setup | Latency testing on office wifi, not Turkish mobile networks | Test on real networks with simulated degradation from day one |
| Ingredient input feature | Turkish morphology breaks string matching | Synonym dictionary + LLM normalization + disambiguation UI |
| Offline cooking mode | Recipe caching added as afterthought; timers server-dependent | Cache full recipe on open; timers run on device; decide offline architecture before building cooking mode |
| AI cooking chat | Prompt costs not instrumented until scale | Log token counts from first API call; implement prompt caching before launch |
| Turkish AI quality | Quality only tested in English | All AI quality gates run in Turkish from the first prototype |
| Goal-aware personalization | LLM allergen filtering trusted for safety | Deterministic allergen blocklist at data layer; LLM suggestions validated against it |
| App store submission | Health/allergen claim language triggers rejection | Review Guidelines 1.4 and 5.1 before writing any copy; no "safe for allergies" language |
| Browse/discovery | 30 recipes feel thin without surfacing logic | Skill/goal/context filters make curation feel intentional |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Latency / streaming patterns | HIGH | Well-established LLM engineering pattern; applies directly |
| Allergen safety architecture | HIGH | Deterministic vs. probabilistic safety is a well-documented pattern in health-adjacent AI products |
| Turkish NLP / Zemberek | MEDIUM | Zemberek-NLP is real and actively maintained as of August 2025; verify current status before committing |
| LLM prompt caching (Anthropic) | HIGH | Anthropic prompt caching is a documented, live feature as of mid-2024 |
| Turkish LLM quality | MEDIUM | Directionally correct (English > Turkish for major LLMs) but Claude's Turkish quality may have improved; validate with prototype testing |
| App store health claim policies | MEDIUM | Apple Guideline 1.4 and 5.1 are stable; always verify current guidelines at submission time |
| Offline mobile architecture patterns | HIGH | React Native + SQLite/WatermelonDB offline-first is established pattern |
| LLM cost per token estimates | MEDIUM | Token pricing changes frequently; verify current Anthropic pricing at project start |

---

## Sources

All findings are from training knowledge (cutoff August 2025) applied to the specific PROJECT.md context. No external verification was possible in this session due to tool restrictions.

**Verify before implementing:**
- Current Anthropic Claude API pricing and prompt caching documentation: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- Apple App Store Review Guidelines (health and safety): https://developer.apple.com/app-store/review/guidelines/
- Zemberek-NLP (Turkish NLP library): https://github.com/ahmetaa/zemberek-nlp
- Google Play health content policies: https://support.google.com/googleplay/android-developer/answer/9876714
