'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import type { RecipeRow } from '@/lib/types';

const CATEGORIES = ['Tümü', 'ana yemek', 'kahvaltı', 'çorba', 'tatlı', 'salata', 'aperatif'];

export default function RecipesPage() {
  const supabase = createClient();
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tümü');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipes();
  }, [search, category]);

  async function loadRecipes() {
    setLoading(true);
    let query = supabase
      .from('recipes')
      .select('id, title, cuisine, category, meal_type, skill_level, prep_time, cook_time, servings, cover_image, allergens, equipment, ingredient_groups, steps')
      .order('title');

    if (search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`);
    }
    if (category !== 'Tümü') {
      query = query.eq('category', category);
    }

    const { data } = await query;
    setRecipes(data ?? []);
    setLoading(false);
  }

  async function deleteRecipe(id: string) {
    if (!confirm(`"${id}" tarifini silmek istediğinize emin misiniz?`)) return;
    await supabase.from('recipes').delete().eq('id', id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tarifler</h1>
        <Link
          href="/recipes/new"
          className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
        >
          + Yeni Tarif
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Tarif ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-xs rounded-lg border-gray-300 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border-gray-300 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Yükleniyor...</p>
      ) : recipes.length === 0 ? (
        <p className="text-gray-500 text-sm">Tarif bulunamadı.</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tarif</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Kategori</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Seviye</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Süre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Adım</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recipes.map((r) => {
                const steps = typeof r.steps === 'string' ? JSON.parse(r.steps || '[]') : (r.steps || []);
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/recipes/${r.id}`} className="text-orange-600 hover:underline font-medium">
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.category}</td>
                    <td className="px-4 py-3 text-gray-600">{r.skill_level}</td>
                    <td className="px-4 py-3 text-gray-600">{r.prep_time + r.cook_time} dk</td>
                    <td className="px-4 py-3 text-gray-600">{steps.length}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteRecipe(r.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3">{recipes.length} tarif</p>
    </div>
  );
}
