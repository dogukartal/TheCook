# Feature: Cooking Mode & Sef'im

## What This Feature Is

Cooking Mode is the full-screen, step-by-step experience Yagiz enters when he taps Start Cooking. It guides him through every step, one action at a time, and hands him off to the celebration screen when he finishes. Sef'im is the AI companion who lives inside every step.

## Why It Exists

Every alternative — TikTok, YouTube, ChatGPT, recipe websites — disappears the moment cooking starts. Cooking Mode is the core differentiator. Discovery brings Yagiz to the recipe. Cooking Mode makes him finish it.

Two things cause abandonment: not knowing if he is on track, and hitting an unexpected problem with no one to ask. The step screen solves the first. Sef'im solves the second.

## Entry

Taps Start Cooking on Recipe Detail. Arrives with all adjustments applied (serving size, swaps). No configuration inside Cooking Mode.

Global nav bar disappears entirely. Only exit: explicit exit button → confirmation modal.

## The Step Screen

Each step communicates exactly one action. Four elements, always in same order, always fully visible:

**Step image** — AI-generated process shot showing what is happening at this step. Not a beauty photo — a visual reference. Pre-generated at recipe creation, stored in DB. Fallback: warm food-adjacent colour block.

**The action** — what to do right now. Short, direct, like a friend telling him. Time references as plain text in body copy. Max 3–4 lines.

**Boyle gorunmeli** — what Yagiz should see/smell/feel before moving on. Written as confirmation after action completes. Hard limit: one line.

**Dikkat et!** — most common thing that goes wrong at this step and what to do. Specific to this step of this recipe. Hard limit: one line.

## Navigation

Forward and back between steps always available. Progress indicator shows position. Exit triggers confirmation modal.

## Completion

"Pisirmeyi Bitirdim" on final step → celebration screen → post-meal rating screen. Logs to Gecmis automatically. Partial cooks not logged.

## Sef'im

### Who He Is

The Cook's AI companion. Named after MasterChef Turkey reference — contestants call real chefs "sefim" (my chef). Turkish Gen-Z immediately understands. Signals: knows more than me, on my side.

### Personality

Warm, slightly humorous. Like a supportive MasterChef judge — calm expertise, hint of warmth, never condescension. Knows the recipe, the step, Yagiz's skill level. Never needs to be caught up.

### The Pulse

When Yagiz lingers on a step longer than average without progressing, Sef'im pulses gently. Not an alert — a quiet signal: I am here if you need me.

### How It Works

Tapping Sef'im opens bottom sheet over step screen. Step screen remains partially visible, dimmed.

Sheet shows current context (recipe name + step) — Sef'im already knows where he is.

Three pre-loaded question chips: most likely questions for this exact step of this exact recipe. Not generic. Tapping returns instant answer (no AI call — pre-written, stored at recipe creation).

Open text field and microphone for anything chips don't cover. Both trigger live AI call. Answer appears as chat bubble — conversational, plain Turkish, minimal words.

Sheet stays open after each answer. Follow-ups without reopening. Swipe down returns to step.

### What Sef'im Knows

Full recipe, current step, skill level, any ingredient swaps. Context assembled at runtime for live AI calls.

## Data Requirements

### Recipe Data Structure for Cooking Mode

| Field | Detail |
|-------|--------|
| Step image | AI-generated, stored in DB. Fallback colour block for unavailable. |
| Action copy | Max 3–4 lines. Plain Turkish, active voice. Time as plain text. |
| Boyle gorunmeli | Max one line. Confirmation, not preview. |
| Dikkat et! | Max one line. Specific to this step. |
| Pre-loaded Sef'im chips | 3 Q&A pairs per step. Pre-written. |
| Average step duration | For Sef'im pulse timing. Per step at creation. |

### Dynamic Variables

Ingredient names and quantities in step copy are dynamic variables, not hardcoded. Resolve to active state (original or substituted, default or scaled) at cook start. Shared infrastructure with serving scaler and substitution.

### Sef'im Live AI

Pre-loaded chips: instant, no AI call. Open text/voice: live AI call. Prompt includes full recipe, current step, skill level, active swaps — assembled at runtime.

### Session State

Active recipe state for session duration: current step, serving size, ingredient swaps. Exit and re-entry behaviour TBD (see edge cases).

### Completion

"Pisirmeyi Bitirdim" writes completion to Gecmis. If write fails, retry silently before navigating.

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| Step image fails to load | Fallback colour block. Never empty space or broken icon. |
| Exits mid-recipe | Confirmation modal. If confirmed, session ends. Partial not logged to Gecmis. |
| Back on first step | Back unavailable on step 1. |
| Sef'im AI call fails | Error in sheet: "Su an yanit veremiyorum, tekrar dene." Sheet stays open. |
| Off-topic question to Sef'im | Redirects conversationally back to recipe. |
