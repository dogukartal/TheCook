#!/usr/bin/env tsx
// scripts/build-images.ts
// Converts raw PNG/JPG source images to optimized WebP files and
// auto-generates a TypeScript image registry with static require() calls.
//
// Usage:
//   npx tsx scripts/build-images.ts
//   npx tsx scripts/build-images.ts --raw-dir ... --out-dir ... --registry-path ... --recipes-dir ...

import sharp from "sharp";
import { encode } from "blurhash";
import * as fs from "fs";
import * as path from "path";
import { parse } from "yaml";

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------

function getFlag(name: string, fallback: string): string {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 && process.argv[idx + 1]
    ? process.argv[idx + 1]
    : fallback;
}

const RAW_DIR = getFlag(
  "raw-dir",
  path.join(process.cwd(), "content", "images", "raw")
);
const OUT_DIR = getFlag(
  "out-dir",
  path.join(process.cwd(), "app", "assets", "images")
);
const REGISTRY_PATH = getFlag(
  "registry-path",
  path.join(process.cwd(), "app", "assets", "image-registry.ts")
);
const RECIPES_DIR = getFlag(
  "recipes-dir",
  path.join(process.cwd(), "content", "recipes")
);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_WIDTH = 800;
const WEBP_QUALITY = 75;
const WEBP_EFFORT = 4;
const MAX_SIZE_BYTES = 100 * 1024; // 100KB

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find a source image file matching {baseName}.{png|jpg|jpeg} in rawDir */
function findSourceImage(rawDir: string, baseName: string): string | null {
  for (const ext of IMAGE_EXTENSIONS) {
    const candidate = path.join(rawDir, `${baseName}${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/** Convert a source image to optimized WebP */
async function processImage(
  inputPath: string,
  outputPath: string
): Promise<number> {
  const result = await sharp(inputPath)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
    .toFile(outputPath);
  return result.size;
}

/** Generate a blurhash string from a source image */
async function generateBlurhash(imagePath: string): Promise<string> {
  const { data, info } = await sharp(imagePath)
    .raw()
    .ensureAlpha()
    .resize(32, 32, { fit: "inside" })
    .toBuffer({ resolveWithObject: true });
  return encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    4, // componentX
    3, // componentY
  );
}

/** Read recipe YAML files and return array of { id, coverImage, stepCount } */
function readRecipes(recipesDir: string): Array<{
  id: string;
  coverImage: string | null;
  steps: Array<{ stepImage: string | null }>;
}> {
  if (!fs.existsSync(recipesDir)) return [];

  const files = fs
    .readdirSync(recipesDir)
    .filter((f) => f.endsWith(".yaml"))
    .sort();

  return files.map((file) => {
    const raw = fs.readFileSync(path.join(recipesDir, file), "utf8");
    const data = parse(raw);
    return {
      id: data.id as string,
      coverImage: (data.coverImage as string) ?? null,
      steps: (data.steps as Array<{ stepImage: string | null }>) ?? [],
    };
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const recipes = readRecipes(RECIPES_DIR);
  let imageCount = 0;
  let warningCount = 0;
  const errors: string[] = [];

  // Track which images were processed for registry generation
  const processedImages: Map<
    string,
    { cover: string | null; coverBlurhash: string | null; steps: (string | null)[]; stepBlurhashes: (string | null)[] }
  > = new Map();

  for (const recipe of recipes) {
    const coverBaseName = `${recipe.id}-cover`;
    const coverSource = findSourceImage(RAW_DIR, coverBaseName);

    let coverWebp: string | null = null;
    let coverBlurhash: string | null = null;

    if (coverSource) {
      const outputFileName = `${recipe.id}-cover.webp`;
      const outputPath = path.join(OUT_DIR, outputFileName);

      const size = await processImage(coverSource, outputPath);
      imageCount++;

      if (size > MAX_SIZE_BYTES) {
        console.warn(
          `  WARNING: ${outputFileName} is ${Math.round(size / 1024)}KB (exceeds 100KB limit)`
        );
        warningCount++;
      }

      coverWebp = outputFileName;
      coverBlurhash = await generateBlurhash(coverSource);
    }

    // Process step images
    const stepImages: (string | null)[] = [];
    const stepBlurhashes: (string | null)[] = [];
    for (let i = 0; i < recipe.steps.length; i++) {
      const stepNum = String(i + 1).padStart(2, "0");
      const stepBaseName = `${recipe.id}-step-${stepNum}`;
      const stepSource = findSourceImage(RAW_DIR, stepBaseName);

      if (stepSource) {
        const outputFileName = `${recipe.id}-step-${stepNum}.webp`;
        const outputPath = path.join(OUT_DIR, outputFileName);

        const size = await processImage(stepSource, outputPath);
        imageCount++;

        if (size > MAX_SIZE_BYTES) {
          console.warn(
            `  WARNING: ${outputFileName} is ${Math.round(size / 1024)}KB (exceeds 100KB limit)`
          );
          warningCount++;
        }

        stepImages.push(outputFileName);
        stepBlurhashes.push(await generateBlurhash(stepSource));
      } else {
        stepImages.push(null);
        stepBlurhashes.push(null);
      }
    }

    processedImages.set(recipe.id, { cover: coverWebp, coverBlurhash, steps: stepImages, stepBlurhashes });
  }

  // Validate YAML coverImage references
  for (const recipe of recipes) {
    if (recipe.coverImage && recipe.coverImage !== "null") {
      const expectedPath = path.join(OUT_DIR, recipe.coverImage);
      if (!fs.existsSync(expectedPath)) {
        errors.push(
          `Recipe "${recipe.id}" references coverImage "${recipe.coverImage}" but file not found at ${expectedPath}`
        );
      }
    }
  }

  if (errors.length > 0) {
    for (const err of errors) {
      console.error(`ERROR: ${err}`);
    }
    process.exit(1);
  }

  // Generate image-registry.ts
  generateRegistry(processedImages);

  console.log(
    `Processed ${imageCount} images for ${recipes.length} recipes, ${warningCount} warnings`
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Registry generation
// ---------------------------------------------------------------------------

function generateRegistry(
  processedImages: Map<
    string,
    { cover: string | null; coverBlurhash: string | null; steps: (string | null)[]; stepBlurhashes: (string | null)[] }
  >
) {
  const lines: string[] = [];

  lines.push(
    "// AUTO-GENERATED by scripts/build-images.ts -- DO NOT EDIT"
  );
  lines.push(`// Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push(
    "export type ImageSource = number; // Metro require() returns a number (asset ID)"
  );
  lines.push("");
  lines.push("export interface RecipeImages {");
  lines.push("  cover: ImageSource | null;");
  lines.push("  coverBlurhash: string | null;");
  lines.push("  steps: (ImageSource | null)[];");
  lines.push("  stepBlurhashes: (string | null)[];");
  lines.push("}");
  lines.push("");
  lines.push("const registry: Record<string, RecipeImages> = {");

  for (const [recipeId, images] of processedImages) {
    lines.push(`  "${recipeId}": {`);

    if (images.cover) {
      lines.push(
        `    cover: require("./images/${images.cover}"),`
      );
    } else {
      lines.push("    cover: null,");
    }

    // coverBlurhash
    if (images.coverBlurhash) {
      lines.push(`    coverBlurhash: "${images.coverBlurhash}",`);
    } else {
      lines.push("    coverBlurhash: null,");
    }

    // Steps array
    const stepEntries = images.steps.map((s) =>
      s ? `require("./images/${s}")` : "null"
    );
    if (stepEntries.length === 0) {
      lines.push("    steps: [],");
    } else {
      lines.push("    steps: [");
      for (const entry of stepEntries) {
        lines.push(`      ${entry},`);
      }
      lines.push("    ],");
    }

    // stepBlurhashes array
    const blurhashEntries = images.stepBlurhashes.map((b) =>
      b ? `"${b}"` : "null"
    );
    if (blurhashEntries.length === 0) {
      lines.push("    stepBlurhashes: [],");
    } else {
      lines.push("    stepBlurhashes: [");
      for (const entry of blurhashEntries) {
        lines.push(`      ${entry},`);
      }
      lines.push("    ],");
    }

    lines.push("  },");
  }

  lines.push("};");
  lines.push("");
  lines.push(
    "export function getRecipeImages(recipeId: string): RecipeImages {"
  );
  lines.push(
    '  return registry[recipeId] ?? { cover: null, coverBlurhash: null, steps: [], stepBlurhashes: [] };'
  );
  lines.push("}");
  lines.push("");

  // Ensure registry directory exists
  const registryDir = path.dirname(REGISTRY_PATH);
  if (!fs.existsSync(registryDir)) {
    fs.mkdirSync(registryDir, { recursive: true });
  }

  fs.writeFileSync(REGISTRY_PATH, lines.join("\n"), "utf8");
}

main().catch((err) => {
  console.error("build-images failed:", err);
  process.exit(1);
});
