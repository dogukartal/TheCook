import { SQLiteDatabase } from 'expo-sqlite';
import { supabase } from '../auth/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const OLLAMA_URL = process.env.EXPO_PUBLIC_OLLAMA_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = 'qwen2.5:3b';

export interface RawRecipeListItem {
  id: number;
  title: string;
  rating: number;
  votes: number;
  transformed_recipe_id: string | null;
}

/**
 * Fetch paginated raw recipes from Supabase.
 */
export async function fetchRawRecipes(
  page: number = 0,
  pageSize: number = 30,
  search?: string
): Promise<RawRecipeListItem[]> {
  try {
    let query = supabase
      .from('raw_recipes')
      .select('id, title, rating, votes, transformed_recipe_id')
      .order('rating', { ascending: false })
      .order('votes', { ascending: false })
      .order('id', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (search && search.trim().length > 0) {
      query = query.ilike('title', `%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('fetchRawRecipes error:', error);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.warn('fetchRawRecipes failed:', err);
    return [];
  }
}

// ── Enum validation sets ───────────────────────────────────────────────────

const VALID_EQUIPMENT = new Set(["fırın","blender","döküm tava","stand mixer","wok","su ısıtıcı","çırpıcı","tencere","tava","mikser","rende","bıçak seti","kesme tahtası"]);
const VALID_UNITS = new Set(["gr","ml","adet","yemek kaşığı","tatlı kaşığı","su bardağı","demet","dilim","tutam"]);
const VALID_CATEGORIES = new Set(["ana yemek","kahvaltı","çorba","tatlı","salata","aperatif"]);
const VALID_MEAL_TYPES = new Set(["breakfast","lunch","dinner","snack"]);
const VALID_SKILL_LEVELS = new Set(["beginner","intermediate","advanced"]);
const VALID_ALLERGENS = new Set(["gluten","dairy","egg","nuts","peanuts","shellfish","fish","soy","sesame","mustard","celery","lupin","molluscs","sulphites"]);

const EQUIPMENT_MAP: Record<string, string> = {
  "firin": "fırın", "ocak": "tava", "teflon tava": "tava", "derin tencere": "tencere",
  "büyük tencere": "tencere", "küçük tencere": "tencere", "kek kalıbı": "fırın",
  "fırın tepsisi": "fırın", "el mikseri": "mikser", "spatula": "kesme tahtası",
  "kızartma tavası": "tava", "izgara": "döküm tava", "merdane": "kesme tahtası",
};

const UNIT_MAP: Record<string, string> = {
  "gram": "gr", "g": "gr", "kg": "gr", "kilogram": "gr",
  "mililitre": "ml", "litre": "ml", "lt": "ml", "l": "ml",
  "bardak": "su bardağı", "fincan": "su bardağı", "çay bardağı": "su bardağı",
  "çay kaşığı": "tatlı kaşığı", "kaşık": "yemek kaşığı",
  "tane": "adet", "parça": "adet", "diş": "adet", "dal": "adet", "yaprak": "adet",
  "paket": "adet", "poşet": "adet", "küp": "adet",
  "göz kararı": "tutam", "bir miktar": "tutam", "az": "tutam", "yeterince": "tutam",
};

// ── System prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Sen bir profesyonel Türk şefisin. Sana ham bir yemek tarifi verilecek. Bunu aşağıdaki JSON formatına dönüştür.

SADECE geçerli JSON döndür. Açıklama, markdown, yorum YAZMA. Yanıtın { ile başlamalı ve } ile bitmeli.

JSON Şeması:
{
  "title": "Tarif adı",
  "cuisine": "türk",
  "category": "SADECE BİRİ: ana yemek | kahvaltı | çorba | tatlı | salata | aperatif",
  "mealType": "SADECE BİRİ: breakfast | lunch | dinner | snack",
  "skillLevel": "SADECE BİRİ: beginner | intermediate | advanced",
  "prepTime": SAYI (dakika),
  "cookTime": SAYI (dakika),
  "servings": SAYI,
  "allergens": [],
  "equipment": [],
  "ingredientGroups": [{"label": null, "items": [{"name": "...", "amount": SAYI, "unit": "...", "optional": false, "alternatives": [], "scalable": true}]}],
  "steps": [{"title": "...", "instruction": "...", "why": "...", "looksLikeWhenDone": "...", "commonMistake": "...", "recovery": "...", "stepImage": null, "timerSeconds": null, "checkpoint": null, "warning": null, "sefimQA": []}]
}

KURALLAR:
- category: et/tavuk/balık/makarna/pilav/börek/kebap/köfte → "ana yemek", çorbalar → "çorba", tatlılar/kekler/kurabiyeler → "tatlı", salatalar/mezeler → "salata", kahvaltılıklar → "kahvaltı", atıştırmalıklar → "aperatif"
- allergens: Un/makarna → gluten, Süt/peynir/tereyağı/yoğurt → dairy, Yumurta → egg, Ceviz/fındık/badem → nuts, Susam → sesame
- equipment sadece: fırın, blender, döküm tava, stand mixer, wok, su ısıtıcı, çırpıcı, tencere, tava, mikser, rende, bıçak seti, kesme tahtası
- unit sadece: gr, ml, adet, yemek kaşığı, tatlı kaşığı, su bardağı, demet, dilim, tutam
- Her step'te instruction, why, looksLikeWhenDone, commonMistake, recovery DOLU olmalı
- Türkçe yaz, amount sayısal olsun`;

// ── Sanitize LLM output ────────────────────────────────────────────────────

function sanitizeRecipeData(data: any): any {
  // Equipment
  data.equipment = [...new Set(
    (data.equipment || [])
      .map((e: string) => EQUIPMENT_MAP[e?.toLowerCase()] ?? e)
      .filter((e: string) => VALID_EQUIPMENT.has(e))
  )];

  // Allergens
  data.allergens = (data.allergens || []).filter((a: string) => VALID_ALLERGENS.has(a));

  // Enums with fallbacks
  if (!VALID_CATEGORIES.has(data.category)) data.category = 'ana yemek';
  if (!VALID_MEAL_TYPES.has(data.mealType)) data.mealType = 'dinner';
  if (!VALID_SKILL_LEVELS.has(data.skillLevel)) data.skillLevel = 'beginner';

  // Numeric fields
  data.prepTime = Math.max(1, Math.round(Number(data.prepTime) || 10));
  data.cookTime = Math.max(1, Math.round(Number(data.cookTime) || 15));
  data.servings = Math.max(1, Math.round(Number(data.servings) || 4));

  // Ingredient units
  for (const group of (data.ingredientGroups || [])) {
    for (const item of (group.items || [])) {
      if (!VALID_UNITS.has(item.unit)) {
        item.unit = UNIT_MAP[item.unit?.toLowerCase()] ?? 'adet';
      }
      item.amount = Math.max(0.1, Number(item.amount) || 1);
      item.optional = item.optional ?? false;
      item.alternatives = item.alternatives ?? [];
      item.scalable = item.scalable ?? true;
    }
  }

  // Steps
  for (const step of (data.steps || [])) {
    step.title = step.title || '';
    step.instruction = step.instruction || 'Tarifi takip edin.';
    step.why = step.why || 'Bu adım tarifin doğru sonuç vermesi için önemlidir.';
    step.looksLikeWhenDone = step.looksLikeWhenDone || 'Görsel olarak hazır görünmeli.';
    step.commonMistake = step.commonMistake || 'Süreye dikkat etmemek.';
    step.recovery = step.recovery || 'Dikkatli devam edin.';
    step.stepImage = null;
    step.timerSeconds = step.timerSeconds ? Math.max(1, Math.round(Number(step.timerSeconds))) : null;
    step.checkpoint = step.checkpoint ?? null;
    step.warning = step.warning ?? null;
    step.sefimQA = step.sefimQA ?? [];
  }

  return data;
}

// ── ID generation ──────────────────────────────────────────────────────────

function generateRecipeId(title: string): string {
  return title
    .toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

// ── Transform ──────────────────────────────────────────────────────────────

/**
 * Transform a raw recipe by calling Ollama directly from the app.
 * 1. Fetch raw recipe from Supabase
 * 2. Call Ollama (local LLM)
 * 3. Sanitize output
 * 4. Save to Supabase recipes + link raw_recipes
 * 5. Save to local SQLite
 */
export async function transformRawRecipe(
  rawRecipeId: number,
  db: SQLiteDatabase
): Promise<string> {
  // 1. Fetch raw recipe
  const { data: rawRecipe, error: fetchError } = await supabase
    .from('raw_recipes')
    .select('*')
    .eq('id', rawRecipeId)
    .single();

  if (fetchError || !rawRecipe) {
    throw new Error(`Raw recipe not found: ${fetchError?.message}`);
  }

  // Already transformed? Return cached
  if (rawRecipe.transformed_recipe_id) {
    // Ensure it's in local SQLite too
    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM recipes WHERE id = ?',
      [rawRecipe.transformed_recipe_id]
    );
    if (existing) return rawRecipe.transformed_recipe_id;
  }

  // 2. Call Ollama
  const userPrompt = `Başlık: ${rawRecipe.title}\n\nMalzemeler:\n${rawRecipe.ingredients_raw}\n\nYapılış:\n${rawRecipe.instructions_raw}`;

  console.log('Calling Ollama for recipe:', rawRecipe.title);
  const ollamaResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      options: { temperature: 0.3, num_predict: 4096 },
      format: 'json',
    }),
  });

  if (!ollamaResponse.ok) {
    const errText = await ollamaResponse.text();
    throw new Error(`Ollama call failed (${ollamaResponse.status}): ${errText}`);
  }

  const ollamaResult = await ollamaResponse.json();
  const rawJson = ollamaResult.message?.content ?? '';

  // 3. Parse & sanitize
  let recipeData;
  try {
    const cleaned = rawJson.replace(/^```json?\s*/m, '').replace(/```\s*$/m, '').trim();
    recipeData = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse LLM JSON: ${rawJson.substring(0, 300)}`);
  }

  recipeData = sanitizeRecipeData(recipeData);

  // Generate ID
  let recipeId = generateRecipeId(recipeData.title || rawRecipe.title);
  const { data: existingId } = await supabase.from('recipes').select('id').eq('id', recipeId).single();
  if (existingId) recipeId = `${recipeId}-${rawRecipeId}`;

  // 4. Save to Supabase
  const recipeRow = {
    id: recipeId,
    title: recipeData.title,
    cuisine: recipeData.cuisine || 'türk',
    category: recipeData.category,
    meal_type: recipeData.mealType,
    skill_level: recipeData.skillLevel,
    prep_time: recipeData.prepTime,
    cook_time: recipeData.cookTime,
    servings: recipeData.servings,
    cover_image: null as string | null,
    allergens: JSON.stringify(recipeData.allergens || []),
    equipment: JSON.stringify(recipeData.equipment || []),
    ingredient_groups: JSON.stringify(recipeData.ingredientGroups || []),
    steps: JSON.stringify(recipeData.steps || []),
  };

  const { error: insertError } = await supabase.from('recipes').insert(recipeRow);
  if (insertError) {
    console.warn('Supabase insert error:', insertError.message);
  }

  // Link raw_recipe
  await supabase
    .from('raw_recipes')
    .update({ transformed_recipe_id: recipeId })
    .eq('id', rawRecipeId);

  // 5. Save to local SQLite
  await db.runAsync(
    `INSERT OR REPLACE INTO recipes
      (id, title, cuisine, category, meal_type, skill_level,
       prep_time, cook_time, servings, cover_image,
       allergens, equipment, ingredient_groups, steps)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    recipeRow.id,
    recipeRow.title,
    recipeRow.cuisine,
    recipeRow.category,
    recipeRow.meal_type,
    recipeRow.skill_level,
    recipeRow.prep_time,
    recipeRow.cook_time,
    recipeRow.servings,
    recipeRow.cover_image,
    recipeRow.allergens,
    recipeRow.equipment,
    recipeRow.ingredient_groups,
    recipeRow.steps,
  );

  console.log('Recipe transformed and saved:', recipeId);
  return recipeId;
}
