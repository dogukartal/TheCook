import { spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import sharp from "sharp";

describe("build-images CLI", () => {
  let tempRawDir: string;
  let tempOutDir: string;
  let tempRegistryPath: string;
  let tempRecipesDir: string;

  beforeEach(async () => {
    tempRawDir = fs.mkdtempSync(path.join(os.tmpdir(), "thecook-raw-"));
    tempOutDir = fs.mkdtempSync(path.join(os.tmpdir(), "thecook-out-"));
    tempRecipesDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "thecook-recipes-")
    );
    tempRegistryPath = path.join(tempOutDir, "image-registry.ts");

    // Create a small test PNG fixture (100x100 red square)
    const redPixel = Buffer.alloc(100 * 100 * 3, 0);
    for (let i = 0; i < 100 * 100; i++) {
      redPixel[i * 3] = 255; // R
      redPixel[i * 3 + 1] = 0; // G
      redPixel[i * 3 + 2] = 0; // B
    }
    await sharp(redPixel, { raw: { width: 100, height: 100, channels: 3 } })
      .png()
      .toFile(path.join(tempRawDir, "test-recipe-cover.png"));
  });

  afterEach(() => {
    fs.rmSync(tempRawDir, { recursive: true, force: true });
    fs.rmSync(tempOutDir, { recursive: true, force: true });
    fs.rmSync(tempRecipesDir, { recursive: true, force: true });
  });

  function runBuildImages(extraArgs: string[] = []): ReturnType<typeof spawnSync> {
    return spawnSync(
      "npx",
      [
        "tsx",
        "scripts/build-images.ts",
        "--raw-dir",
        tempRawDir,
        "--out-dir",
        tempOutDir,
        "--registry-path",
        tempRegistryPath,
        "--recipes-dir",
        tempRecipesDir,
        ...extraArgs,
      ],
      {
        cwd: path.join(__dirname, ".."),
        encoding: "utf8",
        shell: true,
        timeout: 30000,
      }
    );
  }

  function writeRecipeYaml(id: string, coverImage: string | null = null, stepCount = 0) {
    const steps = [];
    for (let i = 0; i < Math.max(stepCount, 1); i++) {
      steps.push(`  - title: Step ${i + 1}
    instruction: Do something
    why: Because
    looksLikeWhenDone: Done
    commonMistake: Mistake
    recovery: Fix it
    stepImage: null
    timerSeconds: null`);
    }

    const yaml = `id: ${id}
title: Test ${id}
cuisine: türk
category: kahvaltı
mealType: breakfast
skillLevel: beginner
prepTime: 5
cookTime: 15
servings: 2
coverImage: ${coverImage ?? "null"}
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
${steps.join("\n")}`;

    fs.writeFileSync(path.join(tempRecipesDir, `${id}.yaml`), yaml, "utf8");
  }

  it("converts a PNG fixture to WebP under 100KB", () => {
    writeRecipeYaml("test-recipe");

    const result = runBuildImages();
    expect(result.status).toBe(0);

    const webpPath = path.join(tempOutDir, "test-recipe-cover.webp");
    expect(fs.existsSync(webpPath)).toBe(true);

    const stats = fs.statSync(webpPath);
    expect(stats.size).toBeLessThan(100 * 1024); // under 100KB
    expect(stats.size).toBeGreaterThan(0);
  });

  it("skips recipes with no source images gracefully", () => {
    writeRecipeYaml("no-image-recipe");
    // No source image for no-image-recipe in tempRawDir

    const result = runBuildImages();
    expect(result.status).toBe(0);

    // Registry should still be generated
    expect(fs.existsSync(tempRegistryPath)).toBe(true);

    const content = fs.readFileSync(tempRegistryPath, "utf8");
    // Should contain null for cover since no image exists
    expect(content).toContain("no-image-recipe");
    expect(content).toContain("null");
  });

  it("generates image-registry.ts with require() paths and getRecipeImages export", () => {
    writeRecipeYaml("test-recipe");

    const result = runBuildImages();
    expect(result.status).toBe(0);

    expect(fs.existsSync(tempRegistryPath)).toBe(true);
    const content = fs.readFileSync(tempRegistryPath, "utf8");

    // Must contain require() for the converted image
    expect(content).toContain('require(');
    expect(content).toContain("test-recipe-cover.webp");

    // Must export getRecipeImages
    expect(content).toContain("getRecipeImages");
    expect(content).toContain("export function getRecipeImages");

    // Must export types
    expect(content).toContain("RecipeImages");
    expect(content).toContain("ImageSource");
  });

  it("errors when YAML references an image that does not exist on disk", () => {
    // coverImage references a file that does not exist in out-dir
    writeRecipeYaml("bad-ref", "nonexistent.webp");

    const result = runBuildImages();
    expect(result.status).toBe(1);
    expect(result.stderr + result.stdout).toContain("nonexistent.webp");
  });

  it("prints a summary after processing", () => {
    writeRecipeYaml("test-recipe");

    const result = runBuildImages();
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/processed/i);
  });
});
