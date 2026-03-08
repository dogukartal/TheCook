import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums — locked values per CONTEXT.md decisions
// ---------------------------------------------------------------------------

export const UnitEnum = z.enum([
  "gr",
  "ml",
  "adet",
  "yemek kaşığı",
  "tatlı kaşığı",
  "su bardağı",
  "demet",
  "dilim",
  "tutam",
]);

export const AllergenTagEnum = z.enum([
  "gluten",
  "dairy",
  "egg",
  "nuts",
  "peanuts",
  "shellfish",
  "fish",
  "soy",
  "sesame",
  "mustard",
  "celery",
  "lupin",
  "molluscs",
  "sulphites",
]);

export const EquipmentEnum = z.enum([
  // Core locked values from CONTEXT.md (must match Phase 2 user profile)
  "fırın",
  "blender",
  "döküm tava",
  "stand mixer",
  "wok",
  "su ısıtıcı",
  // Additional common kitchen equipment
  "çırpıcı",
  "tencere",
  "tava",
  "mikser",
  "rende",
  "bıçak seti",
  "kesme tahtası",
]);

export const CategoryEnum = z.enum([
  "ana yemek",
  "kahvaltı",
  "çorba",
  "tatlı",
  "salata",
  "aperatif",
]);

export const MealTypeEnum = z.enum([
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

export const SkillLevelEnum = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

// ---------------------------------------------------------------------------
// Ingredient schemas
// ---------------------------------------------------------------------------

export const IngredientSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  unit: UnitEnum,
  optional: z.boolean().default(false),
});

export const IngredientGroupSchema = z.object({
  label: z.string().nullable(),
  items: z.array(IngredientSchema).min(1),
});

// ---------------------------------------------------------------------------
// Step schema — all 5 CONT-02 required fields locked
// ---------------------------------------------------------------------------

export const StepSchema = z.object({
  instruction: z.string().min(1),
  why: z.string().min(1),
  looksLikeWhenDone: z.string().min(1),
  commonMistake: z.string().min(1),
  recovery: z.string().min(1),
  stepImage: z.string().nullable().default(null),
  // positive() ensures non-zero timers; null means no timer (Hira can leave null; Phase 5 uses it)
  timerSeconds: z.number().int().positive().nullable().default(null),
});

// ---------------------------------------------------------------------------
// Recipe schema — single source of truth
// NOTE: totalTime is NOT stored — computed at runtime as prepTime + cookTime
// ---------------------------------------------------------------------------

export const RecipeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  cuisine: z.string().min(1),
  category: CategoryEnum,
  mealType: MealTypeEnum,
  skillLevel: SkillLevelEnum,
  prepTime: z.number().int().positive(),
  cookTime: z.number().int().positive(),
  servings: z.number().int().positive(),
  coverImage: z.string().nullable().default(null),
  allergens: z.array(AllergenTagEnum),
  equipment: z.array(EquipmentEnum),
  // ingredientGroups is mandatory — flat ingredients[] is rejected
  ingredientGroups: z.array(IngredientGroupSchema).min(1),
  steps: z.array(StepSchema).min(1),
});

// ---------------------------------------------------------------------------
// TypeScript types inferred from Zod schemas — no separate interface needed
// ---------------------------------------------------------------------------

export type Recipe = z.infer<typeof RecipeSchema>;
export type RecipeStep = z.infer<typeof StepSchema>;
export type Ingredient = z.infer<typeof IngredientSchema>;
export type IngredientGroup = z.infer<typeof IngredientGroupSchema>;
export type Unit = z.infer<typeof UnitEnum>;
export type AllergenTag = z.infer<typeof AllergenTagEnum>;
export type Equipment = z.infer<typeof EquipmentEnum>;
export type Category = z.infer<typeof CategoryEnum>;
export type MealType = z.infer<typeof MealTypeEnum>;
export type SkillLevel = z.infer<typeof SkillLevelEnum>;
