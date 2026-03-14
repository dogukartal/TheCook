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
  - title: Domatesleri doğrayın
    instruction: Domatesleri küp küp doğrayın.
    why: Küçük doğramak daha hızlı pişmesini sağlar.
    looksLikeWhenDone: Domatesler eşit büyüklükte parçalara ayrılmış olmalı.
    commonMistake: Çok büyük doğramak.
    recovery: Daha küçük parçalara bölün.
    stepImage: null
    timerSeconds: null
  - title: Domatesleri pişirin
    instruction: Tavayı orta ateşte ısıtın ve domatesleri ekleyin.
    why: Orta ateş domateslerin yanmadan sulanmasını sağlar.
    looksLikeWhenDone: Domatesler yumuşamış ve suyunu bırakmış olmalı.
    commonMistake: Yüksek ateşte pişirmek.
    recovery: Ateşi kısın ve biraz su ekleyin.
    stepImage: null
    timerSeconds: 300
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

describe("build-recipes CLI", () => {
  let tempDir: string;
  let tempOutDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thecook-build-test-recipes-"));
    tempOutDir = fs.mkdtempSync(path.join(os.tmpdir(), "thecook-build-test-out-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true });
    fs.rmSync(tempOutDir, { recursive: true });
  });

  it("produces recipes.json with all recipes", () => {
    fs.writeFileSync(path.join(tempDir, "test-menemen.yaml"), validRecipeYaml, "utf8");
    const outFile = path.join(tempOutDir, "recipes.json");

    const result = spawnSync(
      "npx",
      ["tsx", "scripts/build-recipes.ts", "--dir", tempDir, "--out", outFile],
      { cwd: path.join(__dirname, ".."), encoding: "utf8", shell: true, timeout: 30000 }
    );

    expect(result.status).toBe(0);

    const json = JSON.parse(fs.readFileSync(outFile, "utf8"));
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBe(1);
    expect(json[0].id).toBe("test-menemen");
  });

  it("aborts on invalid YAML and does not write partial output", () => {
    // Write one valid and one invalid recipe
    fs.writeFileSync(path.join(tempDir, "valid.yaml"), validRecipeYaml, "utf8");
    fs.writeFileSync(path.join(tempDir, "invalid.yaml"), invalidRecipeYaml, "utf8");
    const outFile = path.join(tempOutDir, "recipes.json");

    const result = spawnSync(
      "npx",
      ["tsx", "scripts/build-recipes.ts", "--dir", tempDir, "--out", outFile],
      { cwd: path.join(__dirname, ".."), encoding: "utf8", shell: true, timeout: 30000 }
    );

    expect(result.status).toBe(1);
    // Output file should not exist (no partial write)
    expect(fs.existsSync(outFile)).toBe(false);
  });
});
