import { z } from "zod";
import { CategoryEnum, SkillLevelEnum } from "./recipe";

// Lightweight recipe row for list screens (NO steps field — select only display columns)
export const RecipeListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  cuisine: z.string(),
  category: CategoryEnum,
  skillLevel: SkillLevelEnum,
  prepTime: z.number().int(),
  cookTime: z.number().int(),
  coverImage: z.string().nullable(),
  allergens: z.array(z.string()), // raw string array from DB JSON parse
});
export type RecipeListItem = z.infer<typeof RecipeListItemSchema>;

// Autocomplete suggestion — can be an ingredient name or a recipe name
export const AutocompleteSuggestionSchema = z.object({
  value: z.string(),
  type: z.enum(["ingredient", "recipe"]),
  recipeId: z.string().nullable().default(null), // set for type='recipe' to enable direct navigate
});
export type AutocompleteSuggestion = z.infer<typeof AutocompleteSuggestionSchema>;

// Recent view entry
export const RecentViewSchema = z.object({
  recipeId: z.string(),
  viewedAt: z.string(),
});
export type RecentView = z.infer<typeof RecentViewSchema>;

// Advanced filter state
export type CookTimeBucket = "under15" | "15to30" | "over30" | null;
export const DiscoveryFilterSchema = z.object({
  category: CategoryEnum.nullable().default(null),
  cookTimeBucket: z.enum(["under15", "15to30", "over30"]).nullable().default(null),
  skillLevel: SkillLevelEnum.nullable().default(null),
  cuisine: z.string().nullable().default(null),
});
export type DiscoveryFilter = z.infer<typeof DiscoveryFilterSchema>;
