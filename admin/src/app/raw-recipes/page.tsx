'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import type { RawRecipe } from '@/lib/types';

export default function RawRecipesPage() {
  const supabase = createClient();
  const [recipes, setRecipes] = useState<RawRecipe[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transforming, setTransforming] = useState<Set<number>>(new Set());
  const PAGE_SIZE = 50;

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('raw_recipes')
      .select('id, title, rating, votes, transformed_recipe_id, ingredients_raw, instructions_raw')
      .order('rating', { ascending: false })
      .order('votes', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`);
    }

    const { data } = await query;
    setRecipes(data ?? []);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  async function handleTransform(raw: RawRecipe) {
    setTransforming((prev) => new Set(prev).add(raw.id));

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: raw.title,
          ingredients: raw.ingredients_raw,
          instructions: raw.instructions_raw,
          rawRecipeId: raw.id,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        alert(`Hata: ${err}`);
        return;
      }

      const { recipeId } = await res.json();
      // Update local state
      setRecipes((prev) =>
        prev.map((r) => r.id === raw.id ? { ...r, transformed_recipe_id: recipeId } : r)
      );
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    } finally {
      setTransforming((prev) => {
        const next = new Set(prev);
        next.delete(raw.id);
        return next;
      });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ham Tarifler</h1>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Tarif ara..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="flex-1 max-w-xs rounded-lg border-gray-300 text-sm"
        />
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Yükleniyor...</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tarif</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Puan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Oy</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Durum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recipes.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3 text-gray-600">{r.rating?.toFixed(1)}</td>
                  <td className="px-4 py-3 text-gray-600">{r.votes}</td>
                  <td className="px-4 py-3">
                    {r.transformed_recipe_id ? (
                      <Link href={`/recipes/${r.transformed_recipe_id}`} className="text-green-600 hover:underline text-xs font-medium">
                        Dönüştürüldü
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-xs">Bekliyor</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!r.transformed_recipe_id && (
                      <button
                        onClick={() => handleTransform(r)}
                        disabled={transforming.has(r.id)}
                        className="bg-orange-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
                      >
                        {transforming.has(r.id) ? 'Dönüştürülüyor...' : 'Dönüştür'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-gray-400">{recipes.length} sonuç (Sayfa {page + 1})</p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 rounded border text-sm disabled:opacity-30 hover:bg-gray-50"
          >
            Önceki
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={recipes.length < PAGE_SIZE}
            className="px-3 py-1 rounded border text-sm disabled:opacity-30 hover:bg-gray-50"
          >
            Sonraki
          </button>
        </div>
      </div>
    </div>
  );
}
