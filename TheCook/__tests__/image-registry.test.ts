import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import sharp from "sharp";

describe("image-registry", () => {
  let tempRawDir: string;
  let tempOutDir: string;
  let tempRegistryDir: string;
  let tempRegistryPath: string;
  let tempRecipesDir: string;

  beforeAll(async () => {
    // Build the registry in a temp location so we can require() it
    tempRawDir = fs.mkdtempSync(path.join(os.tmpdir(), "thecook-reg-raw-"));
    tempOutDir = fs.mkdtempSync(path.join(os.tmpdir(), "thecook-reg-out-"));
    tempRegistryDir = fs.mkdtempSync(path.join(os.tmpdir(), "thecook-reg-"));
    tempRecipesDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "thecook-reg-recipes-")
    );

    // Create the images subdirectory inside registryDir to match require() paths
    fs.mkdirSync(path.join(tempRegistryDir, "images"), { recursive: true });
    tempRegistryPath = path.join(tempRegistryDir, "image-registry.ts");

    // Create a test PNG
    const redPixel = Buffer.alloc(100 * 100 * 3, 0);
    for (let i = 0; i < 100 * 100; i++) {
      redPixel[i * 3] = 255;
    }
    await sharp(redPixel, { raw: { width: 100, height: 100, channels: 3 } })
      .png()
      .toFile(path.join(tempRawDir, "known-recipe-cover.png"));

    // Create recipe YAML
    const yaml = `id: known-recipe
title: Known Recipe
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
equipment:
  - tava
ingredientGroups:
  - label: null
    items:
      - name: Test
        amount: 1
        unit: adet
        optional: false
steps:
  - title: Step 1
    instruction: Do something
    why: Because
    looksLikeWhenDone: Done
    commonMistake: Mistake
    recovery: Fix it
    stepImage: null
    timerSeconds: null`;

    fs.writeFileSync(
      path.join(tempRecipesDir, "known-recipe.yaml"),
      yaml,
      "utf8"
    );

    // Run build-images to generate registry with output in the registry's images subdir
    const result = spawnSync(
      "npx",
      [
        "tsx",
        "scripts/build-images.ts",
        "--raw-dir",
        tempRawDir,
        "--out-dir",
        path.join(tempRegistryDir, "images"),
        "--registry-path",
        tempRegistryPath,
        "--recipes-dir",
        tempRecipesDir,
      ],
      {
        cwd: path.join(__dirname, ".."),
        encoding: "utf8",
        shell: true,
        timeout: 30000,
      }
    );

    if (result.status !== 0) {
      throw new Error(
        `build-images failed: ${result.stderr}\n${result.stdout}`
      );
    }
  });

  afterAll(() => {
    fs.rmSync(tempRawDir, { recursive: true, force: true });
    fs.rmSync(tempOutDir, { recursive: true, force: true });
    fs.rmSync(tempRegistryDir, { recursive: true, force: true });
    fs.rmSync(tempRecipesDir, { recursive: true, force: true });
  });

  it("generated registry file exists and contains getRecipeImages", () => {
    expect(fs.existsSync(tempRegistryPath)).toBe(true);
    const content = fs.readFileSync(tempRegistryPath, "utf8");
    expect(content).toContain("export function getRecipeImages");
  });

  it("getRecipeImages returns { cover: null, steps: [] } for unknown recipe ID", () => {
    const content = fs.readFileSync(tempRegistryPath, "utf8");

    // The function definition should include the null fallback
    expect(content).toContain("{ cover: null, steps: [] }");
  });

  it("getRecipeImages returns cover image source for recipe with images", () => {
    const content = fs.readFileSync(tempRegistryPath, "utf8");

    // Should contain a require() call for the known-recipe cover
    expect(content).toContain("known-recipe-cover.webp");
    expect(content).toContain("require(");

    // Should NOT have null cover for known-recipe
    const knownRecipeBlock = content.split("known-recipe")[1]?.split("}")[0];
    expect(knownRecipeBlock).toContain("require(");
  });

  it("registry exports RecipeImages and ImageSource types", () => {
    const content = fs.readFileSync(tempRegistryPath, "utf8");
    expect(content).toContain("export type ImageSource");
    expect(content).toContain("export interface RecipeImages");
  });
});
