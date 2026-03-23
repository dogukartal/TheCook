#!/usr/bin/env python3
"""
Download yemek_tarifleri dataset, deduplicate by fuzzy name matching,
keep highest-rated version of each duplicate group, clean names, and export.
"""

import re
import json
import pandas as pd
from datasets import load_dataset
from rapidfuzz import fuzz, process

# ── 1. Load dataset ──────────────────────────────────────────────────────────
print("Loading dataset from HuggingFace...")
ds = load_dataset("AnIl-c/yemek_tarifleri", split="train")
df = pd.DataFrame(ds)
print(f"Total recipes loaded: {len(df)}")

# ── 2. Clean recipe names ────────────────────────────────────────────────────
def clean_name(name: str) -> str:
    if not isinstance(name, str):
        return ""
    # Remove common suffixes/noise
    noise_patterns = [
        r'\s*\(?\s*videolu\s*\)?\s*',
        r'\s*tarifi?\s*videosu\s*',
        r'\s*nasıl\s+yapılır\s*\??\s*',
        r'\s*tarifi?\s*$',
        r'\s*yapımı\s*$',
        r'\s*yapılışı\s*$',
        r'\s*hazırlanışı\s*$',
        r'\s*\d+\s*$',  # trailing numbers
    ]
    cleaned = name.strip()
    for pat in noise_patterns:
        cleaned = re.sub(pat, '', cleaned, flags=re.IGNORECASE).strip()
    # Capitalize properly
    cleaned = cleaned.strip(' -–—')
    if cleaned:
        cleaned = cleaned[0].upper() + cleaned[1:]
    return cleaned

df['clean_name'] = df['Yemek İsmi'].apply(clean_name)
df = df[df['clean_name'].str.len() > 2].copy()
print(f"After name cleaning: {len(df)}")

# ── 3. Drop rows with missing critical data ──────────────────────────────────
df = df.dropna(subset=['Malzemeler', 'Yapılış'])
df = df[df['Malzemeler'].str.len() > 10]
df = df[df['Yapılış'].str.len() > 20]
print(f"After dropping incomplete: {len(df)}")

# ── 4. Fuzzy deduplication ───────────────────────────────────────────────────
print("Deduplicating with fuzzy matching (this may take a while)...")

# Sort by rating (descending) so we keep the best version
df['score'] = df['Ortalama Puan'].fillna(0) * df['Oy Sayısı'].fillna(0).apply(lambda x: min(x, 1000))
df = df.sort_values('score', ascending=False).reset_index(drop=True)

# Normalize names for comparison
def normalize_for_compare(name: str) -> str:
    n = name.lower().strip()
    n = re.sub(r'[^\w\s]', '', n)
    n = re.sub(r'\s+', ' ', n)
    return n

df['norm_name'] = df['clean_name'].apply(normalize_for_compare)

# Group duplicates using fuzzy matching
seen = set()
keep_indices = []
names_list = df['norm_name'].tolist()

THRESHOLD = 85  # fuzzy match threshold

for i, name in enumerate(names_list):
    if i in seen:
        continue
    if i % 5000 == 0:
        print(f"  Processing {i}/{len(names_list)}...")

    keep_indices.append(i)
    seen.add(i)

    # Find similar names in remaining recipes (check next 500 for efficiency)
    window = min(i + 2000, len(names_list))
    for j in range(i + 1, window):
        if j in seen:
            continue
        if fuzz.token_sort_ratio(name, names_list[j]) >= THRESHOLD:
            seen.add(j)

df_deduped = df.iloc[keep_indices].copy()
print(f"After deduplication: {len(df_deduped)}")

# ── 5. Filter for quality ────────────────────────────────────────────────────
# Keep recipes with decent ratings
df_final = df_deduped[
    (df_deduped['Ortalama Puan'].fillna(0) >= 4.0) &
    (df_deduped['Oy Sayısı'].fillna(0) >= 10)
].copy()
print(f"After quality filter (rating >= 4.0, votes >= 10): {len(df_final)}")

# ── 6. Prepare output ────────────────────────────────────────────────────────
output = []
for _, row in df_final.iterrows():
    output.append({
        'original_name': row['Yemek İsmi'],
        'title': row['clean_name'],
        'rating': round(float(row['Ortalama Puan'] or 0), 1),
        'votes': int(row['Oy Sayısı'] or 0),
        'ingredients_raw': row['Malzemeler'],
        'instructions_raw': row['Yapılış'],
        'source_url': row['URL'] if isinstance(row['URL'], str) else None,
    })

output_path = '/Users/omerozaltan/Desktop/TheCook/scripts/cleaned_recipes.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\nDone! Exported {len(output)} recipes to {output_path}")
print(f"\nSample recipe:")
print(json.dumps(output[0], ensure_ascii=False, indent=2))
