#!/usr/bin/env python3
"""Insert cleaned recipes into Supabase raw_recipes table via psql."""

import json
import subprocess

INPUT_PATH = '/Users/omerozaltan/Desktop/TheCook/scripts/cleaned_recipes.json'

with open(INPUT_PATH, 'r', encoding='utf-8') as f:
    recipes = json.load(f)

print(f"Inserting {len(recipes)} recipes...")

# Build SQL in batches of 200
BATCH_SIZE = 200
total_inserted = 0

for batch_start in range(0, len(recipes), BATCH_SIZE):
    batch = recipes[batch_start:batch_start + BATCH_SIZE]
    values = []
    for r in batch:
        def esc(s):
            if s is None:
                return "NULL"
            return "'" + str(s).replace("'", "''") + "'"

        values.append(
            f"({esc(r['title'])}, {esc(r['original_name'])}, "
            f"{r['rating']}, {r['votes']}, "
            f"{esc(r['ingredients_raw'])}, {esc(r['instructions_raw'])}, "
            f"{esc(r['source_url'])})"
        )

    sql = (
        "INSERT INTO raw_recipes (title, original_name, rating, votes, "
        "ingredients_raw, instructions_raw, source_url) VALUES\n"
        + ",\n".join(values) + ";"
    )

    result = subprocess.run(
        ["docker", "exec", "-i", "supabase-db", "psql", "-U", "postgres", "-d", "postgres"],
        input=sql, capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"Error at batch {batch_start}: {result.stderr[:200]}")
        break

    total_inserted += len(batch)
    if total_inserted % 1000 == 0 or total_inserted == len(recipes):
        print(f"  Inserted {total_inserted}/{len(recipes)}")

print(f"\nDone! Total inserted: {total_inserted}")

# Verify count
result = subprocess.run(
    ["docker", "exec", "-i", "supabase-db", "psql", "-U", "postgres", "-d", "postgres",
     "-t", "-c", "SELECT count(*) FROM raw_recipes;"],
    capture_output=True, text=True
)
print(f"Rows in raw_recipes: {result.stdout.strip()}")
