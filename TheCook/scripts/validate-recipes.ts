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

const files = fs
  .readdirSync(recipesDir)
  .filter((f) => f.endsWith(".yaml"))
  .sort();

let hasErrors = false;

for (const file of files) {
  const raw = fs.readFileSync(path.join(recipesDir, file), "utf8");
  const data = parse(raw);
  const result = RecipeSchema.safeParse(data);

  if (!result.success) {
    hasErrors = true;
    console.error(`\nERROR in ${file}:`);
    for (const issue of result.error.issues) {
      const fieldPath = issue.path.join(" > ") || "root";
      console.error(`  Field "${fieldPath}": ${issue.message}`);
    }
  } else {
    console.log(`OK: ${file}`);
  }
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log(`\nAll ${files.length} recipes valid.`);
  if (files.length < 30) {
    console.warn(`Warning: only ${files.length} recipes — target is 30+`);
  }
  process.exit(0);
}
