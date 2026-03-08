import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Valid minimal recipe YAML for testing
const validRecipeYaml = `
id: test-menemen
title: Test Menemen
cuisine: türk
category: kahvaltı
mealType: breakfast
skillLevel: beginner
prepTime: 5
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
        amount: 3
        unit: adet
        optional: false
      - name: Domates
        amount: 200
        unit: gr
        optional: false
steps:
  - instruction: Domatesleri küp küp doğrayın.
    why: Küçük doğramak daha hızlı pişmesini sağlar.
    looksLikeWhenDone: Domatesler eşit büyüklükte parçalara ayrılmış olmalı.
    commonMistake: Çok büyük doğramak.
    recovery: Daha küçük parçalara bölün.
    stepImage: null
    timerSeconds: null
  - instruction: Tavayı orta ateşte ısıtın ve domatesleri ekleyin.
    why: Orta ateş domateslerin yanmadan sulanmasını sağlar.
    looksLikeWhenDone: Domatesler yumuşamış ve suyunu bırakmış olmalı.
    commonMistake: Yüksek ateşte pişirmek.
    recovery: Ateşi kısın ve biraz su ekleyin.
    stepImage: null
    timerSeconds: 300
  - instruction: Yumurtaları domateslerin üzerine kırın.
    why: Yumurtaların domateslerle birlikte pişmesi lezzeti artırır.
    looksLikeWhenDone: Yumurtalar beyazlamaya başlamış olmalı.
    commonMistake: Yumurtaları çok erken karıştırmak.
    recovery: Beklemeye devam edin.
    stepImage: null
    timerSeconds: 120
`.trim();

// Invalid recipe YAML - missing 'why' field in step
const invalidRecipeYaml = `
id: test-invalid
title: Invalid Recipe
cuisine: türk
category: kahvaltı
mealType: breakfast
skillLevel: beginner
prepTime: 5
cookTime: 15
servings: 2
coverImage: null
allergens: []
equipment:
  - tava
ingredientGroups:
  - label: null
    items:
      - name: Test malzeme
        amount: 1
        unit: adet
        optional: false
steps:
  - instruction: Test adımı
    looksLikeWhenDone: Test görünüm
    commonMistake: Test hata
    recovery: Test düzeltme
    stepImage: null
    timerSeconds: null
`.trim();

describe("validate-recipes CLI", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thecook-validator-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true });
  });

  it("exits 0 on valid YAML", () => {
    fs.writeFileSync(path.join(tempDir, "test-menemen.yaml"), validRecipeYaml, "utf8");

    const result = spawnSync(
      "npx",
      ["tsx", "scripts/validate-recipes.ts", "--dir", tempDir],
      { cwd: path.join(__dirname, ".."), encoding: "utf8", shell: true, timeout: 30000 }
    );

    expect(result.status).toBe(0);
  });

  it("exits 1 on invalid YAML", () => {
    fs.writeFileSync(path.join(tempDir, "test-invalid.yaml"), invalidRecipeYaml, "utf8");

    const result = spawnSync(
      "npx",
      ["tsx", "scripts/validate-recipes.ts", "--dir", tempDir],
      { cwd: path.join(__dirname, ".."), encoding: "utf8", shell: true, timeout: 30000 }
    );

    expect(result.status).toBe(1);
  });

  it("prints human-readable error message with field path", () => {
    fs.writeFileSync(path.join(tempDir, "test-invalid.yaml"), invalidRecipeYaml, "utf8");

    const result = spawnSync(
      "npx",
      ["tsx", "scripts/validate-recipes.ts", "--dir", tempDir],
      { cwd: path.join(__dirname, ".."), encoding: "utf8", shell: true, timeout: 30000 }
    );

    const output = (result.stderr || "") + (result.stdout || "");
    // Should contain a field path indicating where the error is
    expect(output).toMatch(/steps/i);
    expect(output).toMatch(/why/i);
  });
});
