// Wave 0 placeholder — replaced with full schema implementation in Plan 02
import { z } from "zod";

export const RecipeSchema = z.object({});
export type Recipe = z.infer<typeof RecipeSchema>;
