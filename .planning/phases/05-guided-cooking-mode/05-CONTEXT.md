# Phase 5: Guided Cooking Mode - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can enter a focused step-by-step cooking mode from any recipe. Cooking mode shows one step at a time with instruction, why annotation, looks-like-when-done description, and common mistake warning. Steps with timing auto-trigger a countdown timer. Sessions persist across app kill and resume on reopen. AI chat ("Ask Chef") and ingredient swap logic are out of scope — buttons are placed but non-functional in v1.

</domain>

<decisions>
## Implementation Decisions

### Screen flow
- **Replace current recipe detail screen** (`app/recipe/[id].tsx`) with a new **cooking preview screen**
- Preview screen shows: recipe hero, metadata, ingredients, and a **Steps Preview** section at the bottom
- Steps Preview: step boxes with step titles and pastel color placeholders (images deferred beyond v1)
- Prominent **"Start Cooking"** button at the bottom of preview screen
- Tapping "Start Cooking" enters the **step-by-step cooking view** — a separate full-screen experience

### Step navigation
- **Swipe left/right** between steps AND **prev/next buttons** at bottom
- Bottom buttons: "Malzemeler" (ingredients overlay) on left, "Sonraki" (next step) on right, small "Geri" (back) button below
- Top left: back-to-preview button
- Top right: "Ask Chef" button (v1: shows "coming soon" tooltip on tap)
- **Segmented progress bar** at top showing current position across all steps
- Sequential navigation only — no step list overlay for jumping

### Step content layout
- **Pastel color placeholder image** at top of each step (step-level images deferred)
- At the image/text boundary: **step title on the left**, **circular timer on the right** (timer only appears for steps with `timerSeconds`)
- **Instruction text** below the title/timer line
- **"Görmeli" (You should see)** section immediately after instruction — what the result should look/smell/feel like
- **"Neden?" (Why)** — tap-to-reveal link below instruction; expands on tap, collapses on second tap
- **"Dikkat" (Watch out)** section at the **bottom** of step content — common mistake + recovery text
- All content scrollable if it exceeds screen height

### Timer behavior
- **Circular countdown ring** with minutes:seconds in center
- **Manual start** — timer does NOT auto-start; play/pause button inside the circle
- **One active timer at a time** — starting a new timer on a different step cancels/resets the previous one
- **Background running** — timer continues when screen locks or app backgrounded; uses scheduled local notification for completion alert
- **Floating indicator on other steps** — when a timer is running and user navigates away, a small floating indicator shows on other steps with directional arrow (left arrow = timer from a previous step, right arrow = timer from a future step); tapping it navigates back to the timer step
- **Completion alert**: short alert sound + visual pulse/flash on the timer circle; NO vibration; timer stays showing 0:00 until user taps to dismiss
- **Notification permission prompt** — on first-ever timer start, request notification permission with sincere Turkish language explaining it's so we can tell them when their food is ready

### Ingredients overlay
- **Bottom sheet / overlay** showing ALL recipe ingredients (not per-step)
- Each ingredient has a **checkbox** — checking it greys out the ingredient name (visual help only, no logic)
- Each ingredient has a **"Değiştir" (Swap) button** — v1: button is present but tapping it shows a placeholder/coming-soon state (AI swap is v2: AIPER-03)
- Ingredient checklist state is part of session persistence

### Completion screen
- After last step, "Sonraki" button leads to a **completion screen**
- **"Afiyet olsun!"** celebration message with recipe name
- Shows total cooking time (from session start timestamp)
- "Back to recipes" button returns to feed

### Session persistence
- **Full session state saved** to SQLite on every step change:
  - `recipe_id` — which recipe
  - `current_step` — step index (0-based)
  - `timer_remaining` — seconds left if timer was running (null if no timer active)
  - `timer_start_timestamp` — when the timer was started (for recalculating elapsed on resume)
  - `ingredient_checks` — JSON array of checked ingredient indices
  - `session_started_at` — when cooking started (for completion screen)
- **Resume banner** on feed/home screen when an active session exists: "Yarım kalan tarifin var — devam et?" with recipe name and step count
  - "Devam Et" button → jumps to cooking view at saved step
  - "Kapat" button → clears session, dismisses banner
- Only one active cooking session at a time

### Claude's Discretion
- Exact pastel color palette for step image placeholders
- Segmented progress bar visual design
- Swipe gesture implementation details (react-native-gesture-handler vs PanResponder)
- Cooking session SQLite table schema
- Animation/transitions between steps
- Exact "coming soon" tooltip design for Ask Chef and Swap buttons
- Completion screen illustration/animation
- Timer alert sound selection

</decisions>

<specifics>
## Specific Ideas

- Step image area uses pastel colors as placeholders (real step images are for later versions — same pattern as recipe cover photos in Phase 4)
- Timer circle sits at the boundary between image area and text content — step title left, timer right. Feels integrated, not bolted on
- "Ask Chef" button establishes the AI assistant presence even before v2 — users see it exists, building anticipation
- Notification permission prompt should feel sincere, not corporate — explain that it's so we can tell them when their food is ready while they do something else
- Ingredient swap buttons present even though non-functional — establishes the pattern, reduces v2 effort
- "Dikkat" (Watch out) at the bottom because users read the instruction first, then do the action, then check for mistakes — matches the temporal flow

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/types/recipe.ts`: `StepSchema` already has all needed fields — `instruction`, `why`, `looksLikeWhenDone`, `commonMistake`, `recovery`, `timerSeconds`, `stepImage`
- `src/db/recipes.ts`: `getRecipeById()` fetches full recipe with parsed steps via `RecipeSchema.parse()` — direct entry point for cooking mode
- `app/recipe/[id].tsx`: Current recipe detail screen to be replaced with the cooking preview screen; category gradients, skill labels, allergen labels all reusable
- `constants/theme.ts`: Existing theme constants
- `components/ui/skeleton-card.tsx`: Skeleton loading pattern available

### Established Patterns
- `expo-sqlite` v2 API (`useSQLiteContext`) — session persistence table follows the same pattern
- Expo Router file-based routing — cooking step view as a new route (e.g., `app/recipe/cook/[id].tsx`)
- `PRAGMA user_version` migration — new `cooking_sessions` table added in next DB_VERSION bump
- Immediate-save UX (Phase 2 pattern) — ingredient checkboxes save state immediately, no confirm

### Integration Points
- Recipe detail screen (`app/recipe/[id].tsx`) → replaced with cooking preview
- Feed screen (`app/(tabs)/index.tsx`) → shows resume banner when active session exists
- `getRecipeById` → provides full recipe data including steps for both preview and cooking view
- DB migration in `src/db/client.ts` → add `cooking_sessions` table

</code_context>

<deferred>
## Deferred Ideas

- **Ask Chef AI chat** (AICOOK-01, AICOOK-02) — button placed in v1 with "coming soon" state; full AI chat is v2 milestone
- **Ingredient swap** (AIPER-03) — "Değiştir" button placed per ingredient in v1; AI-powered or predetermined swap logic is v2
- **Step-level images** — pastel placeholders in v1; real step photos added when content pipeline supports them
- **Multiple concurrent timers** — v1 supports one timer at a time; multi-timer could be a future enhancement

</deferred>

---

*Phase: 05-guided-cooking-mode*
*Context gathered: 2026-03-13*
