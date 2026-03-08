# Technology Stack

**Project:** The Cook — AI-powered mobile cooking companion
**Researched:** 2026-03-08
**Confidence note:** Web tools unavailable during this research session. All recommendations are based on training data (knowledge cutoff August 2025). Versions marked LOW confidence should be pinned by running `npx expo --version` and checking `npmjs.com` at project init time. Architecture-level decisions are HIGH confidence.

---

## Recommended Stack

### Core Mobile Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Expo (managed workflow) | SDK 52.x | Cross-platform mobile shell, OTA updates, build pipeline | Managed workflow eliminates native toolchain complexity for a solo build. Expo Go for rapid iteration. EAS Build for App Store / Play Store delivery. New Architecture (Fabric + JSI) is on by default from SDK 52. |
| React Native | 0.76.x (bundled by Expo SDK 52) | Core mobile framework | Ships with Expo SDK 52. New Architecture enabled by default — better performance for cooking timer / camera interactions. Largest community, best TypeScript support. |
| TypeScript | 5.x | Language | Type safety across AI response shapes and recipe data structures. Required for a solo builder to catch errors at compile time. |
| Expo Router | v4 (file-system routing) | Navigation | File-system routing matches web conventions. Deep linking for recipe share URLs. Built on React Navigation v7 under the hood. No manual route config. |

**Why not Flutter:** Flutter is a strong choice but Dart is a smaller ecosystem — fewer AI/LLM libraries, fewer Turkish i18n resources. For a solo build integrating Claude API with React-paradigm components, React Native / Expo wins on ecosystem fit. The performance gap is irrelevant for a recipe + chat app.

**Why not bare React Native workflow:** Managed Expo handles push notifications, OTA updates, and EAS Build for both stores without touching Xcode or Android Studio. Ejecting adds complexity with no benefit at this stage.

### AI Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Anthropic Claude API (claude-3-5-haiku or claude-3-5-sonnet) | Current API | Real-time cooking guidance, substitution suggestions, error recovery chat | Claude is already named in the project spec. Haiku for low-latency in-cook chat (fast, cheap). Sonnet for richer recipe adaptation and goal-aware personalization. Streaming responses via Server-Sent Events give the user visible progress during cooking queries. |
| Backend API proxy (see Backend section) | — | Relay all AI calls | **Never call Claude API directly from the mobile client.** API key exposure is a critical security issue. All LLM calls go through the backend; the client sends a request and receives the stream. |
| Streaming (SSE or chunked fetch) | — | Progressive AI response rendering | Cooking questions ("is this done?") feel instant with streaming. User sees the answer build word-by-word. Implement with `fetch` + `ReadableStream` on the client side, or a WebSocket if bidirectional signaling is needed. |

**Model selection guidance:**
- `claude-3-5-haiku-20241022`: Use for in-cook chat and substitution lookups. Fastest, cheapest. Sufficient for single-turn Q&A during cooking.
- `claude-3-5-sonnet-20241022`: Use for recipe personalization (goal-aware adaptation at recipe selection time). Higher quality reasoning for complex dietary constraint handling.

**Confidence:** MEDIUM — Model names are from training data. Verify current model IDs at `console.anthropic.com` before implementation.

### Backend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase | Latest (self-hosted or cloud) | PostgreSQL database, Auth, Storage, Edge Functions, Realtime | Single platform handles auth + DB + serverless functions. Row Level Security enforces user data isolation without custom middleware. Edge Functions (Deno) proxy all Claude API calls — this is where the API key lives. Free tier is sufficient for v1 scale. Turkish locale support is irrelevant at the DB layer (content is stored in Turkish). |
| Supabase Auth | Bundled | Authentication | Email/password + OAuth (Google, Apple — required for App Store). Built-in JWT. No separate auth service needed. |
| Supabase Edge Functions (Deno) | Bundled | AI proxy, recipe matching logic | Keeps Claude API key off the client. Also handles ingredient matching logic (fuzzy matching against recipe ingredient lists) server-side. |
| PostgreSQL (via Supabase) | 15.x | Primary data store | User profiles, preferences, recipe catalog (30–50 curated recipes), cooking session history. RLS policies enforce per-user data access. |

**Why not Firebase:** Firebase is fine but Supabase gives you a real PostgreSQL database, which matters for recipe ingredient matching queries (e.g., "find recipes where ingredients overlap with user's list"). Firestore's document model makes that kind of query awkward.

**Why not a custom Node.js server:** Solo build. Supabase Edge Functions eliminate the need to manage a server, handle scaling, or configure CORS. Ship faster.

**Why not serverless (Vercel / AWS Lambda) separately:** Supabase Edge Functions are serverless, co-located with your database, and included in the Supabase free tier. No extra service to manage.

### Offline Capability

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| expo-sqlite | Bundled (SQLite 3.x) | Local recipe and profile cache | Users cook without internet. The curated recipe library (30–50 recipes) must be available offline. expo-sqlite provides a proper relational store on-device. Syncs from Supabase on app open / when online. |
| WatermelonDB | ~0.27.x | Reactive offline-first database layer on top of SQLite | Adds sync primitives, observable queries (auto-update UI when data changes), and a proper sync protocol. Overkill for v1 with 50 recipes — use only if sync complexity grows. |
| Zustand | ~5.x | Client-side state management | Lightweight, TypeScript-first. Manages cooking session state (current step, timer state, chat history). Does not persist by default — combine with `zustand/middleware/persist` + AsyncStorage for profile/settings persistence. |
| AsyncStorage (`@react-native-async-storage/async-storage`) | ~2.x | Key-value persistence for lightweight offline state | Profile preferences, onboarding completion flag, last viewed recipe. Not for recipe content (use SQLite for that). |

**Offline strategy:**
1. On first launch (online): Download all 30–50 curated recipes into SQLite. Store as structured rows (recipe header, steps, ingredients).
2. On subsequent launches (offline): Serve from SQLite. UI shows "offline mode" banner; AI features are disabled with a clear message ("AI assistant requires internet connection").
3. Cooking mode: Fully offline once recipe is loaded. Timers, step-by-step navigation — no network needed.
4. AI chat mid-cook: Requires internet. If offline, show "Connect to internet to ask the AI assistant."

**Recommendation: Start with expo-sqlite + Zustand. Skip WatermelonDB for v1.** Fifty recipes is not a sync problem.

### Localization (Turkish)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| i18next + react-i18next | i18next ~23.x, react-i18next ~15.x | UI string localization | Industry standard. JSON translation files. Interpolation, pluralization, date formatting. Works with Expo. |
| expo-localization | Bundled | Detect device locale | Detect if device is set to Turkish (`tr-TR`). Default to Turkish; fall back to English. No manual language picker needed for v1 (audience is Turkish). |
| `date-fns` with `tr` locale | ~3.x | Turkish date/time formatting in UI | Recipe creation dates, timer display. `date-fns` is tree-shakeable and includes a Turkish locale module. |

**AI responses in Turkish:** Claude handles Turkish natively. System prompt must instruct Claude to respond in Turkish. No translation layer needed on AI output. Include explicit instruction: "Sen bir yemek asistanısın. Her zaman Türkçe yanıt ver."

**Content:** Recipe content is authored directly in Turkish by Hira. No translation pipeline needed for content — source is already Turkish.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-native-mmkv` | ~3.x | Fast synchronous key-value store | Use for cooking session state that needs to survive app kills (e.g., which step the user was on). Faster than AsyncStorage (synchronous, native). |
| `expo-notifications` | Bundled | Timer push notifications | Cooking timers that fire even if app is backgrounded. Required for step timers. |
| `expo-av` | Bundled | Audio cues | Optional: play a sound when a timer completes. Better UX than silent push. |
| `expo-camera` | Bundled | "Is this done?" photo input | If implementing visual AI check ("take a photo and I'll tell you if it looks right"), this is the camera primitive. Defer to post-MVP. |
| `react-hook-form` + `zod` | rhf ~7.x, zod ~3.x | Form handling + validation | Ingredient input form, onboarding profile form. Zod schemas also validate AI response structures. |
| `@shopify/flash-list` | ~1.7.x | High-performance list rendering | Recipe feed. Faster than FlatList for long lists. Use from day one — migrating later is painful. |
| `react-native-reanimated` | ~3.x (bundled with Expo SDK 52) | Smooth step transitions, timer animations | Step-by-step cooking mode transitions. Built into Expo managed workflow. |
| `react-native-gesture-handler` | ~2.x (bundled) | Swipe between steps | Swipe gestures in cooking mode (swipe right = next step). Already included with Expo Router. |
| `expo-keep-awake` | Bundled | Prevent screen sleep during cooking | Screen must stay on while user is cooking. One-line implementation. Critical for UX. |

### Development Tooling

| Tool | Version | Purpose | Why |
|------|---------|---------|-----|
| EAS (Expo Application Services) | Current | Build + submit to App Store / Play Store | Managed cloud builds. No local Xcode/Android Studio required. OTA updates via `expo-updates`. |
| ESLint + Prettier | Current | Code quality | Standard. Use `eslint-config-expo` as base. |
| Bun | ~1.x | Package manager + task runner | Faster than npm/yarn for a solo build. Compatible with Expo. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Mobile framework | Expo (managed) | Flutter | Dart ecosystem has fewer LLM/AI library integrations; solo build favors JS ecosystem depth |
| Mobile framework | Expo (managed) | Bare React Native | Adds Xcode/Android Studio complexity with no v1 benefit |
| Backend | Supabase | Firebase | Firestore document model is poor fit for ingredient-overlap queries; PostgreSQL is better |
| Backend | Supabase | Custom Node.js API | Eliminates infrastructure overhead; solo build constraint |
| Backend | Supabase | PocketBase | Supabase has better edge function support for LLM proxying; larger community |
| State management | Zustand | Redux Toolkit | Redux is overkill for this data shape; Zustand is 1/10th the boilerplate |
| State management | Zustand | React Context | Context re-renders are a problem in cooking mode with frequent timer updates |
| Offline DB | expo-sqlite | WatermelonDB | WatermelonDB sync is unnecessary complexity for 50-recipe v1 library |
| AI provider | Claude API | OpenAI GPT-4o | Project spec names Claude; Turkish language quality is comparable; no reason to deviate |
| List rendering | FlashList | FlatList | FlashList is 10x faster for recipe feeds; no reason to use FlatList in 2025 |
| Navigation | Expo Router | React Navigation (manual) | Expo Router is file-system-based, less config, deep linking built-in |

---

## Installation

```bash
# Bootstrap project
npx create-expo-app@latest the-cook --template blank-typescript

# Navigation
npx expo install expo-router

# State
bun add zustand

# Offline storage
npx expo install expo-sqlite @react-native-async-storage/async-storage react-native-mmkv

# Localization
bun add i18next react-i18next date-fns
npx expo install expo-localization

# Forms and validation
bun add react-hook-form zod @hookform/resolvers

# Performance
bun add @shopify/flash-list

# Supabase
bun add @supabase/supabase-js

# Dev dependencies
bun add -D typescript @types/react eslint prettier eslint-config-expo
```

---

## Architecture Notes for Stack

**API key security:** Claude API key lives ONLY in Supabase Edge Function environment variables. Client authenticates to Supabase with a per-user JWT, then calls the Edge Function, which calls Claude. Zero API key exposure on client.

**Offline boundary:** The SQLite layer is the offline boundary. Everything above SQLite (AI calls, Supabase sync) requires network. Everything at or below SQLite (recipe display, step navigation, timers, profile) works offline.

**Turkish AI output:** Claude's multilingual capability means no translation layer. System prompt enforces Turkish output. Test with native Turkish speakers during development — model output quality should be validated, not assumed.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Expo/React Native as framework choice | HIGH | Stable ecosystem choice, well-validated for this use case |
| Expo SDK version (52.x) | MEDIUM | Based on training data (cutoff Aug 2025). Verify: `npx expo --version` |
| React Native version (0.76.x) | MEDIUM | Bundled by Expo SDK 52 per training data. Confirm at project init |
| Supabase as backend | HIGH | Well-established for mobile + auth + serverless, free tier fits v1 |
| Claude API model names | LOW | Model IDs change frequently. Verify at `console.anthropic.com` before coding |
| Library versions (zustand, zod, etc.) | MEDIUM | Verify with `npm info [package] version` at init time |
| Offline strategy (SQLite + Zustand) | HIGH | Architecture-level decision, not version-dependent |
| Turkish localization approach (i18next) | HIGH | Industry standard, stable |

---

## Sources

- Expo documentation (training data, SDK 52 release notes)
- React Native New Architecture announcement (0.74+)
- Supabase documentation and Edge Functions reference
- Anthropic Claude API documentation (models and streaming)
- react-i18next documentation
- Note: Web verification tools were unavailable during this research session. All version numbers should be re-confirmed at project initialization.
