# Phase 15: Card Image Rendering - Research

**Researched:** 2026-03-19
**Domain:** Runtime image rendering with expo-image, blurhash placeholders, gradient fallbacks in React Native / Expo
**Confidence:** HIGH

## Summary

Phase 15 wires the image registry built in Phase 13 into the UI layer. The registry (`app/assets/image-registry.ts`) already maps 30 recipe IDs to `require()` calls for cover and step images, returning `null` where no image exists. Currently only menemen has a cover image (81KB WebP). The task is to replace the existing `LinearGradient` placeholders in recipe cards and the `Image` / pastel placeholder in cooking step-content with `expo-image` components that read from the registry, display blurhash placeholders during load, and fall back to category gradients when no image exists.

The codebase has four surfaces that need image integration: (1) `RecipeCardGrid` used in feed sections, search results, and cookbook; (2) `RecipeCardRow` used in search recent views; (3) Recipe detail hero at the top of `app/recipe/[id].tsx`; (4) `StepContent` component in cooking mode at `components/cooking/step-content.tsx`. All four currently use either `LinearGradient` (cards, hero) or RN `Image` with pastel fallback (step-content) and need to be updated to use `expo-image` with the registry as the image source.

The `expo-image` package (v3.0.11, already installed) natively supports blurhash placeholders via its `placeholder` prop. Blurhash strings must be pre-computed at build time and stored in the image registry. The `blurhash` npm package provides a pure-JS `encode()` function that works with sharp's raw pixel output. The build script (`scripts/build-images.ts`) needs a small addition to compute and include blurhash strings alongside each image entry in the registry.

**Primary recommendation:** Add a `blurhash` field to the registry's `RecipeImages` interface, generate blurhash strings in `build-images.ts` using `sharp` + `blurhash` npm package, then replace RN `Image` / `LinearGradient` image areas with `expo-image` `<Image>` components that use the registry source, blurhash placeholder, and category-gradient fallback when source is null.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| IMG-01 | User sees cover image on every recipe card across feed, search, and cookbook | Registry `getRecipeImages(id).cover` provides the source; `RecipeCardGrid` and `RecipeCardRow` updated to render `expo-image` with gradient fallback when null |
| IMG-02 | User sees step-specific image during cooking mode for each step | Registry `getRecipeImages(id).steps[idx]` provides per-step source; `StepContent` updated from RN `Image` to `expo-image` with blurhash placeholder and pastel fallback |
| IMG-03 | User sees smooth blurhash placeholder while images load | Blurhash strings pre-computed at build time by `build-images.ts`, stored in registry, passed to `expo-image` `placeholder={{ blurhash }}` prop with cross-dissolve transition |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-image | ~3.0.11 | Runtime image rendering with caching, blurhash, transitions | Already installed; replaces RN `Image`; native blurhash decoding; disk+memory cache; `contentFit` API |
| blurhash | ^2.0.5 | Build-time blurhash string generation from pixel data | Official woltapp/blurhash TypeScript encoder; pure JS; works with sharp raw pixel output |
| sharp | ^0.34.5 | Extract raw pixel data for blurhash encoding (already devDep) | Already installed as devDependency; `.raw().ensureAlpha()` provides Uint8ClampedArray for blurhash |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-linear-gradient | ~15.0.8 | Category gradient fallback when no image exists | Already installed; keep as fallback layer behind/instead of image |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| blurhash (build-time) | expo-image `generateBlurhashAsync` (runtime) | Runtime generation would run on every app launch, blocking render; build-time is strictly better for bundled assets |
| blurhash | thumbhash | ThumbHash preserves color better but is less widely adopted; expo-image supports both; blurhash is sufficient for ~20x20 placeholders |

**Installation:**
```bash
npm install --save-dev blurhash
```

Note: `blurhash` is a devDependency since it is only used at build time in `scripts/build-images.ts`. The encoded blurhash _strings_ are embedded in the registry file and consumed by expo-image's native decoder at runtime.

## Architecture Patterns

### Recommended Project Structure
```
app/
  assets/
    image-registry.ts         # Updated: adds blurhash fields to RecipeImages
    images/
      menemen-cover.webp      # Existing optimized image
components/
  ui/
    recipe-card-grid.tsx      # Updated: expo-image + gradient fallback
    recipe-card-row.tsx       # Updated: expo-image + gradient fallback
    recipe-image.tsx          # NEW: shared RecipeImage component (optional)
  cooking/
    step-content.tsx          # Updated: expo-image + blurhash + pastel fallback
scripts/
  build-images.ts             # Updated: generate blurhash string per image
```

### Pattern 1: Registry-Driven Image Component
**What:** A component that takes a recipe ID and renders the cover image from the registry with automatic fallback
**When to use:** In every card and detail surface
**Example:**
```typescript
// Source: expo-image docs + project image-registry.ts
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { getRecipeImages } from '@/app/assets/image-registry';
import { CATEGORY_GRADIENTS, DEFAULT_GRADIENT } from '@/constants/palette';
import type { Category } from '@/src/types/recipe';

interface RecipeCoverProps {
  recipeId: string;
  category: Category;
  style?: any;
}

function RecipeCover({ recipeId, category, style }: RecipeCoverProps) {
  const images = getRecipeImages(recipeId);
  const gradient = CATEGORY_GRADIENTS[category] ?? DEFAULT_GRADIENT;

  if (!images.cover) {
    return <LinearGradient colors={gradient} style={style} />;
  }

  return (
    <Image
      source={images.cover}
      placeholder={images.coverBlurhash ? { blurhash: images.coverBlurhash } : undefined}
      contentFit="cover"
      transition={200}
      style={style}
    />
  );
}
```

### Pattern 2: Registry Schema Extension for Blurhash
**What:** Extend the `RecipeImages` interface to include blurhash strings alongside image sources
**When to use:** Always -- the registry is the single source of truth for all image data
**Example:**
```typescript
// Updated image-registry.ts structure
export interface RecipeImages {
  cover: ImageSource | null;
  coverBlurhash: string | null;
  steps: (ImageSource | null)[];
  stepBlurhashes: (string | null)[];
}

const registry: Record<string, RecipeImages> = {
  "menemen": {
    cover: require("./images/menemen-cover.webp"),
    coverBlurhash: "|rF?hV%2WCj[ayj[a...",
    steps: [null, null, null, null, null],
    stepBlurhashes: [null, null, null, null, null],
  },
  // ...
};
```

### Pattern 3: Gradient Scrim Overlay on Images
**What:** A semi-transparent gradient overlay on top of cover images to ensure text readability
**When to use:** On RecipeCardGrid (title overlay at bottom) and recipe detail hero (title at bottom)
**Example:**
```typescript
// Gradient scrim for text on image
<View style={styles.imageArea}>
  <Image source={images.cover} contentFit="cover" style={StyleSheet.absoluteFill} />
  <LinearGradient
    colors={['transparent', 'rgba(0,0,0,0.6)']}
    style={styles.scrimGradient}
  />
  <Text style={styles.titleOverlay}>{recipe.title}</Text>
</View>
```

### Pattern 4: expo-image Transition for Smooth Load
**What:** Use the `transition` prop to cross-dissolve from blurhash placeholder to actual image
**When to use:** On all expo-image instances
**Example:**
```typescript
<Image
  source={imageSource}
  placeholder={blurhash ? { blurhash } : undefined}
  contentFit="cover"
  transition={200}  // 200ms cross-dissolve
  cachePolicy="disk"
  style={styles.image}
/>
```

### Anti-Patterns to Avoid
- **Using RN `Image` instead of `expo-image`:** RN Image does not support blurhash placeholders. All image rendering MUST use `expo-image` `Image` component for IMG-03 compliance.
- **Generating blurhash at runtime:** Never compute blurhash strings in the app. The build script pre-computes them. Runtime generation blocks the main thread.
- **Removing LinearGradient entirely:** Keep gradients as the fallback for recipes without images (29 of 30 currently have null covers). The gradient IS the graceful fallback.
- **Hardcoding gradient colors in card components:** Use `CATEGORY_GRADIENTS` from `palette.ts` (already the pattern). Phase 14 established these as palette-exempt decorative colors.
- **Setting transition too high:** More than 300ms feels sluggish for local assets. 150-200ms is ideal.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Blurhash encoding | Custom pixel averaging / color extraction | `blurhash` npm `encode()` + sharp `.raw().ensureAlpha()` | Standard algorithm, compact 20-30 char strings, native decoding in expo-image |
| Image caching | Custom file cache or state management | `expo-image` built-in `cachePolicy="disk"` | Handles disk + memory cache, LRU eviction, cross-session persistence |
| Fade-in animation | Custom `Animated.Value` opacity transition | `expo-image` `transition={200}` prop | Native-level transition, handles placeholder-to-image crossfade |
| Image scaling / cropping | Manual `resizeMode` calculations | `expo-image` `contentFit="cover"` | CSS object-fit semantics, handles all aspect ratios correctly |
| Per-image placeholder color | Extract dominant color manually | Blurhash (already represents color) | Blurhash encodes spatial color distribution in ~25 characters |

**Key insight:** expo-image already handles the hard parts (caching, transitions, placeholder rendering, memory management). The work is wiring the registry to components and generating blurhash strings at build time.

## Common Pitfalls

### Pitfall 1: Importing from wrong Image
**What goes wrong:** Using `import { Image } from 'react-native'` instead of `import { Image } from 'expo-image'`. RN Image does not support blurhash placeholders.
**Why it happens:** `Image` is a common import name and IDE may auto-import from react-native.
**How to avoid:** Use explicit `import { Image } from 'expo-image'` in every file that renders images. Remove unused `Image` imports from react-native.
**Warning signs:** No blurhash visible during load, `placeholder` prop has no effect.

### Pitfall 2: Blurhash placeholder sizing mismatch
**What goes wrong:** Blurhash placeholder renders at wrong aspect ratio, causing layout shift when actual image loads.
**Why it happens:** expo-image treats blurhash as square by default. The `placeholderContentFit` defaults to `'scale-down'` while `contentFit` defaults differently.
**How to avoid:** Set `placeholderContentFit="cover"` alongside `contentFit="cover"` on every Image. This ensures both placeholder and image fill the container identically.
**Warning signs:** Blurhash appears as a small centered square instead of filling the image area.

### Pitfall 3: Text readability on real images
**What goes wrong:** White text (title overlay, bookmark icon) becomes unreadable on light-colored food photos.
**Why it happens:** Gradient overlays that worked on solid-color LinearGradient backgrounds may not provide enough contrast on varied photographs.
**How to avoid:** Add a bottom-to-top dark gradient scrim (`transparent` to `rgba(0,0,0,0.5-0.6)`) over the image area behind any overlay text. This is standard practice (Instagram, YouTube thumbnails, etc.).
**Warning signs:** Text disappears on light-colored dishes like rice, cream-based desserts.

### Pitfall 4: Missing recipe ID mapping between list item and registry
**What goes wrong:** RecipeListItem has `id` but no way to pass it to the image registry lookup.
**Why it happens:** The card components currently receive a `RecipeListItem` which includes `id` -- this is already sufficient. But the card does not currently call `getRecipeImages`.
**How to avoid:** Add `getRecipeImages(recipe.id)` call in the card component. The `RecipeListItem.id` exactly matches the registry keys.
**Warning signs:** All cards show gradient fallback even though images exist.

### Pitfall 5: Forgetting to update step-content from RN Image to expo-image
**What goes wrong:** Step content currently uses `import { Image } from 'react-native'` with `source={{ uri: step.stepImage }}`. This will not display registry images (which are `require()` numbers, not URIs) and won't show blurhash.
**Why it happens:** The step-content component was built before the image registry existed.
**How to avoid:** Step-content must switch to expo-image AND use the registry's step images instead of `step.stepImage` string field. The registry step images are `number | null`, not URI strings.
**Warning signs:** Step images show nothing or crash when registry returns a number instead of a URI string.

### Pitfall 6: Regenerating registry without blurhash after adding images
**What goes wrong:** Running `build-images.ts` without the blurhash generation code produces a registry without blurhash fields, breaking the interface contract.
**Why it happens:** Build script must be updated BEFORE any new images are processed.
**How to avoid:** Update `build-images.ts` first (add blurhash generation), then run it. Order matters.
**Warning signs:** TypeScript errors about missing `coverBlurhash` / `stepBlurhashes` properties.

## Code Examples

### Build Script: Blurhash Generation Addition
```typescript
// Addition to scripts/build-images.ts
// Source: woltapp/blurhash TypeScript encoder + sharp raw API
import { encode } from 'blurhash';

async function generateBlurhash(imagePath: string): Promise<string> {
  const { data, info } = await sharp(imagePath)
    .raw()
    .ensureAlpha()
    .resize(32, 32, { fit: 'inside' })  // Small size = fast encode
    .toBuffer({ resolveWithObject: true });

  return encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    4,  // componentX
    3,  // componentY
  );
}
```

### Updated Registry Interface
```typescript
// app/assets/image-registry.ts (auto-generated)
export interface RecipeImages {
  cover: ImageSource | null;
  coverBlurhash: string | null;
  steps: (ImageSource | null)[];
  stepBlurhashes: (string | null)[];
}

// Example entry with blurhash
"menemen": {
  cover: require("./images/menemen-cover.webp"),
  coverBlurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH",
  steps: [null, null, null, null, null],
  stepBlurhashes: [null, null, null, null, null],
},
```

### RecipeCardGrid with Image
```typescript
// Source: expo-image docs, existing component pattern
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { getRecipeImages } from '@/app/assets/image-registry';

// Inside RecipeCardGrid component:
const images = getRecipeImages(recipe.id);

// In the imageArea View:
{images.cover ? (
  <>
    <Image
      source={images.cover}
      placeholder={images.coverBlurhash ? { blurhash: images.coverBlurhash } : undefined}
      placeholderContentFit="cover"
      contentFit="cover"
      transition={200}
      style={StyleSheet.absoluteFill}
    />
    {/* Dark scrim for text readability */}
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.55)']}
      style={[StyleSheet.absoluteFill, { top: '50%' }]}
    />
  </>
) : (
  <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
)}
```

### Recipe Detail Hero with Image
```typescript
// In app/recipe/[id].tsx hero section:
import { Image } from 'expo-image';
import { getRecipeImages } from '@/app/assets/image-registry';

const images = getRecipeImages(id as string);

// Replace heroContainer content:
<View style={styles.heroContainer}>
  {images.cover ? (
    <>
      <Image
        source={images.cover}
        placeholder={images.coverBlurhash ? { blurhash: images.coverBlurhash } : undefined}
        placeholderContentFit="cover"
        contentFit="cover"
        transition={200}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)']}
        style={StyleSheet.absoluteFill}
      />
    </>
  ) : (
    <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
  )}
  {/* Back button, bookmark button, title overlay remain unchanged */}
</View>
```

### StepContent with Registry Image
```typescript
// In components/cooking/step-content.tsx:
import { Image } from 'expo-image';
import { getRecipeImages } from '@/app/assets/image-registry';

// StepContent needs recipeId prop added:
interface StepContentProps {
  recipeId: string;  // NEW
  step: RecipeStep;
  stepIndex: number;
  // ... existing props
}

// In render:
const images = getRecipeImages(recipeId);
const stepImage = images.steps[stepIndex] ?? null;
const stepBlurhash = images.stepBlurhashes[stepIndex] ?? null;

// Image area:
{stepImage ? (
  <Image
    source={stepImage}
    placeholder={stepBlurhash ? { blurhash: stepBlurhash } : undefined}
    placeholderContentFit="cover"
    contentFit="cover"
    transition={200}
    style={styles.stepImage}
    testID="step-image"
  />
) : (
  <View style={[styles.imagePlaceholder, { backgroundColor: bgColor }]} />
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| RN `<Image>` with `source={{ uri }}` | `expo-image` with `source={require()}` | Expo SDK 49+ (2023) | Native caching, blurhash, transitions built-in |
| Solid color placeholder during load | Blurhash / ThumbHash placeholder | 2019+ (blurhash), expo-image SDK 49+ | Perceived performance -- user sees approximate image shape/color instantly |
| No image overlay for text readability | Gradient scrim overlay | Standard practice | Text remains readable on varied photo backgrounds |
| Step images via URL string field | Step images via static registry `require()` | Phase 13 (2026-03-19) | Offline-first, no network dependency |

**Deprecated/outdated:**
- `react-native-fast-image`: Superseded by `expo-image` for Expo projects
- `step.stepImage` string field: The YAML field still exists but actual rendering should use the registry (registry is source of truth for bundled assets; YAML field is for future cloud-hosted images)

## Open Questions

1. **Should RecipeCardRow show images?**
   - What we know: RecipeCardRow is used in search "Son Goruntuleneler" (recent views). It has an 80x80 thumbnail area currently showing a gradient.
   - What's unclear: Whether 80x80 is too small for food photos to look good.
   - Recommendation: Yes, show the cover image in the thumbnail. 80x80 is standard for list rows (Instagram, Spotify). Use `contentFit="cover"` and the same fallback pattern. If it looks bad at 80x80, the image quality is the issue, not the size.

2. **Should the registry `getRecipeImages` return type include blurhash?**
   - What we know: The current interface has `cover: ImageSource | null` and `steps: (ImageSource | null)[]`.
   - What's unclear: Whether to add blurhash as separate fields or nest them.
   - Recommendation: Add flat fields (`coverBlurhash: string | null`, `stepBlurhashes: (string | null)[]`). Flat is simpler than nesting and matches the existing flat pattern. The build script generates both.

3. **What happens for the 29 recipes without images?**
   - What we know: Only menemen has a cover image. All others return `{ cover: null, steps: [...null] }`.
   - What's unclear: Nothing -- the fallback pattern is clear.
   - Recommendation: When `cover` is null, render the existing `LinearGradient` with `CATEGORY_GRADIENTS`. This is already the current behavior. No change needed for null cases.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | jest 29.7.0 (jest-expo preset) |
| Config file | package.json `"jest"` section |
| Quick run command | `npx jest --testPathPattern="(recipe-card\|step-content\|image)" -x` |
| Full suite command | `npx jest` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IMG-01a | RecipeCardGrid renders expo-image when cover exists | unit | `npx jest __tests__/recipe-card-grid.test.ts -x` | No -- Wave 0 |
| IMG-01b | RecipeCardGrid renders gradient fallback when cover is null | unit | `npx jest __tests__/recipe-card-grid.test.ts -x` | No -- Wave 0 |
| IMG-01c | RecipeCardRow renders expo-image when cover exists | unit | `npx jest __tests__/recipe-card-row.test.ts -x` | No -- Wave 0 |
| IMG-02a | StepContent renders expo-image when step image exists | unit | `npx jest __tests__/step-content.test.ts -x` | Yes (update needed) |
| IMG-02b | StepContent renders pastel fallback when step image is null | unit | `npx jest __tests__/step-content.test.ts -x` | Yes (already passes) |
| IMG-03a | Build script generates blurhash strings in registry | unit | `npx jest __tests__/image-registry.test.ts -x` | Yes (update needed) |
| IMG-03b | expo-image receives placeholder prop with blurhash | unit | `npx jest __tests__/recipe-card-grid.test.ts -x` | No -- Wave 0 |
| IMG-hero | Recipe detail hero renders cover image or gradient | unit | `npx jest __tests__/recipe-detail.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="(recipe-card|step-content|image)" -x`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/recipe-card-grid.test.ts` -- covers IMG-01a, IMG-01b, IMG-03b (card image rendering + blurhash)
- [ ] `__tests__/recipe-card-row.test.ts` -- covers IMG-01c (row thumbnail image)
- [ ] `__tests__/recipe-detail.test.ts` -- covers IMG-hero (hero image rendering)
- [ ] Update `__tests__/step-content.test.ts` -- update to test registry-based images (IMG-02a)
- [ ] Update `__tests__/image-registry.test.ts` -- add blurhash field assertions (IMG-03a)
- [ ] Mock for expo-image in jest setup (expo-image needs a mock since it has native code)
- [ ] Framework install: `npm install --save-dev blurhash` -- blurhash encoder not yet installed

## Sources

### Primary (HIGH confidence)
- [Expo Image SDK documentation](https://docs.expo.dev/versions/latest/sdk/image/) -- placeholder prop, contentFit, transition, cachePolicy, generateBlurhashAsync, source types
- [woltapp/blurhash TypeScript](https://github.com/woltapp/blurhash/tree/master/TypeScript) -- encode function signature: `encode(pixels: Uint8ClampedArray, width, height, componentX, componentY) => string`
- Project codebase: `app/assets/image-registry.ts` -- current registry structure, `getRecipeImages()` API
- Project codebase: `scripts/build-images.ts` -- current build pipeline, sharp usage pattern
- Project codebase: `components/ui/recipe-card-grid.tsx`, `recipe-card-row.tsx` -- current gradient-only rendering
- Project codebase: `components/cooking/step-content.tsx` -- current RN Image + pastel fallback

### Secondary (MEDIUM confidence)
- [WebP + BlurHash with Sharp in Node.js (DEV Community)](https://dev.to/kieronjmckenna/webp-image-optimisation-blurhash-with-sharp-in-nodejs-f8f) -- sharp `.raw().ensureAlpha()` + blurhash encode pattern
- [Expo Assets documentation](https://docs.expo.dev/develop/user-interface/assets/) -- static asset bundling, assetBundlePatterns

### Tertiary (LOW confidence)
- None -- all findings verified against official docs and project codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- expo-image already installed (v3.0.11), blurhash is the standard placeholder library (2.0.5), sharp already a devDep
- Architecture: HIGH -- registry pattern established in Phase 13, components are well-understood, straightforward prop wiring
- Pitfalls: HIGH -- blurhash sizing issue is documented in expo/expo GitHub issues; text readability on images is standard UX knowledge; RN Image vs expo-image import confusion is common
- Build pipeline: HIGH -- existing build-images.ts is a proven template; adding blurhash generation is ~15 lines of code

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable domain; expo-image and blurhash APIs are mature)
