'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import type { Recipe } from '@/lib/types';
import { CATEGORIES, MEAL_TYPES, SKILL_LEVELS, ALLERGENS, EQUIPMENT, MEAL_TYPE_LABELS, SKILL_LABELS } from '@/lib/types';
import IngredientEditor from './ingredient-editor';
import StepEditor from './step-editor';

interface Props {
  initial?: Recipe;
  isNew?: boolean;
}

function generateId(title: string): string {
  return title
    .toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

const defaultRecipe: Recipe = {
  id: '',
  title: '',
  cuisine: 'türk',
  category: 'ana yemek',
  mealType: 'dinner',
  skillLevel: 'beginner',
  prepTime: 10,
  cookTime: 20,
  servings: 4,
  coverImage: null,
  allergens: [],
  equipment: [],
  ingredientGroups: [{ label: null, items: [{ name: '', amount: 1, unit: 'gr', optional: false, alternatives: [], scalable: true }] }],
  steps: [{ title: '', instruction: '', why: '', looksLikeWhenDone: '', commonMistake: '', recovery: '', stepImage: null, timerSeconds: null, checkpoint: null, warning: null, sefimQA: [] }],
};

type Tab = 'basic' | 'ingredients' | 'steps';

export default function RecipeForm({ initial, isNew }: Props) {
  const [recipe, setRecipe] = useState<Recipe>(initial ?? defaultRecipe);
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  function update(patch: Partial<Recipe>) {
    setRecipe((prev) => ({ ...prev, ...patch }));
  }

  function toggleArray<T extends string>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  async function handleSave() {
    if (!recipe.title.trim()) {
      setError('Tarif adı gerekli.');
      return;
    }

    setSaving(true);
    setError('');

    const id = isNew ? generateId(recipe.title) : recipe.id;
    const row = {
      id,
      title: recipe.title,
      cuisine: recipe.cuisine || 'türk',
      category: recipe.category,
      meal_type: recipe.mealType,
      skill_level: recipe.skillLevel,
      prep_time: recipe.prepTime,
      cook_time: recipe.cookTime,
      servings: recipe.servings,
      cover_image: recipe.coverImage,
      allergens: JSON.stringify(recipe.allergens),
      equipment: JSON.stringify(recipe.equipment),
      ingredient_groups: JSON.stringify(recipe.ingredientGroups),
      steps: JSON.stringify(recipe.steps),
    };

    const { error: saveError } = isNew
      ? await supabase.from('recipes').insert(row)
      : await supabase.from('recipes').update(row).eq('id', recipe.id);

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    router.push('/recipes');
    router.refresh();
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'basic', label: 'Genel Bilgiler' },
    { key: 'ingredients', label: `Malzemeler (${recipe.ingredientGroups.reduce((a, g) => a + g.items.length, 0)})` },
    { key: 'steps', label: `Adımlar (${recipe.steps.length})` },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{isNew ? 'Yeni Tarif' : recipe.title}</h1>
        <div className="flex gap-2">
          <button onClick={() => router.back()} className="px-4 py-2 rounded-lg text-sm border hover:bg-gray-50 transition-colors">
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Basic Info */}
      {activeTab === 'basic' && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarif Adı</label>
              <input
                type="text"
                value={recipe.title}
                onChange={(e) => update({ title: e.target.value })}
                className="w-full rounded-lg border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mutfak</label>
              <input
                type="text"
                value={recipe.cuisine}
                onChange={(e) => update({ cuisine: e.target.value })}
                className="w-full rounded-lg border-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select value={recipe.category} onChange={(e) => update({ category: e.target.value as any })} className="w-full rounded-lg border-gray-300">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Öğün</label>
              <select value={recipe.mealType} onChange={(e) => update({ mealType: e.target.value as any })} className="w-full rounded-lg border-gray-300">
                {MEAL_TYPES.map((m) => <option key={m} value={m}>{MEAL_TYPE_LABELS[m]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zorluk</label>
              <select value={recipe.skillLevel} onChange={(e) => update({ skillLevel: e.target.value as any })} className="w-full rounded-lg border-gray-300">
                {SKILL_LEVELS.map((s) => <option key={s} value={s}>{SKILL_LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hazırlık (dk)</label>
              <input type="number" value={recipe.prepTime} onChange={(e) => update({ prepTime: parseInt(e.target.value) || 0 })} className="w-full rounded-lg border-gray-300" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pişirme (dk)</label>
              <input type="number" value={recipe.cookTime} onChange={(e) => update({ cookTime: parseInt(e.target.value) || 0 })} className="w-full rounded-lg border-gray-300" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Porsiyon</label>
              <input type="number" value={recipe.servings} onChange={(e) => update({ servings: parseInt(e.target.value) || 1 })} className="w-full rounded-lg border-gray-300" min="1" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ekipman</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => update({ equipment: toggleArray(recipe.equipment, eq) })}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    recipe.equipment.includes(eq)
                      ? 'bg-orange-100 border-orange-300 text-orange-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alerjenler</label>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map((al) => (
                <button
                  key={al}
                  type="button"
                  onClick={() => update({ allergens: toggleArray(recipe.allergens, al) })}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    recipe.allergens.includes(al)
                      ? 'bg-red-100 border-red-300 text-red-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {al}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ingredients */}
      {activeTab === 'ingredients' && (
        <div className="bg-white rounded-xl border p-6">
          <IngredientEditor
            groups={recipe.ingredientGroups}
            onChange={(groups) => update({ ingredientGroups: groups })}
          />
        </div>
      )}

      {/* Steps */}
      {activeTab === 'steps' && (
        <div className="bg-white rounded-xl border p-6">
          <StepEditor
            steps={recipe.steps}
            onChange={(steps) => update({ steps })}
          />
        </div>
      )}
    </div>
  );
}
