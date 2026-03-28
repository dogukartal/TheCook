'use client';

import type { IngredientGroup, Ingredient } from '@/lib/types';
import { UNITS } from '@/lib/types';

interface Props {
  groups: IngredientGroup[];
  onChange: (groups: IngredientGroup[]) => void;
}

function emptyIngredient(): Ingredient {
  return { name: '', amount: 1, unit: 'gr', optional: false, alternatives: [], scalable: true };
}

export default function IngredientEditor({ groups, onChange }: Props) {
  function updateGroup(idx: number, patch: Partial<IngredientGroup>) {
    const next = [...groups];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  }

  function addGroup() {
    onChange([...groups, { label: null, items: [emptyIngredient()] }]);
  }

  function removeGroup(idx: number) {
    onChange(groups.filter((_, i) => i !== idx));
  }

  function updateItem(gIdx: number, iIdx: number, patch: Partial<Ingredient>) {
    const next = [...groups];
    const items = [...next[gIdx].items];
    items[iIdx] = { ...items[iIdx], ...patch };
    next[gIdx] = { ...next[gIdx], items };
    onChange(next);
  }

  function addItem(gIdx: number) {
    const next = [...groups];
    next[gIdx] = { ...next[gIdx], items: [...next[gIdx].items, emptyIngredient()] };
    onChange(next);
  }

  function removeItem(gIdx: number, iIdx: number) {
    const next = [...groups];
    next[gIdx] = { ...next[gIdx], items: next[gIdx].items.filter((_, i) => i !== iIdx) };
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {groups.map((group, gIdx) => (
        <div key={gIdx} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={group.label ?? ''}
              onChange={(e) => updateGroup(gIdx, { label: e.target.value || null })}
              placeholder="Grup adı (opsiyonel)"
              className="flex-1 rounded border-gray-300 text-sm"
            />
            {groups.length > 1 && (
              <button onClick={() => removeGroup(gIdx)} className="text-red-500 text-xs hover:text-red-700">
                Grubu Sil
              </button>
            )}
          </div>

          <div className="space-y-2">
            {group.items.map((item, iIdx) => (
              <div key={iIdx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(gIdx, iIdx, { name: e.target.value })}
                  placeholder="Malzeme adı"
                  className="flex-1 rounded border-gray-300 text-sm"
                />
                <input
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateItem(gIdx, iIdx, { amount: parseFloat(e.target.value) || 0 })}
                  className="w-20 rounded border-gray-300 text-sm"
                  step="0.1"
                  min="0"
                />
                <select
                  value={item.unit}
                  onChange={(e) => updateItem(gIdx, iIdx, { unit: e.target.value as any })}
                  className="rounded border-gray-300 text-sm"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={item.optional}
                    onChange={(e) => updateItem(gIdx, iIdx, { optional: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  Opsiyonel
                </label>
                <button onClick={() => removeItem(gIdx, iIdx)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
              </div>
            ))}
          </div>

          <button
            onClick={() => addItem(gIdx)}
            className="mt-2 text-xs text-orange-600 hover:text-orange-700 font-medium"
          >
            + Malzeme Ekle
          </button>
        </div>
      ))}

      <button
        onClick={addGroup}
        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
      >
        + Malzeme Grubu Ekle
      </button>
    </div>
  );
}
