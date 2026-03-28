'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GeneratePage() {
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ recipeId: string } | null>(null);
  const router = useRouter();

  async function handleGenerate() {
    if (!title.trim() || !ingredients.trim() || !instructions.trim()) {
      setError('Tüm alanlar gerekli.');
      return;
    }

    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, ingredients, instructions }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Bilinmeyen hata' }));
        setError(data.error || 'Bir hata oluştu.');
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tarif Oluştur</h1>

      <div className="bg-white rounded-xl border p-6 max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tarif Adı</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border-gray-300"
            placeholder="Klasik Mercimek Çorbası"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Malzemeler</label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={6}
            className="w-full rounded-lg border-gray-300 text-sm"
            placeholder={"1.5 su bardağı kırmızı mercimek\n1 soğan\n1 havuç\n1 patates\n1 yemek kaşığı tereyağı\n..."}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Yapılış</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={6}
            className="w-full rounded-lg border-gray-300 text-sm"
            placeholder="Soğanı yağda kavurun. Doğranmış sebzeleri ve mercimeği ekleyip suyunu koyun. Yumuşayana kadar pişirin..."
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="text-green-700 text-sm font-medium">Tarif oluşturuldu!</p>
            <button
              onClick={() => router.push(`/recipes/${result.recipeId}`)}
              className="text-green-600 hover:underline text-sm mt-1"
            >
              Tarifi düzenle &rarr;
            </button>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
        >
          {generating ? 'Oluşturuluyor... (bu birkaç dakika sürebilir)' : 'Tarif Oluştur'}
        </button>
      </div>
    </div>
  );
}
