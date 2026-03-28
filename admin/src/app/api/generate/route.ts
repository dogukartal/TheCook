import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_URL = process.env.OLLAMA_URL || 'https://ollama.thecook.cc';
const OLLAMA_MODEL = 'qwen2.5:7b';

// ── Validation sets ─────────────────────────────────────────────────────────

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

const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  gluten: ['un', 'makarna', 'ekmek', 'galeta', 'irmik', 'bulgur', 'yufka', 'börek', 'pide', 'nişasta'],
  dairy: ['süt', 'peynir', 'tereyağ', 'yoğurt', 'krema', 'kaymak', 'labne', 'lor', 'kaşar', 'beyaz peynir', 'tulum'],
  egg: ['yumurta'],
  nuts: ['ceviz', 'fındık', 'badem', 'antep fıstığı', 'fıstık', 'hindistan cevizi'],
  sesame: ['susam', 'tahin'],
};

const CATEGORY_TITLE_KEYWORDS: [RegExp, string][] = [
  [/çorba/i, 'çorba'],
  [/salata|meze|humus|cacık|ezme/i, 'salata'],
  [/kek|kurabiye|browni|tatlı|baklava|kadayıf|helva|sütlaç|muhallebi|puding|cheesecake|tiramisu|revani|şerbetli|lokma|profiterol|trileçe|pasta|bisküvi|cookie|muffin|turta/i, 'tatlı'],
  [/kahvaltı|menemen|omlet|poğaça|simit|börek.*peynir|gözleme|pankek|krep|reçel/i, 'kahvaltı'],
  [/atıştırmalık|cips|kraker|granola bar|energy ball/i, 'aperatif'],
];

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

// ── Default system prompt ───────────────────────────────────────────────────

const DEFAULT_SYSTEM_PROMPT = `/no_think
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

ŞİMDİ verilen tarifi aynı formatta dönüştür. Türkçe yaz, amount sayısal olsun.`;

// ── Sanitize helpers ────────────────────────────────────────────────────────

function detectAllergens(ingredientGroups: any[]): string[] {
  const found = new Set<string>();
  for (const group of (ingredientGroups || [])) {
    for (const item of (group.items || [])) {
      const name = (item.name || '').toLowerCase();
      for (const [allergen, keywords] of Object.entries(ALLERGEN_KEYWORDS)) {
        if (keywords.some(kw => name.includes(kw))) found.add(allergen);
      }
    }
  }
  return [...found];
}

function detectCategory(title: string, llmCategory: string): string {
  if (VALID_CATEGORIES.has(llmCategory)) {
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

function detectEquipment(instructions: string, llmEquipment: string[]): string[] {
  const found = new Set<string>();
  for (const e of llmEquipment) {
    const mapped = EQUIPMENT_MAP[e?.toLowerCase()] ?? e;
    if (VALID_EQUIPMENT.has(mapped)) found.add(mapped);
  }
  for (const [pattern, equip] of EQUIPMENT_INSTRUCTION_KEYWORDS) {
    if (pattern.test(instructions)) found.add(equip);
  }
  return [...found];
}

function sanitizeRecipeData(data: any, rawInstructions?: string): any {
  data.equipment = detectEquipment(
    rawInstructions || data.steps?.map((s: any) => s.instruction).join(' ') || '',
    data.equipment || []
  );

  const llmAllergens = (data.allergens || []).filter((a: string) => VALID_ALLERGENS.has(a));
  const autoAllergens = detectAllergens(data.ingredientGroups);
  data.allergens = [...new Set([...llmAllergens, ...autoAllergens])];

  data.category = detectCategory(data.title || '', data.category);
  if (!VALID_MEAL_TYPES.has(data.mealType)) data.mealType = 'dinner';
  if (!VALID_SKILL_LEVELS.has(data.skillLevel)) data.skillLevel = 'beginner';

  data.prepTime = Math.max(1, Math.round(Number(data.prepTime) || 10));
  data.cookTime = Math.max(1, Math.round(Number(data.cookTime) || 15));
  data.servings = Math.max(1, Math.round(Number(data.servings) || 4));

  if ((data.ingredientGroups || []).length === 1) {
    data.ingredientGroups[0].label = null;
  }

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

  if (data.instruction && Array.isArray(data.steps)) {
    data.steps.push({
      title: data.title || '', instruction: data.instruction,
      why: data.why || '', looksLikeWhenDone: data.looksLikeWhenDone || '',
      commonMistake: data.commonMistake ?? '', recovery: data.recovery ?? '',
      stepImage: null, timerSeconds: data.timerSeconds ?? null,
      checkpoint: data.checkpoint ?? null, warning: data.warning ?? null, sefimQA: [],
    });
    for (const k of ['instruction', 'why', 'looksLikeWhenDone', 'commonMistake', 'recovery', 'timerSeconds', 'checkpoint', 'warning', 'sefimQA']) {
      delete data[k];
    }
  }

  for (const step of (data.steps || [])) {
    step.title = step.title || '';
    step.instruction = step.instruction || 'Tarifi takip edin.';
    step.why = step.why || 'Bu adım tarifin doğru sonuç vermesi için önemlidir.';
    step.looksLikeWhenDone = step.looksLikeWhenDone || 'Görsel olarak hazır görünmeli.';
    step.commonMistake = step.commonMistake ?? '';
    step.recovery = step.recovery ?? '';
    step.stepImage = null;
    step.timerSeconds = step.timerSeconds ? Math.max(1, Math.round(Number(step.timerSeconds))) : null;
    step.checkpoint = step.checkpoint ?? null;
    step.warning = step.warning ?? null;
    step.sefimQA = step.sefimQA ?? [];
  }

  if (!Array.isArray(data.allergens)) data.allergens = [];

  return data;
}

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

// ── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, ingredients, instructions, rawRecipeId, customPrompt } = body;

  if (!title || !ingredients || !instructions) {
    return NextResponse.json({ error: 'title, ingredients, instructions gerekli' }, { status: 400 });
  }

  // Get system prompt — use custom if provided, otherwise check admin_settings, then default
  let systemPrompt = customPrompt;
  if (!systemPrompt) {
    const { data: setting } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'system_prompt')
      .single();
    systemPrompt = setting?.value || DEFAULT_SYSTEM_PROMPT;
  }

  const userPrompt = `Başlık: ${title}\n\nMalzemeler:\n${ingredients}\n\nYapılış:\n${instructions}`;

  // Call Ollama
  let rawJson = '';
  try {
    const ollamaResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'TheCook-Admin/1.0' },
      signal: AbortSignal.timeout(300_000),
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: true,
        options: { temperature: 0.3, num_predict: 8192 },
        format: 'json',
      }),
    });

    if (!ollamaResponse.ok) {
      const errText = await ollamaResponse.text();
      return NextResponse.json({ error: `Ollama error: ${errText.substring(0, 200)}` }, { status: 502 });
    }

    const text = await ollamaResponse.text();
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try {
        const chunk = JSON.parse(line);
        rawJson += chunk.message?.content ?? '';
      } catch { /* skip */ }
    }
  } catch (err: any) {
    return NextResponse.json({ error: `Ollama fetch failed: ${err.message}` }, { status: 502 });
  }

  // Parse & sanitize
  let recipeData;
  try {
    const cleaned = rawJson
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/^```json?\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim();
    recipeData = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: `JSON parse failed: ${rawJson.substring(0, 300)}` }, { status: 500 });
  }

  recipeData = sanitizeRecipeData(recipeData, instructions);

  let recipeId = generateRecipeId(recipeData.title || title);
  const { data: existingId } = await supabase.from('recipes').select('id').eq('id', recipeId).single();
  if (existingId) recipeId = `${recipeId}-${Date.now()}`;

  // Save to Supabase
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
    cover_image: null,
    allergens: JSON.stringify(recipeData.allergens || []),
    equipment: JSON.stringify(recipeData.equipment || []),
    ingredient_groups: JSON.stringify(recipeData.ingredientGroups || []),
    steps: JSON.stringify(recipeData.steps || []),
  };

  const { error: insertError } = await supabase.from('recipes').insert(recipeRow);
  if (insertError) {
    return NextResponse.json({ error: `DB insert failed: ${insertError.message}` }, { status: 500 });
  }

  // Link raw_recipe if provided
  if (rawRecipeId) {
    await supabase.from('raw_recipes').update({ transformed_recipe_id: recipeId }).eq('id', rawRecipeId);
  }

  return NextResponse.json({ recipeId, recipe: recipeData });
}
