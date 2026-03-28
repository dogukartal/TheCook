// Recipe types matching the mobile app's Zod schema

export const UNITS = ['gr', 'ml', 'adet', 'yemek kaşığı', 'tatlı kaşığı', 'su bardağı', 'demet', 'dilim', 'tutam'] as const;
export type Unit = (typeof UNITS)[number];

export const ALLERGENS = ['gluten', 'dairy', 'egg', 'nuts', 'peanuts', 'shellfish', 'fish', 'soy', 'sesame', 'mustard', 'celery', 'lupin', 'molluscs', 'sulphites'] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const EQUIPMENT = ['fırın', 'blender', 'döküm tava', 'stand mixer', 'wok', 'su ısıtıcı', 'çırpıcı', 'tencere', 'tava', 'mikser', 'rende', 'bıçak seti', 'kesme tahtası'] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const CATEGORIES = ['ana yemek', 'kahvaltı', 'çorba', 'tatlı', 'salata', 'aperatif'] as const;
export type Category = (typeof CATEGORIES)[number];

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export interface SefimQA {
  question: string;
  answer: string;
}

export interface Substitution {
  name: string;
  amount: number;
  unit: Unit;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: Unit;
  optional: boolean;
  alternatives: Substitution[];
  scalable: boolean;
}

export interface IngredientGroup {
  label: string | null;
  items: Ingredient[];
}

export interface RecipeStep {
  title: string;
  instruction: string;
  why: string;
  looksLikeWhenDone: string;
  commonMistake: string;
  recovery: string;
  stepImage: string | null;
  timerSeconds: number | null;
  checkpoint: string | null;
  warning: string | null;
  sefimQA: SefimQA[];
}

export interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  category: Category;
  mealType: MealType;
  skillLevel: SkillLevel;
  prepTime: number;
  cookTime: number;
  servings: number;
  coverImage: string | null;
  allergens: Allergen[];
  equipment: Equipment[];
  ingredientGroups: IngredientGroup[];
  steps: RecipeStep[];
}

// Database row format (JSON fields are strings)
export interface RecipeRow {
  id: string;
  title: string;
  cuisine: string;
  category: string;
  meal_type: string;
  skill_level: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  cover_image: string | null;
  allergens: string; // JSON
  equipment: string; // JSON
  ingredient_groups: string; // JSON
  steps: string; // JSON
}

export interface RawRecipe {
  id: number;
  title: string;
  rating: number;
  votes: number;
  transformed_recipe_id: string | null;
  ingredients_raw: string;
  instructions_raw: string;
}

function safeParse(val: any, fallback: any = []): any {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return val ?? fallback;
}

export function rowToRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    cuisine: row.cuisine,
    category: row.category as Category,
    mealType: row.meal_type as MealType,
    skillLevel: row.skill_level as SkillLevel,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    servings: row.servings,
    coverImage: row.cover_image,
    allergens: safeParse(row.allergens),
    equipment: safeParse(row.equipment),
    ingredientGroups: safeParse(row.ingredient_groups),
    steps: safeParse(row.steps),
  };
}

export function recipeToRow(recipe: Recipe): RecipeRow {
  return {
    id: recipe.id,
    title: recipe.title,
    cuisine: recipe.cuisine,
    category: recipe.category,
    meal_type: recipe.mealType,
    skill_level: recipe.skillLevel,
    prep_time: recipe.prepTime,
    cook_time: recipe.cookTime,
    servings: recipe.servings,
    cover_image: recipe.coverImage,
    allergens: JSON.stringify(recipe.allergens),
    equipment: JSON.stringify(recipe.equipment),
    ingredient_groups: JSON.stringify(recipe.ingredientGroups),
    steps: JSON.stringify(recipe.steps),
  };
}

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle',
  dinner: 'Akşam',
  snack: 'Atıştırmalık',
};

export const SKILL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};
