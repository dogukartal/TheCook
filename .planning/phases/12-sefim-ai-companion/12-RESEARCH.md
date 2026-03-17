# Phase 12: Sef'im (AI Companion) - Research

**Researched:** 2026-03-17
**Domain:** AI chat companion in cooking mode, pre-loaded Q&A, live AI fallback, voice input, contextual awareness
**Confidence:** MEDIUM

## Summary

Phase 12 builds the Sef'im AI companion that lives inside cooking mode. The feature has two tiers: (1) pre-loaded Q&A chips stored per step at recipe creation time (instant, no network), and (2) live AI calls for open-text/voice questions routed through a Supabase Edge Function to an LLM. The companion must be context-aware (recipe, current step, skill level, ingredient swaps) and must redirect off-topic questions back to the recipe.

The project already has a Supabase client configured (`src/auth/supabase.ts`) and uses `react-native-reanimated ~4.1.1` for animations. The IngredientsSheet component establishes a Modal-based "bottom sheet" pattern that Sef'im should follow -- @gorhom/bottom-sheet has known incompatibilities with Reanimated v4 and should be avoided. Voice input requires the `expo-speech-recognition` library (Expo config plugin). The pulse animation for linger detection uses Reanimated's `withRepeat` + `withTiming` -- a pattern already proven in this codebase (SkeletonCard shimmer).

**Primary recommendation:** Use a two-layer architecture -- static Q&A chips from recipe schema (zero latency) and a Supabase Edge Function wrapping an LLM API for live questions. Build Sef'im as a Modal-based bottom sheet (matching IngredientsSheet pattern) with a custom hook (`useSefim`) that manages context assembly, message history, and linger detection.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COOKX-04 | Sef'im AI companion available in every cooking step -- 3 pre-loaded Q&A chips (instant) plus open text/voice (live AI call) | Schema extension for `sefimQA` array on StepSchema; Modal bottom sheet component; Supabase Edge Function for live AI; expo-speech-recognition for voice input |
| COOKX-05 | Sef'im is context-aware (recipe, step, skill level, ingredient swaps) and pulses when user lingers beyond average step duration | Context assembly function; Reanimated pulse animation on chef-hat icon; linger timer with step-specific thresholds |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-reanimated | ~4.1.1 | Pulse animation on chef-hat icon | Already in project; `withRepeat` + `withTiming` for pulse |
| @supabase/supabase-js | ^2.99.0 | `supabase.functions.invoke()` for live AI calls | Already in project; Edge Functions are the standard serverless approach |
| expo-speech-recognition | ^2.0.0 | Voice-to-text for open questions | Best Expo-compatible speech recognition; config plugin based |
| react-native (Modal) | 0.81.5 | Bottom sheet UI for Sef'im panel | Existing pattern from IngredientsSheet; avoids @gorhom/bottom-sheet Reanimated v4 incompatibility |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-haptics | ~15.0.8 | Haptic feedback on chip tap | Already in project; use for instant Q&A chip interaction feedback |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Modal-based sheet | @gorhom/bottom-sheet v5 | Known Reanimated v4 compatibility issues (crashes, sheets not opening); Modal is proven in this codebase |
| Supabase Edge Function | Direct OpenAI API call from client | Exposes API key in client bundle; Edge Function keeps secrets server-side via `Deno.env.get()` |
| expo-speech-recognition | react-native-voice | expo-speech-recognition has better Expo integration via config plugin; react-native-voice requires manual native linking |

**Installation:**
```bash
npx expo install @jamsch/expo-speech-recognition
```

Note: `expo-speech-recognition` requires an app.json config plugin entry:
```json
{
  "plugins": [
    [
      "@jamsch/expo-speech-recognition",
      {
        "microphonePermission": "Sef'im'e sesli soru sormak icin mikrofon izni gerekiyor",
        "speechRecognitionPermission": "Sesli soru sormak icin konusma tanima izni gerekiyor"
      }
    ]
  ]
}
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  hooks/
    useSefim.ts               # Core hook: context assembly, message state, linger detection
  types/
    recipe.ts                 # StepSchema extended with sefimQA field
  db/
    sefim.ts                  # (optional) persist chat history per session
components/
  cooking/
    sefim-sheet.tsx           # Modal-based bottom sheet for Sef'im UI
    sefim-chip.tsx            # Pre-loaded Q&A chip component
    sefim-pulse.tsx           # Animated pulse wrapper for chef-hat icon
supabase/
  functions/
    sefim-ask/
      index.ts                # Edge Function: receives context + question, returns AI answer
```

### Pattern 1: Two-Tier Response Architecture
**What:** Pre-loaded Q&A chips return instant answers from schema data; open questions go through Supabase Edge Function to LLM.
**When to use:** Every step interaction with Sef'im.
**Example:**
```typescript
// In useSefim hook
interface SefimQA {
  question: string;  // Turkish question text shown on chip
  answer: string;    // Pre-written answer displayed instantly
}

// StepSchema extension
sefimQA: z.array(z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
})).default([]),

// Chip tap = instant (no network)
function handleChipTap(qa: SefimQA) {
  addMessage({ role: 'user', text: qa.question });
  addMessage({ role: 'assistant', text: qa.answer });
}

// Open question = live AI call
async function handleOpenQuestion(text: string) {
  addMessage({ role: 'user', text });
  const context = buildContext(recipe, currentStep, skillLevel, swaps);
  const { data } = await supabase.functions.invoke('sefim-ask', {
    body: { question: text, context },
  });
  addMessage({ role: 'assistant', text: data.answer });
}
```

### Pattern 2: Context Assembly for AI Calls
**What:** Build a structured context object that gives the LLM everything it needs to answer contextually.
**When to use:** Every live AI call.
**Example:**
```typescript
interface SefimContext {
  recipeName: string;
  totalSteps: number;
  currentStepIndex: number;
  currentStepInstruction: string;
  currentStepWhy: string;
  currentStepCommonMistake: string;
  currentStepRecovery: string;
  userSkillLevel: string;
  ingredientSwaps: Record<string, string>;  // original -> substitute
  servingMultiplier: number;
  checkpoint: string | null;
  warning: string | null;
}

function buildSefimContext(
  recipe: Recipe,
  stepIndex: number,
  skillLevel: string,
  swaps: Record<string, string>,
  servings: number,
): SefimContext {
  const step = recipe.steps[stepIndex];
  return {
    recipeName: recipe.title,
    totalSteps: recipe.steps.length,
    currentStepIndex: stepIndex,
    currentStepInstruction: step.instruction,
    currentStepWhy: step.why,
    currentStepCommonMistake: step.commonMistake,
    currentStepRecovery: step.recovery,
    userSkillLevel: skillLevel,
    ingredientSwaps: swaps,
    servingMultiplier: servings / recipe.servings,
    checkpoint: step.checkpoint,
    warning: step.warning,
  };
}
```

### Pattern 3: Linger Detection with Pulse Animation
**What:** Track time spent on current step; when exceeding threshold, trigger pulse animation on Sef'im icon.
**When to use:** Cooking mode, per step.
**Example:**
```typescript
// In useSefim hook
const [lingerActive, setLingerActive] = useState(false);
const lingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// Average step duration estimate: ~2 minutes for simple steps, timer duration for timed steps
function getLingerThreshold(step: RecipeStep): number {
  if (step.timerSeconds) return step.timerSeconds * 1.5 * 1000; // 1.5x timer
  return 120_000; // 2 minutes default
}

useEffect(() => {
  setLingerActive(false);
  const threshold = getLingerThreshold(currentStep);
  lingerTimerRef.current = setTimeout(() => setLingerActive(true), threshold);
  return () => { if (lingerTimerRef.current) clearTimeout(lingerTimerRef.current); };
}, [currentStepIndex]);

// Pulse animation component
const scale = useSharedValue(1);
useEffect(() => {
  if (lingerActive) {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 400 }),
        withTiming(1.0, { duration: 400 }),
      ),
      -1, // infinite
      false,
    );
  } else {
    scale.value = withTiming(1);
  }
}, [lingerActive]);
```

### Pattern 4: Off-Topic Redirection (System Prompt)
**What:** The Edge Function's system prompt instructs the LLM to redirect off-topic questions.
**When to use:** Every live AI call.
**Example:**
```typescript
// In Edge Function
const systemPrompt = `Sen "Sef'im" adinda bir asci yardimcisisin.
Kullanici su anda "${context.recipeName}" tarifinin ${context.currentStepIndex + 1}. adimini yapiyor.
Sadece bu tarifle ilgili sorulara cevap ver.
Tarifle ilgisi olmayan sorularda kibarca "Bu konuda yardimci olamiyorum ama tarifinle ilgili sorularin varsa buradayim!" de.
Kullanicinin seviyesi: ${context.userSkillLevel}.
Basit ve kisa cevaplar ver, profesyonel ama samimi ol.`;
```

### Anti-Patterns to Avoid
- **Direct LLM API calls from client:** Never embed OpenAI/Anthropic API keys in the React Native bundle. Always proxy through Supabase Edge Function.
- **Streaming for short answers:** For cooking Q&A, responses are typically 1-3 sentences. Non-streaming (await full response) is simpler and sufficient. Streaming adds complexity with SSE parsing in React Native for negligible UX gain.
- **@gorhom/bottom-sheet with Reanimated v4:** Multiple open GitHub issues confirm crashes and non-functioning sheets. Use Modal pattern already established in the codebase.
- **Storing chat history in SQLite:** Chat is ephemeral per cooking session. Use React state only. No DB persistence needed for conversation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Speech-to-text | Custom audio recording + Whisper API | `expo-speech-recognition` | OS-native recognition is faster, works offline, handles Turkish |
| LLM API proxy | Direct API call from client | Supabase Edge Function | API key security; rate limiting; can add logging/analytics later |
| Haptic feedback | Custom vibration patterns | `expo-haptics` (already installed) | Cross-platform, simple API |
| Bottom sheet gestures | Custom pan gesture handler | React Native Modal with slide animation | Already proven in IngredientsSheet; gesture-based sheet has Reanimated v4 issues |

**Key insight:** The pre-loaded Q&A chips are the primary UX -- most users will tap chips, not type/speak. The live AI call is a fallback. Design and effort should weight 70% on the chip experience, 30% on live AI.

## Common Pitfalls

### Pitfall 1: Schema Migration for sefimQA
**What goes wrong:** Adding `sefimQA` to StepSchema without backward compatibility breaks the 30 existing recipes that don't have this field.
**Why it happens:** StepSchema fields without defaults cause Zod parse failures on existing data.
**How to avoid:** Use `.default([])` on the sefimQA field, same pattern as `checkpoint` and `warning` fields from Phase 11.
**Warning signs:** Zod parse errors when loading recipes without sefimQA data.

### Pitfall 2: Supabase Edge Function Cold Start
**What goes wrong:** First AI call takes 3-5 seconds due to Edge Function cold start, making the app feel broken.
**Why it happens:** Supabase Edge Functions spin down after inactivity.
**How to avoid:** Show a typing indicator / loading state immediately on send. Set user expectation that "Sef'im is thinking..." Consider a warm-up ping when cooking mode starts (optional optimization).
**Warning signs:** Users tapping send multiple times thinking it's broken.

### Pitfall 3: Voice Permission Denied Gracefully
**What goes wrong:** App crashes or shows confusing error when microphone permission is denied.
**Why it happens:** `expo-speech-recognition` requires runtime permission check.
**How to avoid:** Check permission before showing mic button. If denied, hide mic button or show "Mikrofon izni gerekli" message. Never crash.
**Warning signs:** App crash on first voice input attempt on fresh install.

### Pitfall 4: Linger Timer Not Reset on Step Change
**What goes wrong:** Pulse animation appears on wrong step because timer from previous step wasn't cleaned up.
**Why it happens:** useEffect cleanup not properly clearing the timeout.
**How to avoid:** Clear timeout in useEffect cleanup; use step index as dependency. Reset `lingerActive` to false on step change.
**Warning signs:** Pulse animation starts immediately on step 3 after lingering on step 2.

### Pitfall 5: Reanimated v4 Animation API Changes
**What goes wrong:** Animation code doesn't compile or behaves unexpectedly.
**Why it happens:** Reanimated v4 changed some APIs from v3.
**How to avoid:** The project already uses Reanimated v4 successfully (SkeletonCard shimmer). Follow the same pattern: `useSharedValue`, `useAnimatedStyle`, `withRepeat`, `withTiming`.
**Warning signs:** TypeScript errors on animation imports.

### Pitfall 6: Context Too Large for LLM
**What goes wrong:** Including full recipe JSON in every AI call wastes tokens and may hit context limits.
**Why it happens:** Naive serialization of entire recipe object.
**How to avoid:** Build minimal context: current step fields, skill level, active swaps, recipe name. Do NOT send all steps, all ingredients, full recipe. The system prompt provides enough context for the current step.
**Warning signs:** Slow responses, high API costs.

### Pitfall 7: SEED_VERSION Bump Forgotten
**What goes wrong:** Users who already have the app don't get updated recipe data with sefimQA fields.
**Why it happens:** Seed version not bumped when recipe content changes.
**How to avoid:** Bump SEED_VERSION in seed.ts when recipes are updated with Q&A data. Same as Phase 11 pattern.
**Warning signs:** sefimQA arrays empty on existing installs.

## Code Examples

### Modal-Based Bottom Sheet (Existing Pattern)
```typescript
// Source: TheCook/components/cooking/ingredients-sheet.tsx (existing project code)
<Modal
  visible={visible}
  transparent
  animationType="slide"
  onRequestClose={onClose}
>
  <View style={styles.overlay}>
    <Pressable style={styles.overlayDismiss} onPress={onClose} />
    <View style={styles.sheetContainer}>
      {/* Content */}
    </View>
  </View>
</Modal>
```

### Supabase Edge Function Invocation
```typescript
// Source: Supabase docs - Edge Function invoke pattern
const { data, error } = await supabase.functions.invoke('sefim-ask', {
  body: {
    question: userQuestion,
    context: sefimContext,
  },
});

if (error) {
  // Show fallback message: "Baglanti sorunu, tekrar dene"
  return;
}
// data.answer contains the LLM response
```

### Supabase Edge Function (Deno)
```typescript
// supabase/functions/sefim-ask/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { question, context } = await req.json();
  const apiKey = Deno.env.get("OPENAI_API_KEY");

  const systemPrompt = `Sen "Sef'im"...`; // See Pattern 4 above

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return new Response(
    JSON.stringify({ answer: data.choices[0].message.content }),
    { headers: { "Content-Type": "application/json" } },
  );
});
```

### Pulse Animation (Reanimated v4)
```typescript
// Pattern consistent with existing SkeletonCard shimmer animation
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

function PulsingChefHat({ active }: { active: boolean }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 500 }),
          withTiming(1.0, { duration: 500 }),
        ),
        -1,
        false,
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 500 }),
          withTiming(1.0, { duration: 500 }),
        ),
        -1,
        false,
      );
    } else {
      scale.value = withTiming(1);
      opacity.value = withTiming(1);
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <MaterialCommunityIcons name="chef-hat" size={24} color="#E07B39" />
    </Animated.View>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @gorhom/bottom-sheet v4 | Modal-based or @gorhom v5.1.8+ | 2025 (Reanimated v4 transition) | v5 still has open issues; Modal is safest for this project |
| Direct OpenAI calls | Supabase Edge Function proxy | Standard practice | API key security; no client-side secrets |
| react-native-voice | expo-speech-recognition | 2024-2025 | Better Expo integration via config plugin |

**Deprecated/outdated:**
- @gorhom/bottom-sheet v4: Not maintained; written for Reanimated v2
- Direct LLM API calls from mobile apps: Security anti-pattern; always proxy through serverless function

## Open Questions

1. **Which LLM provider for live AI?**
   - What we know: Supabase Edge Functions work with any LLM API (OpenAI, Anthropic, Google)
   - What's unclear: User hasn't specified preferred provider; gpt-4o-mini is cost-effective default
   - Recommendation: Default to gpt-4o-mini for cost and speed; make provider swappable in Edge Function

2. **Q&A content for 30 recipes**
   - What we know: Only 3 sample recipes have been updated in recent phases; 27 use defaults
   - What's unclear: Whether Q&A content should be authored for all 30 or just 3 sample recipes initially
   - Recommendation: Author Q&A for the 3 sample recipes first (menemen, mercimek, borek), leave others with empty defaults

3. **Voice input Turkish language support**
   - What we know: expo-speech-recognition uses OS-native speech recognition which supports Turkish on both iOS and Android
   - What's unclear: Quality of Turkish recognition for cooking terminology
   - Recommendation: Implement with Turkish locale; test on device. Fallback to text input is always available.

4. **Edge Function deployment workflow**
   - What we know: Supabase CLI deploys Edge Functions; project already has Supabase configured
   - What's unclear: Whether Supabase project has Edge Functions enabled; local dev/testing strategy
   - Recommendation: Edge Function can be developed and tested locally with `supabase functions serve`; deploy with `supabase functions deploy sefim-ask`

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + jest-expo ~54.0.17 |
| Config file | package.json `jest` section |
| Quick run command | `npx jest --testPathPattern=sefim -x` |
| Full suite command | `npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COOKX-04a | sefimQA schema field parses with defaults | unit | `npx jest --testPathPattern=recipe.test -x` | Existing (extend) |
| COOKX-04b | Chip tap returns pre-written answer (no network) | unit | `npx jest --testPathPattern=sefim -x` | Wave 0 |
| COOKX-04c | Open question invokes supabase.functions.invoke | unit | `npx jest --testPathPattern=sefim -x` | Wave 0 |
| COOKX-05a | buildSefimContext produces correct context object | unit | `npx jest --testPathPattern=sefim -x` | Wave 0 |
| COOKX-05b | Linger detection triggers after threshold | unit | `npx jest --testPathPattern=sefim -x` | Wave 0 |
| COOKX-05c | Off-topic redirect in system prompt | manual-only | N/A | N/A (LLM behavior) |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern=sefim -x`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/__tests__/useSefim.test.ts` -- covers COOKX-04b, COOKX-04c, COOKX-05a, COOKX-05b
- [ ] Schema test extension for sefimQA in existing recipe.test.ts

## Sources

### Primary (HIGH confidence)
- Project codebase: `TheCook/components/cooking/ingredients-sheet.tsx` -- Modal-based bottom sheet pattern
- Project codebase: `TheCook/app/recipe/cook/[id].tsx` -- Cooking mode integration point, existing `handleAskChef` placeholder
- Project codebase: `TheCook/src/auth/supabase.ts` -- Supabase client already configured
- Project codebase: `TheCook/src/types/recipe.ts` -- StepSchema structure for extension

### Secondary (MEDIUM confidence)
- [Supabase Edge Functions docs](https://supabase.com/docs/guides/functions) -- Edge Function deployment and secrets management
- [@gorhom/bottom-sheet GitHub issues](https://github.com/gorhom/react-native-bottom-sheet/issues/2546) -- Reanimated v4 incompatibility confirmed via multiple issues
- [expo-speech-recognition GitHub](https://github.com/jamsch/expo-speech-recognition) -- Expo config plugin for speech recognition
- [Reanimated docs](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/applying-modifiers/) -- withRepeat + withTiming API

### Tertiary (LOW confidence)
- LLM provider choice (gpt-4o-mini) -- reasonable default but user hasn't confirmed provider preference
- Turkish speech recognition quality -- depends on OS version and device; needs device testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries either already in project or well-documented Expo-compatible
- Architecture: HIGH -- follows established project patterns (Modal sheet, hooks, adaptation)
- Schema extension: HIGH -- follows exact same pattern as Phase 11 (nullable defaults)
- Supabase Edge Function: MEDIUM -- standard pattern but untested in this specific project context
- Voice input: MEDIUM -- library is well-maintained but Turkish quality untested
- Pitfalls: HIGH -- based on direct codebase analysis and established patterns

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (30 days -- stable domain, no fast-moving dependencies)
