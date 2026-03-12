// Stub file — will be implemented in Plans 04-02 and 04-03.
// These exports exist so discovery.test.ts can import and mock them.
import { SQLiteDatabase } from "expo-sqlite";

export async function filterRecipesByAllergens(
  _db: SQLiteDatabase,
  _recipes: any[],
  _userAllergens: string[]
): Promise<any[]> {
  throw new Error("not implemented");
}

export async function getFeedRecipes(
  _db: SQLiteDatabase,
  _recipes: any[],
  _skillLevel: string | null
): Promise<any[]> {
  throw new Error("not implemented");
}

export async function filterRecipesByCategory(
  _db: SQLiteDatabase,
  _recipes: any[],
  _category: string | null
): Promise<any[]> {
  throw new Error("not implemented");
}

export async function searchRecipesByIngredients(
  _db: SQLiteDatabase,
  _recipes: any[],
  _chips: string[],
  _fallback: boolean
): Promise<any[]> {
  throw new Error("not implemented");
}

export async function addBookmark(
  _db: SQLiteDatabase,
  _recipeId: string,
  _userId: string | null
): Promise<void> {
  throw new Error("not implemented");
}

export async function removeBookmark(
  _db: SQLiteDatabase,
  _recipeId: string
): Promise<void> {
  throw new Error("not implemented");
}

export async function getBookmarks(
  _db: SQLiteDatabase,
  _userId: string | null
): Promise<any[]> {
  throw new Error("not implemented");
}
