# Architecture Patterns: The Cook

**Domain:** AI-powered mobile cooking assistant (cross-platform iOS + Android)
**Researched:** 2026-03-08
**Confidence:** MEDIUM — Architecture reasoning grounded in well-established patterns for offline-first mobile apps, BaaS, and LLM integration. External source verification unavailable in this session; flag for review before locking decisions.

---

## Recommended Architecture

The Cook is an **offline-first mobile app with a thin cloud layer**. The recipe library and cooking experience must work without internet; AI features degrade gracefully when offline. The backend is a BaaS (Supabase recommended) that handles auth, profile sync, and AI proxy. The LLM is never called directly from the client — all AI calls go through a server-side function to protect API keys and enable caching.

```
[Mobile App]
     |
     |── [Local SQLite / WatermelonDB]  ← recipes, user profile, cached AI responses
     |
     |── [Supabase]  ← auth, remote profile sync, usage events
          |
          |── [Edge Functions]  ← AI proxy, goal-aware personalization logic
               |
               |── [Anthropic Claude API]  ← chat, substitutions, error recovery
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Mobile App (React Native / Expo)** | UI, navigation, cooking mode, timer logic, offline recipe access | Local DB, Supabase Auth, AI Proxy |
| **Local DB (WatermelonDB + SQLite)** | Offline storage: recipe library, user profile, cooking session state, cached AI responses | Mobile App only |
| **Supabase Auth** | Anonymous and email/social sign-in, session tokens | Mobile App |
| **Supabase DB (Postgres)** | Canonical user profile (goal, allergens, skill), app-wide recipe metadata, usage analytics | Edge Functions, Mobile App (sync) |
| **Supabase Edge Functions** | AI proxy: constructs prompts, calls Claude, caches results, enforces allergen context | Mobile App (HTTPS), Claude API |
| **Anthropic Claude API** | Goal-aware personalization, real-time chat, substitution reasoning, error recovery | Edge Functions only (never direct from client) |
| **Recipe Content (bundled JSON)** | 30-50 curated recipes shipped with app binary; no network required | Mobile App reads on boot, seeds Local DB |

---

## Data Flow

### Onboarding Flow
```
User input (goal / allergens / skill)
  → Mobile App stores locally (WatermelonDB)
  → Supabase profile upsert (when online)
  → Profile applied silently to all subsequent operations
```

### Recipe Discovery Flow
```
User enters available ingredients
  → Mobile App queries Local DB (full-text or tag match on recipe.ingredients[])
  → Filter by: allergen_flags NOT IN user.allergens, skill_level <= user.skill
  → Rank by: ingredient coverage score
  → Return ranked list (100% local, zero network)
```

### Goal-Aware Personalization Flow
```
User taps recipe
  → Mobile App checks: is personalized_version cached in Local DB? YES → show cached
  → NO: send to Edge Function:
      { recipe_id, recipe_data, user_profile }
  → Edge Function builds prompt: "Adapt this recipe for [goal], no [allergens]"
  → Claude returns structured JSON: { modified_ingredients[], goal_note }
  → Edge Function caches result in Supabase DB (keyed: recipe_id + user_goal)
  → Mobile App stores in Local DB, displays personalized version
```

### Guided Cooking Flow
```
User enters cooking mode
  → Mobile App reads recipe steps from Local DB (offline-safe)
  → Step state machine: current_step index stored locally
  → Timer triggers: App-native countdown (no network)
  → User asks "is this done?" → goes to AI Chat flow (below)
```

### AI Chat Flow (Real-Time, Mid-Cook)
```
User sends message
  → Mobile App checks connectivity
  → ONLINE: POST to Edge Function
      { message, current_step, recipe_context, user_profile }
      → Claude streams response (streaming via SSE)
      → Edge Function forwards stream to client
      → Mobile App renders tokens as they arrive
  → OFFLINE: Mobile App shows fallback UI:
      "Bağlantı yok — bu adım için yaygın sorunlar: [step.common_mistakes]"
      (Offline fallback uses step-level pre-written content from recipe data)
```

### Substitution Flow
```
User requests substitution for ingredient X
  → Mobile App checks Local DB: recipe.ingredients[X].substitutions[]
  → If substitution exists AND is allergen-safe → show immediately (zero network)
  → If not: send to Edge Function → Claude reasons substitution aligned to profile
  → Result cached in Local DB for this recipe session
```

---

## Recipe Data Structure

This is the most critical architectural decision. A flat recipe schema cannot support goal enhancements, allergen flags, step-level metadata, and substitution lookups. Use a deeply nested JSON schema that ships bundled with the app.

```typescript
interface Recipe {
  id: string;                    // "menemen-001"
  slug: string;                  // "menemen"
  title: string;                 // "Menemen"
  skill_level: "beginner" | "intermediate" | "advanced";
  tags: string[];                // ["breakfast", "vegetarian", "egg"]

  base_ingredients: Ingredient[];

  goal_enhancements: {
    lose_weight?: Enhancement;   // calorie-reduced swaps
    gain_muscle?: Enhancement;   // protein additions (e.g., extra egg + feta)
    maintain?: Enhancement;      // minor tweaks
    // no_goal: no enhancement applied
  };

  steps: Step[];

  allergen_flags: string[];      // ["gluten", "lactose", "egg"] — union of all ingredients

  metadata: {
    estimated_minutes: number;
    serving_size: number;
    curated_by: string;          // "Hira"
    version: number;             // bump when content updated
  };
}

interface Ingredient {
  id: string;
  name: string;                  // Turkish name
  quantity: string;              // "2 adet"
  unit: string | null;
  allergens: string[];           // allergens this ingredient carries
  substitutions: Substitution[]; // pre-written substitutes for this ingredient
  optional: boolean;
}

interface Substitution {
  ingredient_id: string;         // what to use instead
  name: string;
  note: string;                  // "Tadı hafif farklı olur ama tarif çalışır"
  changes_dish_meaningfully: boolean;
  allergens: string[];           // allergens the substitute carries
}

interface Enhancement {
  additional_ingredients: Ingredient[];
  modified_quantities: { ingredient_id: string; new_quantity: string }[];
  goal_note: string;             // "Kas kazanımı için ekstra protein kaynağı eklendi"
}

interface Step {
  index: number;
  instruction: string;           // "Domatesleri küp küp doğrayın"
  why: string;                   // "Küçük doğramak pişirme süresini kısaltır"
  looks_like_when_done: string;  // "Domatesler sulanmaya başlamış olmalı"
  common_mistake: string;        // "Çok erken karıştırmak — bekleyin"
  has_timer: boolean;
  timer_seconds: number | null;
  requires_ai_check: boolean;    // hint: this step benefits from "is this done?" prompt
}
```

**Why this structure:**
- Allergen filtering is O(1): compare `recipe.allergen_flags` against `user.allergens` without inspecting every ingredient.
- Goal enhancements are pre-authored per recipe, not hallucinated per-request. AI only handles cases not covered by authored content.
- Step-level `common_mistake` and `why` fields power offline fallback for the AI chat (the app always has something useful to show, even without connectivity).
- `substitutions` at ingredient level enables fully offline substitution for common swaps; AI is reserved for edge cases.

---

## AI Call Strategy

**Principle: AI is a last resort, not a first resort.** Every feature that can be served from local data should be. AI fills the gaps.

| Feature | First Path | AI Path | When AI Fires |
|---------|-----------|---------|---------------|
| Recipe discovery | Local SQLite query | — | Never — fully local |
| Allergen filtering | Local field comparison | — | Never |
| Goal enhancement | Pre-authored `goal_enhancements` field | Claude via Edge Function | Only if no authored enhancement for that recipe+goal combo |
| Substitution | `ingredient.substitutions[]` local lookup | Claude via Edge Function | Only when local substitution not available or user asks open-ended question |
| Guided step display | Local recipe step data | — | Never |
| "Is this done?" / step check | Step `looks_like_when_done` shown first | Claude streaming chat | When user explicitly opens chat |
| Mid-cook error recovery | Step `common_mistake` shown inline | Claude streaming chat | When user explicitly asks |
| General chat | — | Claude streaming chat | Always — this is the feature |

**Streaming:** Claude chat responses stream via SSE (Server-Sent Events) through the Edge Function. This gives the "typing" feel appropriate for a cooking companion without waiting for full response before display.

**Caching strategy:**
- Goal-enhanced recipe versions: cached indefinitely (keyed: `recipe_id + goal`), invalidated only when recipe `version` bumps.
- Chat responses: not cached — they are contextual, one-off.
- Substitution AI responses: cached for session only (user may change context).

**Offline degradation hierarchy:**
1. Serve from local data (always possible for recipe/step content)
2. Serve from Local DB cache (possible for previously fetched AI enhancements)
3. Show pre-written step-level fallback content (`common_mistake`, `looks_like_when_done`)
4. Show "no connection" notice with specific next step instruction — never a dead end

---

## Backend Architecture Decision: Supabase over Firebase

**Recommendation: Supabase**

| Criterion | Supabase | Firebase |
|-----------|----------|---------|
| Database | Postgres (SQL, queryable) | Firestore (NoSQL, document) |
| Edge Functions | Deno-based, deploy with CLI | Cloud Functions (more verbose setup) |
| Auth | Built-in, anonymous + OAuth | Built-in, anonymous + OAuth |
| Real-time | Postgres replication channels | Firestore real-time listeners |
| Pricing (small scale) | Free tier generous | Free tier adequate |
| Vendor lock-in | Lower — standard Postgres | Higher — Firestore query model is proprietary |
| AI proxy suitability | Edge Functions handle streaming cleanly | Cloud Functions can stream but more complex |
| Open source | Yes — self-hostable | No |
| Turkish locale | No material difference | No material difference |

**Why Supabase for The Cook specifically:**
- User profile is structured relational data (goal, allergens array, skill) — Postgres is a natural fit; Firestore array-in queries are awkward.
- Edge Functions are the cleanest way to proxy streaming Claude responses on the BaaS tier.
- Future recipe library expansion (AI-generated content) benefits from Postgres full-text search without an additional service.
- Supabase's open-source nature means zero vendor lock-in risk for a bootstrapped project.

Confidence: MEDIUM (based on known Supabase and Firebase capabilities as of mid-2025; verify current Edge Function streaming support in Supabase docs before committing).

---

## Offline Architecture

**Strategy: Bundle-first, sync-second**

The 30-50 core recipes ship **inside the app bundle** as JSON files. On first launch, the app seeds WatermelonDB from these bundled files. There is no cold-start network dependency.

```
App install
  → Bundle includes: /assets/recipes/*.json  (30-50 files, ~200KB total estimated)
  → First launch: seed WatermelonDB from bundle
  → Subsequent launches: read from Local DB directly

Background sync (when online):
  → Check Supabase for recipe version bumps
  → Fetch updated recipe JSON, re-seed changed records in Local DB
  → Sync user profile (local → remote)
```

**WatermelonDB over AsyncStorage / MMKV:**
- WatermelonDB uses SQLite under the hood, runs on a background thread — UI never blocks on DB operations.
- Supports complex queries (multi-field filtering) that AsyncStorage (key-value only) cannot.
- React Native native module — no Expo Go limitation (use Expo bare workflow or EAS Build).

**Cooking session persistence:**
- Current step index stored in WatermelonDB `cooking_sessions` table.
- App kill mid-cook → user returns to exact step. No network required.
- Timers: use React Native background timer libraries; state persisted locally.

---

## Patterns to Follow

### Pattern 1: Profile Context Injection

Every AI call receives the full user profile context, constructed in the Edge Function — never trusted from the client payload.

```typescript
// Edge Function: build_ai_context.ts
async function buildPromptContext(userId: string, recipeId: string) {
  const profile = await supabase
    .from('user_profiles')
    .select('goal, allergens, skill_level')
    .eq('id', userId)
    .single();

  return {
    system: `Sen bir yemek asistanısın. Kullanıcının hedefi: ${profile.goal}.
             Alerjenleri: ${profile.allergens.join(', ')}.
             Seviye: ${profile.skill_level}.
             Yanıtlarında bu bilgileri sessizce uygula, açıkça belirtme.`,
    // ... recipe context
  };
}
```

**Why:** User profile is the source of truth in Supabase, not in client-sent JSON. Prevents a client sending a spoofed profile to get different AI output.

### Pattern 2: Structured AI Output

Goal enhancement and substitution calls request JSON output explicitly, validated before caching.

```typescript
// Edge Function response handling
const response = await claude.messages.create({
  model: "claude-3-5-sonnet-latest",
  max_tokens: 1024,
  messages: [{ role: "user", content: prompt }],
  // Use tool_use or structured output to enforce schema
});

// Validate against Enhancement schema before caching
const enhancement = validateEnhancement(response.content[0].text);
if (!enhancement) throw new Error("AI returned invalid enhancement schema");
await cacheEnhancement(recipeId, userGoal, enhancement);
```

### Pattern 3: Step State Machine

Cooking mode is a finite state machine, not a scroll view. State is local-only.

```
States: IDLE → RECIPE_SELECTED → COOKING(step_index) → COMPLETE
Transitions: START, NEXT_STEP, PREV_STEP, TIMER_START, TIMER_END, FINISH
Persistence: step_index written to WatermelonDB on every transition
```

This ensures the app can be killed and resumed without losing cooking progress.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct Client-to-LLM Calls

**What:** Mobile app calls Claude API directly with the API key embedded in the app.
**Why bad:** API key is extractable from app bundle. Unlimited cost exposure. No server-side caching possible.
**Instead:** All Claude calls go through Supabase Edge Functions. Client sends authenticated request; Edge Function holds the key.

### Anti-Pattern 2: Fetching All Recipes from Network on Launch

**What:** App calls Supabase on launch to fetch recipe list before showing anything.
**Why bad:** Cooking without internet means the app shows a loading spinner or error. Destroys offline-first promise.
**Instead:** Bundle recipes with the app. Network is for version updates only, fetched silently in the background.

### Anti-Pattern 3: Storing Allergen Logic Only on Server

**What:** Allergen filtering happens in Supabase query; client just shows results.
**Why bad:** Offline recipe discovery becomes impossible. If the server filters, offline shows nothing or shows unsafe results.
**Instead:** `allergen_flags` is part of the bundled recipe schema. Client-side filtering is the primary path.

### Anti-Pattern 4: Unstructured AI Responses for Goal Enhancement

**What:** Ask Claude "adapt this recipe" and render the text directly in the ingredients list.
**Why bad:** Unparseable format means you can't reliably update quantities, mark new ingredients, or cache the result.
**Instead:** Enforce a JSON schema in the prompt / via tool_use. Validate before display.

### Anti-Pattern 5: Expo Go Dependency

**What:** Build with libraries that require native modules (WatermelonDB, background timers) but rely on Expo Go for testing.
**Why bad:** WatermelonDB requires a native build. Expo Go cannot load it.
**Instead:** Use EAS Build from the start. Set up a development build on physical devices in Phase 1.

---

## Suggested Build Order (Phase Dependencies)

Components have hard dependencies. Build in this order:

```
1. Recipe Data Schema + Bundled JSON
   → Everything else reads recipe data. Must exist first.
   → Define the TypeScript interfaces. Hira populates 5-10 pilot recipes.

2. Local DB Layer (WatermelonDB)
   → Seeding from bundled JSON, querying for discovery
   → Dependency: recipe schema must be final (or stable enough)

3. User Profile (local storage + Supabase auth)
   → Onboarding screens write to Local DB + Supabase
   → Dependency: none from above (parallel with Local DB setup)

4. Recipe Discovery (ingredient matching, allergen filter)
   → Pure local query against Local DB
   → Dependency: Local DB + recipe data + user profile

5. Guided Cooking Mode
   → Step state machine, timers, step display
   → Dependency: Local DB (recipe steps), user profile (for personalized display)

6. Supabase Edge Functions + Claude Integration
   → AI proxy, goal enhancement, substitution
   → Dependency: Supabase project, user profile (for context injection)

7. Goal-Aware Personalization
   → Calls Edge Function, caches result in Local DB
   → Dependency: Edge Functions, Local DB

8. Real-Time AI Chat (mid-cook)
   → Streaming chat via Edge Function
   → Dependency: Edge Functions, cooking mode context

9. Offline Degradation Hardening
   → Test all paths offline, verify fallback content displays
   → Dependency: all above completed
```

---

## Scalability Considerations

| Concern | At 1K users | At 50K users | At 500K users |
|---------|-------------|--------------|---------------|
| Recipe delivery | Bundled — no server load | Same | Same (bundle updates via OTA or app store) |
| AI call volume | Supabase Edge Functions free tier | Monitor Claude API costs; add response caching layer | Dedicated cache (Redis) for popular recipe+goal combos |
| User profile sync | Supabase free tier adequate | Supabase Pro | Supabase Pro + read replicas |
| AI chat latency | Streaming hides latency | Same | Rate limiting per user to control cost |
| Content updates | Manual JSON update + app release or OTA | Consider CMS (Supabase Studio sufficient for Hira) | Headless CMS for content team |

For v1 (target: validate concept, hundreds to low thousands of users), the free tiers of Supabase and Claude API usage are entirely sufficient. No over-engineering needed.

---

## Open Questions / Flags for Phase Research

| Question | Why It Matters | Phase to Resolve |
|----------|---------------|-----------------|
| Does Supabase Edge Functions support SSE streaming to React Native clients? | Streaming chat requires SSE or WebSocket from Edge Function | Phase: AI Integration |
| WatermelonDB vs expo-sqlite (Expo SDK 51+ built-in) | expo-sqlite is now capable and simpler to set up in Expo; WatermelonDB is more powerful but heavier | Phase: Local DB |
| Claude tool_use / structured output for recipe enhancement JSON | Structured output enforces schema; verify current API support | Phase: AI Integration |
| Background timer behavior on iOS when app is backgrounded | Cooking timers must survive app backgrounding on iOS | Phase: Guided Cooking |
| OTA update strategy for recipe content | Bundling recipes means app store release for content updates unless OTA (EAS Update) is used | Phase: Content Pipeline |

---

## Sources

Note: External web search was unavailable during this research session. Architecture recommendations are based on:

- Established React Native + Expo offline-first patterns (confidence: HIGH — well-documented, stable patterns)
- WatermelonDB documentation and known SQLite-backed offline capabilities (confidence: HIGH)
- Supabase architecture documentation known through August 2025 (confidence: MEDIUM — verify current Edge Function streaming support)
- Anthropic Claude API capabilities known through August 2025 (confidence: MEDIUM — verify structured output / tool_use current state)
- General BaaS comparison patterns for small-team mobile apps (confidence: MEDIUM)
- Firebase vs Supabase known tradeoffs as of mid-2025 (confidence: MEDIUM)

**Verification recommended before locking:** Supabase Edge Function SSE support, expo-sqlite capabilities in current SDK, Claude tool_use schema enforcement.
