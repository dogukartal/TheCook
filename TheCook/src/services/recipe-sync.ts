import { SQLiteDatabase } from 'expo-sqlite';
import { supabase } from '../auth/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/recipe-images`;

/**
 * Cloud'dan tarifleri çekip yerel SQLite'a upsert eder.
 * Offline'da sessizce başarısız olur — mevcut bundle verisi korunur.
 */
export async function syncRecipesFromCloud(db: SQLiteDatabase): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('id');

    if (error || !data || data.length === 0) {
      console.log('Recipe sync: no data or error, using local bundle');
      return;
    }

    await db.withTransactionAsync(async () => {
      for (const r of data) {
        await db.runAsync(
          `INSERT OR REPLACE INTO recipes
            (id, title, cuisine, category, meal_type, skill_level,
             prep_time, cook_time, servings, cover_image,
             allergens, equipment, ingredient_groups, steps)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          r.id,
          r.title,
          r.cuisine,
          r.category,
          r.meal_type,
          r.skill_level,
          r.prep_time,
          r.cook_time,
          r.servings,
          r.cover_image ?? null,
          typeof r.allergens === 'string' ? r.allergens : JSON.stringify(r.allergens),
          typeof r.equipment === 'string' ? r.equipment : JSON.stringify(r.equipment),
          typeof r.ingredient_groups === 'string'
            ? r.ingredient_groups
            : JSON.stringify(r.ingredient_groups),
          typeof r.steps === 'string' ? r.steps : JSON.stringify(r.steps),
        );
      }
    });

    console.log(`Recipe sync: ${data.length} recipes synced from cloud`);
  } catch (err) {
    console.warn('Recipe sync failed (offline?):', err);
  }
}

/**
 * Belirli bir görsel dosya adı için cloud URL döndürür.
 * Örn: "menemen-cover.webp" → "https://api.thecook.cc/storage/v1/object/public/recipe-images/menemen-cover.webp"
 */
export function getCloudImageUrl(filename: string): string {
  return `${STORAGE_BASE}/${filename}`;
}
