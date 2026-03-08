-- ============================================================
-- The Cook — SQLite Schema Reference
-- This file is NOT executed at runtime. It exists for human
-- reference only. The actual DDL lives in src/db/client.ts.
-- ============================================================

-- seed_version table
-- Tracks which version of seed data has been loaded.
-- seedIfNeeded() in src/db/seed.ts reads this before inserting.
-- When version matches SEED_VERSION constant, seeding is skipped
-- entirely — no data loss on app restart.
CREATE TABLE IF NOT EXISTS seed_version (
  id      INTEGER PRIMARY KEY NOT NULL, -- always 1 (single-row sentinel)
  version TEXT    NOT NULL              -- semver string e.g. "1.0.0"
);

-- recipes table
-- Scalar columns hold queryable/filterable values.
-- Complex nested structures (arrays, objects) stored as JSON blobs
-- for simplicity in Phase 1. Phase 4 will add a normalized
-- recipe_ingredients table for ingredient search (DISC-01).
CREATE TABLE IF NOT EXISTS recipes (
  id               TEXT    PRIMARY KEY NOT NULL, -- UUID, matches Recipe.id from schema
  title            TEXT    NOT NULL,             -- display name
  cuisine          TEXT    NOT NULL,             -- e.g. "Turkish"
  category         TEXT    NOT NULL,             -- CategoryEnum: ana yemek, kahvaltı, etc.
  meal_type        TEXT    NOT NULL,             -- MealTypeEnum: breakfast, lunch, dinner, snack
  skill_level      TEXT    NOT NULL,             -- SkillLevelEnum: beginner, intermediate, advanced
  prep_time        INTEGER NOT NULL,             -- minutes (positive integer)
  cook_time        INTEGER NOT NULL,             -- minutes (positive integer)
  servings         INTEGER NOT NULL,             -- positive integer
  cover_image      TEXT,                         -- nullable URI/asset path
  allergens        TEXT    NOT NULL,             -- JSON array: AllergenTagEnum[] e.g. ["gluten","dairy"]
  equipment        TEXT    NOT NULL,             -- JSON array: EquipmentEnum[] e.g. ["tava"]
  ingredient_groups TEXT   NOT NULL,             -- JSON blob: IngredientGroup[] (see src/types/recipe.ts)
  steps            TEXT    NOT NULL              -- JSON blob: RecipeStep[] (5 CONT-02 fields each)
);

-- Indexes for the primary filter dimensions used in Phase 2 browse/search
CREATE INDEX IF NOT EXISTS idx_recipes_skill_level ON recipes (skill_level);
CREATE INDEX IF NOT EXISTS idx_recipes_category    ON recipes (category);

-- ============================================================
-- Phase 4 addition (planned): recipe_ingredients normalized table
-- Enables efficient ingredient search for DISC-01 (ingredient
-- discovery). Will be added via a DB_VERSION migration bump.
-- ============================================================
-- CREATE TABLE IF NOT EXISTS recipe_ingredients (
--   recipe_id   TEXT NOT NULL REFERENCES recipes(id),
--   name_normalized TEXT NOT NULL,  -- lowercased/stemmed Turkish name
--   PRIMARY KEY (recipe_id, name_normalized)
-- );
-- CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_name ON recipe_ingredients (name_normalized);
