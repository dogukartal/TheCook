import { useSQLiteContext, SQLiteDatabase } from "expo-sqlite";
import * as Crypto from "expo-crypto";
import { RecipeListItem, RecentView } from "../types/discovery";
import { DiscoveryFilter, HardFilter } from "../types/discovery";
import { Recipe, RecipeSchema } from "../types/recipe";

// ---------------------------------------------------------------------------
// Types for internal DB row shapes
// ---------------------------------------------------------------------------

interface RecipeRow {
  id: string;
  title: string;
  cuisine: string;
  category: string;
  skill_level: string | null;
  prep_time: number;
  cook_time: number;
  cover_image: string | null;
  allergens: string; // JSON string
  equipment: string; // JSON string
}

interface IngredientSearchRow {
  id: string;
  ingredient_groups: string; // JSON string
  allergens: string; // JSON string
}

interface IngredientItem {
  name: string;
  amount?: number;
  unit?: string;
  optional?: boolean;
}

interface IngredientGroup {
  label?: string | null;
  items?: IngredientItem[];
  ingredients?: IngredientItem[]; // alternate shape used in tests
}

// ---------------------------------------------------------------------------
// SQL helpers
// ---------------------------------------------------------------------------

const SELECT_LIST_COLUMNS = `
  id, title, cuisine, category, skill_level, prep_time, cook_time, cover_image, allergens, equipment
`;

const ALLERGEN_EXCLUSION = `
  NOT EXISTS (
    SELECT 1 FROM json_each(r.allergens) AS ra
    WHERE ra.value IN (SELECT value FROM json_each(?))
  )
`;

const EQUIPMENT_EXCLUSION = `
  NOT EXISTS (
    SELECT 1 FROM json_each(r.equipment) AS re
    WHERE re.value NOT IN (SELECT value FROM json_each(?))
  )
`;

// Skill ceiling: beginner sees only beginner, intermediate sees beginner+intermediate, etc.
const SKILL_CEILING_MAP: Record<string, string[]> = {
  beginner: ["beginner"],
  intermediate: ["beginner", "intermediate"],
  advanced: ["beginner", "intermediate", "advanced"],
};

function mapRowToRecipeListItem(row: RecipeRow): RecipeListItem {
  return {
    id: row.id,
    title: row.title,
    cuisine: row.cuisine,
    category: row.category as RecipeListItem["category"],
    skillLevel: (row.skill_level ?? "beginner") as RecipeListItem["skillLevel"],
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    coverImage: row.cover_image,
    allergens: JSON.parse(row.allergens ?? "[]"),
    equipment: JSON.parse(row.equipment ?? "[]"),
  };
}

// ---------------------------------------------------------------------------
// Hard filter clause builder
// ---------------------------------------------------------------------------

/**
 * Builds SQL WHERE clauses for hard filters (allergen, skill ceiling, equipment).
 * Returns conditions array and params array to be merged into the query.
 */
function buildHardFilterClauses(filter: HardFilter): {
  conditions: string[];
  params: (string | number)[];
} {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filter.allergens.length > 0) {
    conditions.push(ALLERGEN_EXCLUSION.trim());
    params.push(JSON.stringify(filter.allergens));
  }

  if (filter.skillLevel !== null) {
    const allowed = SKILL_CEILING_MAP[filter.skillLevel] ?? [filter.skillLevel];
    const placeholders = allowed.map(() => "?").join(", ");
    conditions.push(`r.skill_level IN (${placeholders})`);
    params.push(...allowed);
  }

  if (filter.equipment.length > 0) {
    conditions.push(EQUIPMENT_EXCLUSION.trim());
    params.push(JSON.stringify(filter.equipment));
  }

  return { conditions, params };
}

// ---------------------------------------------------------------------------
// Allergen filter helper — extract ingredient names from ingredient_groups JSON
// ---------------------------------------------------------------------------

export function extractIngredientNames(ingredientGroupsJson: string): string[] {
  try {
    const groups: IngredientGroup[] = JSON.parse(ingredientGroupsJson);
    const names: string[] = [];
    for (const group of groups) {
      const items = group.items ?? group.ingredients ?? [];
      for (const item of items) {
        if (item.name) names.push(item.name.toLocaleLowerCase('tr').trim());
      }
    }
    return names;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Standalone functions — accept SQLiteDatabase directly (for testability)
// ---------------------------------------------------------------------------

/**
 * Pure JS filter — filters recipe array by user allergens.
 * Allergens field on each recipe can be a JSON string or already-parsed array.
 */
export async function filterRecipesByAllergens(
  _db: SQLiteDatabase,
  recipes: any[],
  userAllergens: string[]
): Promise<any[]> {
  if (userAllergens.length === 0) return recipes;
  return recipes.filter((recipe) => {
    let allergens: string[];
    if (Array.isArray(recipe.allergens)) {
      allergens = recipe.allergens;
    } else if (typeof recipe.allergens === "string") {
      try {
        allergens = JSON.parse(recipe.allergens);
      } catch {
        allergens = [];
      }
    } else {
      allergens = [];
    }
    return !allergens.some((a) => userAllergens.includes(a));
  });
}

/**
 * Sorts recipe array by skill level match.
 * beginner < intermediate < advanced
 * null skillLevel treated as beginner.
 */
export async function getFeedRecipes(
  _db: SQLiteDatabase,
  recipes: any[],
  skillLevel: string | null
): Promise<any[]> {
  const order: Record<string, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  };

  const sorted = [...recipes].sort((a, b) => {
    const aLevel = a.skillLevel ?? a.skill_level ?? "beginner";
    const bLevel = b.skillLevel ?? b.skill_level ?? "beginner";
    const aOrder = order[aLevel] ?? 1;
    const bOrder = order[bLevel] ?? 1;
    return aOrder - bOrder;
  });

  return sorted;
}

/**
 * Filters recipe array by category. null category returns all.
 */
export async function filterRecipesByCategory(
  _db: SQLiteDatabase,
  recipes: any[],
  category: string | null
): Promise<any[]> {
  if (category === null) return recipes;
  return recipes.filter((r) => r.category === category);
}

/**
 * Searches recipes by ingredients using AND logic.
 * fallback=true: if no full AND match, return partial matches ranked by overlap.
 * Ingredient matching done in JS (parse ingredient_groups JSON).
 */
export async function searchRecipesByIngredients(
  _db: SQLiteDatabase,
  recipes: any[],
  chips: string[],
  fallback: boolean
): Promise<any[]> {
  if (chips.length === 0) return recipes;

  const lowerChips = chips.map((c) => c.toLocaleLowerCase('tr').trim());

  // Score each recipe by overlap count
  const scored = recipes.map((recipe) => {
    const ingredientGroupsJson =
      typeof recipe.ingredient_groups === "string"
        ? recipe.ingredient_groups
        : JSON.stringify(recipe.ingredient_groups ?? []);

    const names = extractIngredientNames(ingredientGroupsJson);
    const overlap = lowerChips.filter((chip) =>
      names.some((name) => name.includes(chip) || chip.includes(name))
    ).length;

    return { recipe, overlap };
  });

  // AND logic: recipes with all chips present
  const andMatches = scored
    .filter((s) => s.overlap === lowerChips.length)
    .map((s) => s.recipe);

  if (andMatches.length > 0) return andMatches;

  // Fallback: partial matches ranked by overlap count descending
  if (fallback) {
    return scored
      .filter((s) => s.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .map((s) => s.recipe);
  }

  return [];
}

/**
 * Fetches all unique ingredient names from all recipes for autocomplete.
 */
export async function getAllIngredientNames(
  db: SQLiteDatabase
): Promise<string[]> {
  const rows = await db.getAllAsync<{ ingredient_groups: string }>(
    "SELECT ingredient_groups FROM recipes"
  );
  const nameSet = new Set<string>();
  for (const row of rows) {
    const names = extractIngredientNames(row.ingredient_groups ?? "[]");
    for (const name of names) nameSet.add(name);
  }
  return Array.from(nameSet).sort();
}

/**
 * Fetches all recipe titles for autocomplete recipe name suggestions.
 */
export async function getAllRecipeTitles(
  db: SQLiteDatabase
): Promise<{ id: string; title: string }[]> {
  const rows = await db.getAllAsync<{ id: string; title: string }>(
    "SELECT id, title FROM recipes ORDER BY title ASC"
  );
  return rows;
}

/**
 * Upserts a recent view, then trims to 10 most recent.
 */
export async function recordRecentView(
  db: SQLiteDatabase,
  recipeId: string
): Promise<void> {
  await db.runAsync(
    "INSERT OR REPLACE INTO recent_views (recipe_id, viewed_at) VALUES (?, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))",
    [recipeId]
  );
  await db.runAsync(
    "DELETE FROM recent_views WHERE recipe_id NOT IN (SELECT recipe_id FROM recent_views ORDER BY viewed_at DESC LIMIT 10)"
  );
}

/**
 * Returns last 10 RecentView entries ordered by viewed_at DESC.
 */
export async function getRecentViews(db: SQLiteDatabase): Promise<RecentView[]> {
  const rows = await db.getAllAsync<{ recipe_id: string; viewed_at: string }>(
    "SELECT recipe_id, viewed_at FROM recent_views ORDER BY viewed_at DESC LIMIT 10"
  );
  return rows.map((row) => ({
    recipeId: row.recipe_id,
    viewedAt: row.viewed_at,
  }));
}

/**
 * Fetches all recipes for list display with hard filter exclusion at SQL level.
 */
export async function getAllRecipesForFeed(
  db: SQLiteDatabase,
  filter: HardFilter
): Promise<RecipeListItem[]> {
  const { conditions, params } = buildHardFilterClauses(filter);

  let sql = `SELECT ${SELECT_LIST_COLUMNS} FROM recipes r`;
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += " ORDER BY rowid ASC";

  const rows = await db.getAllAsync<RecipeRow>(sql, params);
  return rows.map(mapRowToRecipeListItem);
}

/**
 * Fetches recipes filtered by advanced filter criteria with hard filter exclusion.
 */
export async function queryRecipesByFilter(
  db: SQLiteDatabase,
  filter: DiscoveryFilter,
  hardFilter: HardFilter
): Promise<RecipeListItem[]> {
  const { conditions, params } = buildHardFilterClauses(hardFilter);

  if (filter.category) {
    conditions.push("r.category = ?");
    params.push(filter.category);
  }

  if (filter.skillLevel) {
    conditions.push("r.skill_level = ?");
    params.push(filter.skillLevel);
  }

  if (filter.cookTimeBucket === "under15") {
    conditions.push("(r.prep_time + r.cook_time) < 15");
  } else if (filter.cookTimeBucket === "15to30") {
    conditions.push("(r.prep_time + r.cook_time) BETWEEN 15 AND 30");
  } else if (filter.cookTimeBucket === "over30") {
    conditions.push("(r.prep_time + r.cook_time) > 30");
  }

  if (filter.cuisine) {
    conditions.push("r.cuisine = ?");
    params.push(filter.cuisine);
  }

  let sql = `SELECT ${SELECT_LIST_COLUMNS} FROM recipes r`;
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  const rows = await db.getAllAsync<RecipeRow>(sql, params);
  return rows.map(mapRowToRecipeListItem);
}

/**
 * Fetches all recipes WITH ingredient_groups for search matching.
 * Returns RecipeListItem extended with ingredient_groups string.
 */
export async function getAllRecipesForSearch(
  db: SQLiteDatabase,
  filter: HardFilter
): Promise<(RecipeListItem & { ingredient_groups: string })[]> {
  const { conditions, params } = buildHardFilterClauses(filter);

  let sql = `SELECT ${SELECT_LIST_COLUMNS}, ingredient_groups FROM recipes r`;
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += " ORDER BY rowid ASC";

  const rows = await db.getAllAsync<RecipeRow & { ingredient_groups: string }>(sql, params);
  return rows.map((row) => ({
    ...mapRowToRecipeListItem(row),
    ingredient_groups: row.ingredient_groups,
  }));
}

/**
 * Fetches bookmarked recipes with hard filter exclusion.
 * Preserves bookmark recency order using rowMap pattern.
 */
export async function getBookmarkedRecipes(
  db: SQLiteDatabase,
  bookmarkIds: string[],
  filter: HardFilter
): Promise<RecipeListItem[]> {
  if (bookmarkIds.length === 0) return [];

  const { conditions, params } = buildHardFilterClauses(filter);

  const placeholders = bookmarkIds.map(() => "?").join(", ");
  conditions.push(`r.id IN (${placeholders})`);
  params.push(...bookmarkIds);

  let sql = `SELECT ${SELECT_LIST_COLUMNS} FROM recipes r`;
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  const rows = await db.getAllAsync<RecipeRow>(sql, params);
  const items = rows.map(mapRowToRecipeListItem);

  // Preserve bookmark order (most recently saved first)
  const rowMap = new Map(items.map((item) => [item.id, item]));
  return bookmarkIds
    .map((id) => rowMap.get(id))
    .filter((item): item is RecipeListItem => item !== undefined);
}

/**
 * Fetches recipes by IDs WITHOUT hard filter exclusion.
 * Used for cooked recipes tab where user already cooked these recipes.
 */
export async function getRecipesByIds(
  db: SQLiteDatabase,
  ids: string[]
): Promise<RecipeListItem[]> {
  if (ids.length === 0) return [];

  const placeholders = ids.map(() => "?").join(", ");
  const sql = `SELECT ${SELECT_LIST_COLUMNS} FROM recipes r WHERE r.id IN (${placeholders})`;
  const rows = await db.getAllAsync<RecipeRow>(sql, ids);
  const items = rows.map(mapRowToRecipeListItem);

  // Preserve input order
  const rowMap = new Map(items.map((item) => [item.id, item]));
  return ids
    .map((id) => rowMap.get(id))
    .filter((item): item is RecipeListItem => item !== undefined);
}

// ---------------------------------------------------------------------------
// Bookmark CRUD — same signatures as profile.ts but accepting db directly
// ---------------------------------------------------------------------------

export async function addBookmark(
  db: SQLiteDatabase,
  recipeId: string,
  userId: string | null
): Promise<void> {
  const id = Crypto.randomUUID();
  await db.runAsync(
    "INSERT OR IGNORE INTO bookmarks (id, recipe_id, user_id, created_at) VALUES (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))",
    [id, recipeId, userId]
  );
}

export async function removeBookmark(
  db: SQLiteDatabase,
  recipeId: string
): Promise<void> {
  await db.runAsync("DELETE FROM bookmarks WHERE recipe_id = ?", [recipeId]);
}

export async function getBookmarks(
  db: SQLiteDatabase,
  _userId: string | null
): Promise<{ id: string; recipeId: string; userId: string | null; createdAt: string }[]> {
  const rows = await db.getAllAsync<{
    id: string;
    recipe_id: string;
    user_id: string | null;
    created_at: string;
  }>("SELECT id, recipe_id, user_id, created_at FROM bookmarks ORDER BY created_at DESC");
  return rows.map((row) => ({
    id: row.id,
    recipeId: row.recipe_id,
    userId: row.user_id ?? null,
    createdAt: row.created_at,
  }));
}

// ---------------------------------------------------------------------------
// getRecipeById — full recipe fetch including steps (used only on detail screen)
// ---------------------------------------------------------------------------

export async function getRecipeById(
  db: SQLiteDatabase,
  id: string
): Promise<Recipe | null> {
  const row = await db.getFirstAsync<Record<string, unknown>>(
    "SELECT * FROM recipes WHERE id = ?",
    [id]
  );
  if (!row) return null;

  // Parse JSON fields
  const allergens = JSON.parse(row.allergens as string);
  const equipment = JSON.parse(row.equipment as string);
  const ingredientGroups = JSON.parse(row.ingredient_groups as string);
  const steps = JSON.parse(row.steps as string);

  // Filter invalid enum values that may come from LLM-generated recipes
  const VALID_EQUIPMENT = new Set(["fırın","blender","döküm tava","stand mixer","wok","su ısıtıcı","çırpıcı","tencere","tava","mikser","rende","bıçak seti","kesme tahtası"]);
  const VALID_UNITS = new Set(["gr","ml","adet","yemek kaşığı","tatlı kaşığı","su bardağı","demet","dilim","tutam"]);
  const VALID_ALLERGENS = new Set(["gluten","dairy","egg","nuts","peanuts","shellfish","fish","soy","sesame","mustard","celery","lupin","molluscs","sulphites"]);

  const sanitizedEquipment = (equipment || []).filter((e: string) => VALID_EQUIPMENT.has(e));
  const sanitizedAllergens = (allergens || []).filter((a: string) => VALID_ALLERGENS.has(a));

  // Sanitize ingredient units
  for (const group of (ingredientGroups || [])) {
    for (const item of (group.items || [])) {
      if (!VALID_UNITS.has(item.unit)) {
        item.unit = 'adet';
      }
      if (typeof item.amount !== 'number' || item.amount <= 0) item.amount = 1;
      if (item.optional === undefined) item.optional = false;
      if (!Array.isArray(item.alternatives)) item.alternatives = [];
      if (item.scalable === undefined) item.scalable = true;
    }
  }

  // Sanitize steps
  for (const step of (steps || [])) {
    step.title = step.title ?? '';
    step.instruction = step.instruction || 'Tarifi takip edin.';
    step.why = step.why || 'Bu adım önemlidir.';
    step.looksLikeWhenDone = step.looksLikeWhenDone || 'Hazır görünmeli.';
    step.commonMistake = step.commonMistake || 'Dikkatli olun.';
    step.recovery = step.recovery || 'Devam edin.';
    step.stepImage = step.stepImage ?? null;
    step.timerSeconds = (typeof step.timerSeconds === 'number' && step.timerSeconds > 0) ? step.timerSeconds : null;
    step.checkpoint = step.checkpoint ?? null;
    step.warning = step.warning ?? null;
    step.sefimQA = Array.isArray(step.sefimQA) ? step.sefimQA : [];
  }

  return RecipeSchema.parse({
    id: row.id,
    title: row.title,
    cuisine: row.cuisine,
    category: row.category,
    mealType: row.meal_type,
    skillLevel: row.skill_level,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    servings: row.servings,
    coverImage: row.cover_image ?? null,
    allergens: sanitizedAllergens,
    equipment: sanitizedEquipment,
    ingredientGroups,
    steps,
  });
}

// ---------------------------------------------------------------------------
// Hook — for use in React components via expo-sqlite v2 context
// ---------------------------------------------------------------------------

export function useRecipesDb() {
  const db = useSQLiteContext();

  return {
    getFeedRecipes: (recipes: any[], skillLevel: string | null) =>
      getFeedRecipes(db, recipes, skillLevel),
    filterRecipesByCategory: (recipes: any[], category: string | null) =>
      filterRecipesByCategory(db, recipes, category),
    searchRecipesByIngredients: (
      recipes: any[],
      chips: string[],
      fallback: boolean
    ) => searchRecipesByIngredients(db, recipes, chips, fallback),
    filterRecipesByAllergens: (recipes: any[], userAllergens: string[]) =>
      filterRecipesByAllergens(db, recipes, userAllergens),
    getAllIngredientNames: () => getAllIngredientNames(db),
    getAllRecipeTitles: () => getAllRecipeTitles(db),
    getAllRecipesForFeed: (filter: HardFilter) =>
      getAllRecipesForFeed(db, filter),
    getAllRecipesForSearch: (filter: HardFilter) =>
      getAllRecipesForSearch(db, filter),
    queryRecipesByFilter: (filter: DiscoveryFilter, hardFilter: HardFilter) =>
      queryRecipesByFilter(db, filter, hardFilter),
    getBookmarkedRecipes: (bookmarkIds: string[], filter: HardFilter) =>
      getBookmarkedRecipes(db, bookmarkIds, filter),
    recordRecentView: (recipeId: string) => recordRecentView(db, recipeId),
    getRecentViews: () => getRecentViews(db),
    addBookmark: (recipeId: string, userId: string | null) =>
      addBookmark(db, recipeId, userId),
    removeBookmark: (recipeId: string) => removeBookmark(db, recipeId),
    getBookmarks: (userId: string | null) => getBookmarks(db, userId),
    getRecipeById: (id: string) => getRecipeById(db, id),
  };
}
