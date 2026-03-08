#!/usr/bin/env tsx
import * as fs from "fs";
import * as path from "path";
import { parse } from "yaml";
import { RecipeSchema } from "../src/types/recipe";

// Support --dir flag or RECIPES_DIR env var for testability
const dirArg = process.argv.indexOf("--dir");
const recipesDir =
  dirArg !== -1
    ? process.argv[dirArg + 1]
    : process.env.RECIPES_DIR ??
      path.join(process.cwd(), "content", "recipes");

// Support --out flag for testability
const outArg = process.argv.indexOf("--out");
const outputPath =
  outArg !== -1
    ? process.argv[outArg + 1]
    : path.join(process.cwd(), "app", "assets", "recipes.json");

const files = fs
  .readdirSync(recipesDir)
  .filter((f) => f.endsWith(".yaml"))
  .sort();

const recipes = [];

for (const file of files) {
  const raw = fs.readFileSync(path.join(recipesDir, file), "utf8");
  const data = parse(raw);
  const result = RecipeSchema.safeParse(data);

  if (!result.success) {
    console.error(`Build aborted: invalid recipe in ${file}`);
    for (const issue of result.error.issues) {
      const fieldPath = issue.path.join(" > ") || "root";
      console.error(`  ${fieldPath}: ${issue.message}`);
    }
    process.exit(1);
  }
  recipes.push(result.data);
}

// Ensure output directory exists
const outDir = path.dirname(outputPath);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(recipes, null, 2), "utf8");
console.log(`Built ${recipes.length} recipes → ${outputPath}`);
process.exit(0);
