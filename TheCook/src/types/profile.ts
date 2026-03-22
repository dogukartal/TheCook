import { z } from "zod";
import { AllergenTagEnum, SkillLevelEnum, EquipmentEnum } from "./recipe";

export const ProfileSchema = z.object({
  allergens: z.array(AllergenTagEnum).default([]),
  skillLevel: SkillLevelEnum.nullable().default(null),
  equipment: z.array(EquipmentEnum).default(["fırın", "tava"]),
  onboardingCompleted: z.boolean().default(false),
  accountNudgeShown: z.boolean().default(false),
  cuisinePreferences: z.string().nullable().default(null),
  appGoals: z.string().nullable().default(null),
  isPremium: z.boolean().default(false),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const BookmarkSchema = z.object({
  id: z.string().uuid(),
  recipeId: z.string(),
  userId: z.string().nullable().default(null),
  createdAt: z.string().datetime(),
});
export type Bookmark = z.infer<typeof BookmarkSchema>;
