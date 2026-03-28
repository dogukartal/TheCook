import { SQLiteDatabase } from 'expo-sqlite';
import { supabase } from '../auth/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const OLLAMA_URL = process.env.EXPO_PUBLIC_OLLAMA_URL ?? 'https://ollama.thecook.cc';
const OLLAMA_MODEL = 'qwen2.5:7b';

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

// ── Allergen auto-detection from ingredient names ────────────────────────

const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  gluten: ['un', 'makarna', 'ekmek', 'galeta', 'irmik', 'bulgur', 'yufka', 'börek', 'pide', 'nişasta'],
  dairy: ['süt', 'peynir', 'tereyağ', 'yoğurt', 'krema', 'kaymak', 'labne', 'lor', 'kaşar', 'beyaz peynir', 'tulum'],
  egg: ['yumurta'],
  nuts: ['ceviz', 'fındık', 'badem', 'antep fıstığı', 'fıstık', 'hindistan cevizi'],
  sesame: ['susam', 'tahin'],
};

function detectAllergens(ingredientGroups: any[]): string[] {
  const found = new Set<string>();
  for (const group of (ingredientGroups || [])) {
    for (const item of (group.items || [])) {
      const name = (item.name || '').toLowerCase();
      for (const [allergen, keywords] of Object.entries(ALLERGEN_KEYWORDS)) {
        if (keywords.some(kw => name.includes(kw))) {
          found.add(allergen);
        }
      }
    }
  }
  return [...found];
}

// ── System prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `/no_think
Sen profesyonel bir Türk şefisin. Ham tarifi aşağıdaki JSON formatına dönüştür. SADECE JSON döndür, başka hiçbir şey yazma.

GEÇERLİ DEĞERLER (bunların dışında değer KULLANMA):
- category: "ana yemek" | "kahvaltı" | "çorba" | "tatlı" | "salata" | "aperatif"
- mealType: "breakfast" | "lunch" | "dinner" | "snack"
- skillLevel: "beginner" | "intermediate" | "advanced"
- unit: "gr" | "ml" | "adet" | "yemek kaşığı" | "tatlı kaşığı" | "su bardağı" | "demet" | "dilim" | "tutam"
- equipment: "fırın" | "blender" | "döküm tava" | "stand mixer" | "wok" | "su ısıtıcı" | "çırpıcı" | "tencere" | "tava" | "mikser" | "rende" | "bıçak seti" | "kesme tahtası"
- allergens: "gluten" | "dairy" | "egg" | "nuts" | "sesame"

ALERJEN TESPİTİ (çok önemli, HER tarif için kontrol et):
- Un, makarna, irmik, yufka → "gluten"
- Süt, peynir, tereyağı, yoğurt, krema, kaymak → "dairy"
- Yumurta → "egg"
- Ceviz, fındık, badem, fıstık → "nuts"
- Susam, tahin → "sesame"

BİRİM DÖNÜŞÜMÜ:
- "1 su bardağı" → amount: 1, unit: "su bardağı"
- "1 çay bardağı" → amount: 0.5, unit: "su bardağı"
- "yarım su bardağı" → amount: 0.5, unit: "su bardağı"
- "1 paket" → amount: 1, unit: "adet"
- "1 diş sarımsak" → amount: 1, unit: "adet"
- "3 yumurta" → amount: 3, unit: "adet"
- "250 gram" → amount: 250, unit: "gr"
- "1 kilo" → amount: 1000, unit: "gr"

ADIM YAZIM KURALLARI:
- "why": O adım NEDEN yapılıyor? Teknik/bilimsel açıklama ver. "Bu adım önemlidir" gibi boş cümleler YASAK.
- "looksLikeWhenDone": Adım bittiğinde TAM OLARAK ne görmeliyim? Renk, kıvam, ses, koku gibi somut gözlemler yaz.
- "commonMistake": SADECE gerçek, somut bir hata varsa yaz. Yoksa "" (boş string) koy. Genel tavsiyeler YASAK.
- "recovery": commonMistake varsa kurtarma yolunu yaz, yoksa "" koy.
- "timerSeconds": Pişirme/bekleme süresi olan adımlarda saniye cinsinden yaz (ör: 30 dakika = 1800).

ÖRNEK — Girdi:
Başlık: Klasik Mercimek Çorbası
Malzemeler: 1.5 su bardağı kırmızı mercimek, 1 soğan, 1 havuç, 1 patates, 1 yemek kaşığı tereyağı, 1 yemek kaşığı un, 1 tatlı kaşığı tuz, 1 tatlı kaşığı pul biber, 6 su bardağı su
Yapılış: Soğanı yağda kavurun. Doğranmış sebzeleri ve mercimeği ekleyip suyunu koyun. Yumuşayana kadar pişirin. Blenderdan geçirin. Unu tereyağında kavurup çorbaya ekleyin.

ÖRNEK — Çıktı:
{"title":"Klasik Mercimek Çorbası","cuisine":"türk","category":"çorba","mealType":"lunch","skillLevel":"beginner","prepTime":10,"cookTime":30,"servings":4,"allergens":["gluten","dairy"],"equipment":["tencere","blender","tava"],"ingredientGroups":[{"label":null,"items":[{"name":"kırmızı mercimek","amount":1.5,"unit":"su bardağı","optional":false,"alternatives":[],"scalable":true},{"name":"soğan","amount":1,"unit":"adet","optional":false,"alternatives":[],"scalable":true},{"name":"havuç","amount":1,"unit":"adet","optional":false,"alternatives":[],"scalable":true},{"name":"patates","amount":1,"unit":"adet","optional":false,"alternatives":[],"scalable":true},{"name":"tereyağı","amount":1,"unit":"yemek kaşığı","optional":false,"alternatives":[],"scalable":true},{"name":"un","amount":1,"unit":"yemek kaşığı","optional":false,"alternatives":[],"scalable":true},{"name":"tuz","amount":1,"unit":"tatlı kaşığı","optional":false,"alternatives":[],"scalable":true},{"name":"pul biber","amount":1,"unit":"tatlı kaşığı","optional":false,"alternatives":[],"scalable":true},{"name":"su","amount":6,"unit":"su bardağı","optional":false,"alternatives":[],"scalable":true}]}],"steps":[{"title":"Soğanı kavur","instruction":"Tencerede tereyağının yarısını eritip soğanı pembeleşene kadar kavurun.","why":"Soğanı yağda kavurmak Maillard reaksiyonu ile tatlılığını ortaya çıkarır ve çorbaya derinlik katar.","looksLikeWhenDone":"Soğanlar saydam ve kenarları hafif altın sarısı renkte, tereyağ köpüğü azalmış.","commonMistake":"Soğanı yüksek ateşte kavurursanız acılaşır ve çorbaya acı tat verir.","recovery":"Acılaşan soğanları atıp taze soğanla tekrar başlayın, bu sefer kısık ateşte kavurun.","stepImage":null,"timerSeconds":300,"checkpoint":null,"warning":null,"sefimQA":[]},{"title":"Sebzeleri ve mercimeği pişir","instruction":"Doğranmış havuç, patates ve yıkanmış mercimeği ekleyin. 6 su bardağı su koyup kapağını kapatarak kısık ateşte 25 dakika pişirin.","why":"Mercimek ve sebzeler düşük ısıda yavaş pişerek lezzetlerini suya bırakır.","looksLikeWhenDone":"Mercimekler tamamen dağılmış, patates ve havuç çatalla kolayca ezilecek yumuşaklıkta.","commonMistake":"","recovery":"","stepImage":null,"timerSeconds":1500,"checkpoint":"Mercimekler parmak arasında eziliyorsa hazır.","warning":null,"sefimQA":[]},{"title":"Blenderdan geçir","instruction":"Tencerenin altını kapatıp el blenderı ile pürüzsüz kıvama gelene kadar çekin.","why":"Çorba pürüzsüz olmalı ki ağızda kadifemsi bir his bıraksın.","looksLikeWhenDone":"Tamamen pürüzsüz, tanecik kalmamış, kaşıkla akıtınca düzgün akıyor.","commonMistake":"Blenderı çalışırken tencereden çıkarırsanız etraf sıcak çorbayla sıçrar.","recovery":"Blenderı her zaman çorbanın içindeyken kapatın/açın.","stepImage":null,"timerSeconds":null,"checkpoint":null,"warning":"Sıcak çorbayı blenderlarken dikkat edin, sıçrama riski var.","sefimQA":[]},{"title":"Terbiye ekle","instruction":"Ayrı bir tavada kalan tereyağını eritip unu ekleyin, 2 dakika kavurun. Çorbaya yavaşça ekleyip karıştırın. Tuz ve pul biberi ekleyip 5 dakika daha kaynatın.","why":"Un-yağ karışımı (roux) çorbayı kıvamlandırır ve ipeksi bir doku kazandırır.","looksLikeWhenDone":"Çorba kaşığın arkasını kaplayacak kıvamda, pul biber yağda eriyerek yüzeyde kırmızı halka oluşturmuş.","commonMistake":"Unu kavurmadan çorbaya eklerseniz topaklanır ve çiğ un tadı kalır.","recovery":"Topaklanırsa çorbayı tekrar blenderdan geçirin.","stepImage":null,"timerSeconds":300,"checkpoint":null,"warning":null,"sefimQA":[]}]}

ŞİMDİ verilen tarifi aynı formatta dönüştür. Türkçe yaz, amount sayısal olsun.`;

// ── Sanitize LLM output ────────────────────────────────────────────────────

// ── Category auto-detection from title ────────────────────────────────────

const CATEGORY_TITLE_KEYWORDS: [RegExp, string][] = [
  [/çorba/i, 'çorba'],
  [/salata|meze|humus|cacık|ezme/i, 'salata'],
  [/kek|kurabiye|browni|tatlı|baklava|kadayıf|helva|sütlaç|muhallebi|puding|cheesecake|tiramisu|revani|şerbetli|lokma|profiterol|trileçe|pasta|bisküvi|cookie|muffin|turta/i, 'tatlı'],
  [/kahvaltı|menemen|omlet|poğaça|simit|börek.*peynir|gözleme|pankek|krep|reçel/i, 'kahvaltı'],
  [/atıştırmalık|cips|kraker|granola bar|energy ball/i, 'aperatif'],
];

function detectCategory(title: string, llmCategory: string): string {
  if (VALID_CATEGORIES.has(llmCategory)) {
    // Double-check: if LLM says "ana yemek" but title clearly says otherwise
    for (const [pattern, cat] of CATEGORY_TITLE_KEYWORDS) {
      if (pattern.test(title)) return cat;
    }
    return llmCategory;
  }
  for (const [pattern, cat] of CATEGORY_TITLE_KEYWORDS) {
    if (pattern.test(title)) return cat;
  }
  return 'ana yemek';
}

// ── Equipment auto-detection from instructions ───────────────────────────

const EQUIPMENT_INSTRUCTION_KEYWORDS: [RegExp, string][] = [
  [/fırın|fırında/i, 'fırın'],
  [/blender/i, 'blender'],
  [/tencere|haşla|kaynat/i, 'tencere'],
  [/tava|kavur|kızart|sotele/i, 'tava'],
  [/rende/i, 'rende'],
  [/çırp|mikser/i, 'çırpıcı'],
  [/wok/i, 'wok'],
  [/doğra|dilimle|kıy/i, 'kesme tahtası'],
];

function detectEquipment(instructions: string, llmEquipment: string[]): string[] {
  const found = new Set<string>();
  // Keep valid LLM equipment
  for (const e of llmEquipment) {
    const mapped = EQUIPMENT_MAP[e?.toLowerCase()] ?? e;
    if (VALID_EQUIPMENT.has(mapped)) found.add(mapped);
  }
  // Auto-detect from instructions
  for (const [pattern, equip] of EQUIPMENT_INSTRUCTION_KEYWORDS) {
    if (pattern.test(instructions)) found.add(equip);
  }
  return [...found];
}

function sanitizeRecipeData(data: any, rawInstructions?: string): any {
  // Equipment — LLM output + auto-detect from instructions
  data.equipment = detectEquipment(
    rawInstructions || data.steps?.map((s: any) => s.instruction).join(' ') || '',
    data.equipment || []
  );

  // Allergens — keep valid LLM output + auto-detect from ingredients as safety net
  const llmAllergens = (data.allergens || []).filter((a: string) => VALID_ALLERGENS.has(a));
  const autoAllergens = detectAllergens(data.ingredientGroups);
  data.allergens = [...new Set([...llmAllergens, ...autoAllergens])];

  // Category — auto-detect from title as safety net
  data.category = detectCategory(data.title || '', data.category);
  if (!VALID_MEAL_TYPES.has(data.mealType)) data.mealType = 'dinner';
  if (!VALID_SKILL_LEVELS.has(data.skillLevel)) data.skillLevel = 'beginner';

  // Numeric fields
  data.prepTime = Math.max(1, Math.round(Number(data.prepTime) || 10));
  data.cookTime = Math.max(1, Math.round(Number(data.cookTime) || 15));
  data.servings = Math.max(1, Math.round(Number(data.servings) || 4));

  // Ingredient groups — normalize label
  if ((data.ingredientGroups || []).length === 1) {
    data.ingredientGroups[0].label = null;
  }

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

  // Rescue orphaned step fields at root level (7B model bug: sometimes leaks step
  // fields outside the steps array when it runs out of tokens mid-step)
  if (data.instruction && Array.isArray(data.steps)) {
    data.steps.push({
      title: data.title || '',
      instruction: data.instruction,
      why: data.why || '',
      looksLikeWhenDone: data.looksLikeWhenDone || '',
      commonMistake: data.commonMistake ?? '',
      recovery: data.recovery ?? '',
      stepImage: null,
      timerSeconds: data.timerSeconds ?? null,
      checkpoint: data.checkpoint ?? null,
      warning: data.warning ?? null,
      sefimQA: [],
    });
    // Clean root-level step fields so they don't end up in the recipe row
    delete data.instruction;
    delete data.why;
    delete data.looksLikeWhenDone;
    delete data.commonMistake;
    delete data.recovery;
    delete data.timerSeconds;
    delete data.checkpoint;
    delete data.warning;
    delete data.sefimQA;
  }

  // Steps
  for (const step of (data.steps || [])) {
    step.title = step.title || '';
    step.instruction = step.instruction || 'Tarifi takip edin.';
    step.why = step.why || 'Bu adım tarifin doğru sonuç vermesi için önemlidir.';
    step.looksLikeWhenDone = step.looksLikeWhenDone || 'Görsel olarak hazır görünmeli.';
    // commonMistake/recovery: empty string is valid — means no notable mistake for this step
    step.commonMistake = step.commonMistake ?? '';
    step.recovery = step.recovery ?? '';
    step.stepImage = null;
    step.timerSeconds = step.timerSeconds ? Math.max(1, Math.round(Number(step.timerSeconds))) : null;
    step.checkpoint = step.checkpoint ?? null;
    step.warning = step.warning ?? null;
    step.sefimQA = step.sefimQA ?? [];
  }

  // Ensure allergens is always an array (7B sometimes returns empty string)
  if (!Array.isArray(data.allergens)) data.allergens = [];

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

  console.log('[Transform] Calling Ollama:', OLLAMA_URL, 'model:', OLLAMA_MODEL);
  console.log('[Transform] Recipe:', rawRecipe.title);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300_000); // 5 min timeout

  let rawJson = '';
  try {
    // Use streaming to avoid Cloudflare's 100s proxy timeout
    const ollamaResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'TheCook/1.0' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        stream: true,
        options: { temperature: 0.3, num_predict: 8192 },
        format: 'json',
      }),
    });

    console.log('[Transform] Response status:', ollamaResponse.status);

    if (!ollamaResponse.ok) {
      const errText = await ollamaResponse.text();
      console.error('[Transform] Ollama error body:', errText.substring(0, 500));
      throw new Error(`Ollama call failed (${ollamaResponse.status}): ${errText.substring(0, 200)}`);
    }

    // Read streaming NDJSON and concatenate message content
    const text = await ollamaResponse.text();
    console.log('[Transform] Raw response length:', text.length, 'first 200:', text.substring(0, 200));
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try {
        const chunk = JSON.parse(line);
        rawJson += chunk.message?.content ?? '';
      } catch { /* skip malformed lines */ }
    }
    console.log('[Transform] Parsed JSON length:', rawJson.length);
  } catch (err: any) {
    console.error('[Transform] Fetch error:', err.message || err);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  // 3. Parse & sanitize
  let recipeData;
  try {
    // Strip thinking tags (Qwen3) and markdown fences
    const cleaned = rawJson
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/^```json?\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim();
    recipeData = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse LLM JSON: ${rawJson.substring(0, 300)}`);
  }

  recipeData = sanitizeRecipeData(recipeData, rawRecipe.instructions_raw);

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
