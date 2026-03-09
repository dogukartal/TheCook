# Recipe Authoring Guide

This guide is for you, Hira. It explains how to write a new recipe for The Cook app without needing to ask a developer for help.

Reading time: about 10 minutes. After that, you will be ready to write your first recipe.

---

## Section 1: How recipes are structured

Recipes are plain text files stored in the `content/recipes/` folder. Each file is one recipe. The files use a format called **YAML** — it is just text with a specific layout (indentation and colons). You do not need to know how to code. You just need to follow the pattern.

### File naming

Name the file after the recipe in lowercase English letters, with hyphens instead of spaces. Use English transliteration for Turkish names:

| Recipe name     | File name                  |
|-----------------|----------------------------|
| Menemen         | `menemen.yaml`             |
| Mercimek Çorbası| `mercimek-corbasi.yaml`    |
| Börek           | `borek.yaml`               |
| Karnıyarık      | `karniyarik.yaml`          |
| Sütlaç          | `sutlac.yaml`              |

Do not use Turkish special characters (ş, ğ, ü, ö, ç, ı) in file names. Use plain ASCII equivalents (s, g, u, o, c, i).

### A complete minimal recipe example

Here is what a recipe file looks like. This is the full `menemen.yaml`:

```yaml
id: menemen
title: Menemen
cuisine: türk
category: kahvaltı
mealType: breakfast
skillLevel: beginner
prepTime: 10
cookTime: 15
servings: 2
coverImage: null
allergens:
  - egg
  - dairy
equipment:
  - tava
ingredientGroups:
  - label: null
    items:
      - name: Yumurta
        amount: 4
        unit: adet
        optional: false
      - name: Domates
        amount: 300
        unit: gr
        optional: false
      - name: Yeşil biber
        amount: 2
        unit: adet
        optional: false
      - name: Soğan
        amount: 1
        unit: adet
        optional: true
      - name: Tereyağı
        amount: 1
        unit: yemek kaşığı
        optional: false
      - name: Tuz
        amount: 1
        unit: tatlı kaşığı
        optional: false
      - name: Karabiber
        amount: 1
        unit: tutam
        optional: true
      - name: Beyaz peynir
        amount: 50
        unit: gr
        optional: true
steps:
  - instruction: Domatesleri soyun ve küçük küpler halinde doğrayın.
    why: Küçük doğranmış domates daha hızlı sulanır ve pişer.
    looksLikeWhenDone: Domates parçaları 1-2 cm küp büyüklüğünde görünüyor.
    commonMistake: Domatesleri soymamak — kabuğun sert dokusu menemenin kıvamını bozar.
    recovery: Pişirme sırasında kabuklar ayrışırsa bir kaşıkla çıkarabilirsiniz.
    stepImage: null
    timerSeconds: null
  - instruction: Tavayı ısıtın ve tereyağını ekleyin. Biberleri 3 dakika kavurun.
    why: Biberleri önce kavurmak her ikisinin de yumuşamasını sağlar.
    looksLikeWhenDone: Biberler hafif yumuşamış ama hâlâ yeşil görünüyor.
    commonMistake: Yüksek ateşte kavurmak — tereyağı yanar.
    recovery: Ateşi hemen kısın ve tavayı ocaktan alın.
    stepImage: null
    timerSeconds: 180
```

Note the indentation: each level is 2 spaces. Do not use tabs.

---

## Section 2: All recipe fields explained

### Top-level fields

---

**`id`** — Required

A unique short name for this recipe. Use the English transliteration of the Turkish name, all lowercase, hyphens instead of spaces.

- Allowed values: Any short text without spaces or special characters
- Example: `mercimek-corbasi`
- This must be unique across all recipes. No two recipes can have the same id.

---

**`title`** — Required

The display name of the recipe, shown to users in the app. You can use full Turkish with special characters here.

- Example: `Mercimek Çorbası`

---

**`cuisine`** — Required

The cuisine type. For all recipes in this app, use:

- Value: `türk`

---

**`category`** — Required

The meal category. Use exactly one of these values (copy and paste):

| Value       | Meaning         |
|-------------|-----------------|
| `ana yemek` | Main course     |
| `kahvaltı`  | Breakfast       |
| `çorba`     | Soup            |
| `tatlı`     | Dessert         |
| `salata`    | Salad           |
| `aperatif`  | Appetizer/snack |

Example: `category: kahvaltı`

---

**`mealType`** — Required

When this dish is typically eaten. Use exactly one of these values:

| Value       | Meaning        |
|-------------|----------------|
| `breakfast` | Morning meal   |
| `lunch`     | Midday meal    |
| `dinner`    | Evening meal   |
| `snack`     | Any time snack |

Example: `mealType: breakfast`

---

**`skillLevel`** — Required

How difficult the recipe is. Use exactly one of these values:

| Value          | Meaning                               |
|----------------|---------------------------------------|
| `beginner`     | Anyone can make it, no special skills |
| `intermediate` | Some cooking experience needed        |
| `advanced`     | Requires confidence in the kitchen    |

Example: `skillLevel: beginner`

---

**`prepTime`** — Required

How many minutes the preparation takes (chopping, measuring, etc.) before you start cooking. Write a whole number only, no units.

- Example: `prepTime: 10` (means 10 minutes)

---

**`cookTime`** — Required

How many minutes the actual cooking takes. Write a whole number only.

- Example: `cookTime: 25`

---

**`servings`** — Required

How many people the recipe serves. Write a whole number.

- Example: `servings: 4`

---

**`coverImage`** — Optional

The filename of the cover photo for this recipe. If you have not added a photo yet, write `null`. When you have a photo ready, write the filename (see Section 5 for image naming rules).

- Example (no photo yet): `coverImage: null`
- Example (photo ready): `coverImage: menemen-cover.jpg`

---

**`allergens`** — Required (but can be empty)

A list of allergen tags for this recipe. Use only these exact values — do not invent new ones:

| Value        | Allergen                |
|--------------|-------------------------|
| `gluten`     | Gluten (wheat, rye, etc.) |
| `dairy`      | Milk and dairy products |
| `egg`        | Eggs                    |
| `nuts`       | Tree nuts (walnut, hazelnut, almond, etc.) |
| `peanuts`    | Peanuts                 |
| `shellfish`  | Crustaceans (shrimp, crab, lobster) |
| `fish`       | Fish                    |
| `soy`        | Soy                     |
| `sesame`     | Sesame                  |
| `mustard`    | Mustard                 |
| `celery`     | Celery                  |
| `lupin`      | Lupin                   |
| `molluscs`   | Molluscs (squid, mussels, etc.) |
| `sulphites`  | Sulphites               |

If the recipe contains no common allergens, write an empty list:
```yaml
allergens: []
```

If the recipe contains allergens, list each one:
```yaml
allergens:
  - egg
  - dairy
```

---

**`equipment`** — Required (but can be empty)

A list of special equipment required. Only use these exact values — do not invent new ones:

| Value           | Meaning                    |
|-----------------|----------------------------|
| `fırın`         | Oven                       |
| `blender`       | Blender                    |
| `döküm tava`    | Cast iron pan              |
| `stand mixer`   | Stand mixer                |
| `wok`           | Wok                        |
| `su ısıtıcı`    | Electric kettle            |
| `çırpıcı`       | Whisk / hand mixer         |
| `tencere`       | Pot / saucepan             |
| `tava`          | Pan / skillet              |
| `mikser`        | Hand blender / immersion blender |
| `rende`         | Grater                     |
| `bıçak seti`    | Knife set                  |
| `kesme tahtası` | Cutting board              |

If the recipe only needs basic, everyday items (a spoon, a bowl) that every kitchen has, write an empty list:
```yaml
equipment: []
```

If special equipment is needed, list each one:
```yaml
equipment:
  - fırın
  - rende
```

---

### Ingredient fields

Ingredients are organized in groups (see `ingredientGroups` below). Each ingredient has these fields:

---

**`name`** — Required

The ingredient name in Turkish. You can use special characters.

- Example: `name: Mercimek`

---

**`amount`** — Required

How much of the ingredient. Write a number (can be decimal, like `0.5`).

- Example: `amount: 200`

---

**`unit`** — Required

The unit for the amount. Use only these exact values — do not invent new ones:

| Value            | Meaning              |
|------------------|----------------------|
| `gr`             | Grams                |
| `ml`             | Milliliters          |
| `adet`           | Pieces / whole items |
| `yemek kaşığı`   | Tablespoon           |
| `tatlı kaşığı`   | Teaspoon             |
| `su bardağı`     | Water glass (~200ml) |
| `demet`          | Bunch                |
| `dilim`          | Slice                |
| `tutam`          | Pinch                |

Example: `unit: gr`

---

**`optional`** — Required

Whether the cook can leave this ingredient out without ruining the recipe. Write `true` or `false`.

- `true` — The ingredient is optional (the recipe works without it)
- `false` — The ingredient is required

Example: `optional: false`

---

**`ingredientGroups`** — Required

This is the list of ingredient groups. Most recipes have one group. Some recipes with separate components (like börek with a dough and a filling) have multiple groups.

**Single group recipe** — use `label: null`:
```yaml
ingredientGroups:
  - label: null
    items:
      - name: Yumurta
        amount: 4
        unit: adet
        optional: false
```

**Multi-group recipe** — give each group a label in Turkish:
```yaml
ingredientGroups:
  - label: Hamur için
    items:
      - name: Un
        amount: 3
        unit: su bardağı
        optional: false
  - label: İç için
    items:
      - name: Beyaz peynir
        amount: 200
        unit: gr
        optional: false
```

---

### Step fields

Each step in the `steps` list has these fields:

---

**`instruction`** — Required

What the cook should actually do in this step. Write it clearly and directly. Start with a verb.

- Example: `instruction: Soğanı ince halkalar halinde doğrayın.`

If your instruction contains a colon followed by text (like "Şunu yapın: böyle"), use the YAML block scalar format to avoid a formatting error:
```yaml
instruction: >-
  Şunu yapın: böyle yaparsınız ve devam edersiniz.
```

---

**`why`** — Required

A short explanation of why this step matters. This appears in the app to help cooks understand the reasoning, not just follow instructions blindly.

- Example: `why: Soğanı önce kavurmak tatlılığını ortaya çıkarır ve koku giderir.`

---

**`looksLikeWhenDone`** — Required

What the food looks like when this step is done correctly. Describe the visual or sensory cue the cook should look for.

- Example: `looksLikeWhenDone: Soğanlar şeffaflaşmış ve hafif altın rengi almış.`

---

**`commonMistake`** — Required

The most common mistake people make at this step.

- Example: `commonMistake: Çok yüksek ateşte kavurmak — soğan dıştan yanar, içten çiğ kalır.`

---

**`recovery`** — Required

What the cook can do if they have already made that mistake.

- Example: `recovery: Ateşi hemen kısın ve bir kaşık su ekleyin, karıştırarak devam edin.`

---

**`timerSeconds`** — Required (but can be null)

How many seconds this step takes. The app will show a countdown timer to the cook.

- If there is no specific timing for this step, write `null`.
- If there is a timing, write the number of seconds (whole numbers only).
  - 1 minute = 60
  - 2 minutes = 120
  - 5 minutes = 300
  - 10 minutes = 600

Example (no timer): `timerSeconds: null`
Example (3-minute step): `timerSeconds: 180`

---

**`stepImage`** — Required (but always null for now)

A photo of this step. Leave this as `null` for all steps for now. When photos are ready, tell the developer and they will add the filename.

- Value: `stepImage: null`

---

## Section 3: Writing a new recipe

Follow these steps in order:

**Step 1: Copy an existing recipe as a starting point**

Open the file `content/recipes/menemen.yaml`. Copy the entire contents and paste them into a new file in the same folder. Name the new file after your recipe (see the naming rules in Section 1).

For example, if you are writing karnıyarık, create `content/recipes/karniyarik.yaml`.

**Step 2: Replace every field**

Go through the file top to bottom and replace every value with your recipe's information. Do not delete any fields — every field must be present.

Pay special attention to:
- `id` — must be unique, no spaces, no Turkish characters
- `allergens` — only use values from the list in Section 2
- `equipment` — only use values from the list in Section 2
- `unit` — only use values from the list in Section 2

**Step 3: Open a terminal and run the validator**

The validator checks your recipe file for errors. To run it:

1. Open a terminal (on Mac: press Cmd+Space, type "Terminal", press Enter)
2. Navigate to the TheCook folder:
   ```
   cd path/to/TheCook
   ```
3. Run:
   ```
   npm run validate-recipes
   ```

**Step 4: Read the output**

If everything is correct, you will see:
```
Validating recipes in: content/recipes
Validated menemen.yaml — OK
Validated mercimek-corbasi.yaml — OK
Validated borek.yaml — OK
Validated karniyarik.yaml — OK
All recipes valid.
```

If there are errors, you will see messages like:
```
karniyarik.yaml — 2 error(s):
  Field "allergens > 0": Invalid enum value. Expected 'gluten' | 'dairy' | ...
  Field "steps > 1 > why": Required
```

**Step 5: Fix the errors and run again**

Read the error messages (see Section 4 for help understanding them), fix your file, and run `npm run validate-recipes` again. Repeat until you see "All recipes valid."

**Step 6: Tell the developer the recipe is ready**

Once the validator says "All recipes valid", the recipe is ready. Send a message to the developer to let them know. They will run the build step that adds it to the app.

---

## Section 4: Understanding validator errors

Here are the most common error messages and what they mean:

---

**`Field "steps > 0 > why": Required`**

The `why` field is missing from the first step (step 0 in the count — steps start at 0). Open the file, find the first step, and add a `why` line.

---

**`Field "steps > 2 > looksLikeWhenDone": Required`**

The `looksLikeWhenDone` field is missing from the third step (step index 2). Add it to that step.

---

**`Field "ingredientGroups > 0 > items > 0 > unit": Invalid enum value`**

The unit you wrote for the first ingredient in the first group is not in the allowed list. Check the units table in Section 2 and use one of the exact values listed there.

The full error will show which values are allowed:
```
Invalid enum value. Expected 'gr' | 'ml' | 'adet' | ...
```

---

**`Field "allergens > 0": Invalid enum value`**

The first item in your allergens list is not a recognized allergen tag. Check the allergens table in Section 2 and use one of the exact values listed.

---

**`Field "equipment > 1": Invalid enum value`**

The second item in your equipment list is not a recognized equipment value. Check the equipment table in Section 2.

---

**`Field "category": Invalid enum value`**

The category you wrote is not one of the six allowed values. Copy one exactly from the table in Section 2 (including any Turkish characters — `kahvaltı` not `kahvalti`).

---

**`Field "skillLevel": Invalid enum value`**

Use exactly `beginner`, `intermediate`, or `advanced`.

---

**`Field "mealType": Invalid enum value`**

Use exactly `breakfast`, `lunch`, `dinner`, or `snack`.

---

**`Field "prepTime": Expected number, received nan`**

The prepTime value is not a number. Remove any units (like "min" or "dk") — write just the number: `prepTime: 10`

---

**`Field "ingredientGroups > 0 > items": Array must contain at least 1 element(s)`**

An ingredient group has no items. Either add ingredients to that group or remove the group.

---

**General tip:** The error messages tell you exactly which field and which step or ingredient has the problem. The format is:

```
Field "section > index > fieldname"
```

Where `index` is a number starting from 0 (so index 0 = first item, index 1 = second item, index 2 = third item).

---

## Section 5: Images

Recipe images are optional for now. When you have photos ready, here is how they work:

**Cover image** (the main photo shown on the recipe card):

1. Name the file: `recipe-id-cover.jpg`
   - Example for menemen: `menemen-cover.jpg`
   - Example for mercimek-corbasi: `mercimek-corbasi-cover.jpg`
2. Place the file in `content/images/`
3. Tell the developer — they will add `coverImage: menemen-cover.jpg` to the YAML file

**Step images** (a photo showing what the food looks like at a specific step):

1. Name the file: `recipe-id-step-01.jpg`, `recipe-id-step-02.jpg`, etc.
   - Example: `menemen-step-01.jpg`, `menemen-step-02.jpg`
2. Place the file in `content/images/`
3. Tell the developer — they will add `stepImage: menemen-step-01.jpg` to the correct step in the YAML file

You do not need to edit the YAML file yourself to add images. Just provide the photo and the developer will handle the rest.

---

## Quick reference

**Units:**
`gr` · `ml` · `adet` · `yemek kaşığı` · `tatlı kaşığı` · `su bardağı` · `demet` · `dilim` · `tutam`

**Categories:**
`ana yemek` · `kahvaltı` · `çorba` · `tatlı` · `salata` · `aperatif`

**Meal types:**
`breakfast` · `lunch` · `dinner` · `snack`

**Skill levels:**
`beginner` · `intermediate` · `advanced`

**Allergens:**
`gluten` · `dairy` · `egg` · `nuts` · `peanuts` · `shellfish` · `fish` · `soy` · `sesame` · `mustard` · `celery` · `lupin` · `molluscs` · `sulphites`

**Equipment:**
`fırın` · `blender` · `döküm tava` · `stand mixer` · `wok` · `su ısıtıcı` · `çırpıcı` · `tencere` · `tava` · `mikser` · `rende` · `bıçak seti` · `kesme tahtası`

---

*If you get stuck, ask the developer. But try the validator first — it will usually tell you exactly what needs to be fixed.*
