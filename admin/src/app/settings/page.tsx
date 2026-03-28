'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

const DEFAULT_PROMPT = `/no_think
Sen profesyonel bir Türk şefisin. Ham tarifi aşağıdaki JSON formatına dönüştür. SADECE JSON döndür, başka hiçbir şey yazma.

GEÇERLİ DEĞERLER (bunların dışında değer KULLANMA):
- category: "ana yemek" | "kahvaltı" | "çorba" | "tatlı" | "salata" | "aperatif"
- mealType: "breakfast" | "lunch" | "dinner" | "snack"
- skillLevel: "beginner" | "intermediate" | "advanced"
- unit: "gr" | "ml" | "adet" | "yemek kaşığı" | "tatlı kaşığı" | "su bardağı" | "demet" | "dilim" | "tutam"
- equipment: "fırın" | "blender" | "döküm tava" | "stand mixer" | "wok" | "su ısıtıcı" | "çırpıcı" | "tencere" | "tava" | "mikser" | "rende" | "bıçak seti" | "kesme tahtası"
- allergens: "gluten" | "dairy" | "egg" | "nuts" | "sesame"

ALERJEN TESPİTİ (çok önemli, HER tarif için kontrol et):
- Un, makarna, irmik, yufka → "gluten"
- Süt, peynir, tereyağı, yoğurt, krema, kaymak → "dairy"
- Yumurta → "egg"
- Ceviz, fındık, badem, fıstık → "nuts"
- Susam, tahin → "sesame"

BİRİM DÖNÜŞÜMÜ:
- "1 su bardağı" → amount: 1, unit: "su bardağı"
- "1 çay bardağı" → amount: 0.5, unit: "su bardağı"
- "yarım su bardağı" → amount: 0.5, unit: "su bardağı"
- "1 paket" → amount: 1, unit: "adet"
- "1 diş sarımsak" → amount: 1, unit: "adet"
- "3 yumurta" → amount: 3, unit: "adet"
- "250 gram" → amount: 250, unit: "gr"
- "1 kilo" → amount: 1000, unit: "gr"

ADIM YAZIM KURALLARI:
- "why": O adım NEDEN yapılıyor? Teknik/bilimsel açıklama ver. "Bu adım önemlidir" gibi boş cümleler YASAK.
- "looksLikeWhenDone": Adım bittiğinde TAM OLARAK ne görmeliyim? Renk, kıvam, ses, koku gibi somut gözlemler yaz.
- "commonMistake": SADECE gerçek, somut bir hata varsa yaz. Yoksa "" (boş string) koy. Genel tavsiyeler YASAK.
- "recovery": commonMistake varsa kurtarma yolunu yaz, yoksa "" koy.
- "timerSeconds": Pişirme/bekleme süresi olan adımlarda saniye cinsinden yaz (ör: 30 dakika = 1800).

ŞİMDİ verilen tarifi aynı formatta dönüştür. Türkçe yaz, amount sayısal olsun.`;

export default function SettingsPage() {
  const supabase = createClient();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPrompt();
  }, []);

  async function loadPrompt() {
    const { data } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'system_prompt')
      .single();

    setPrompt(data?.value || DEFAULT_PROMPT);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    // Upsert
    const { error } = await supabase
      .from('admin_settings')
      .upsert({ key: 'system_prompt', value: prompt }, { onConflict: 'key' });

    if (error) {
      alert(`Hata: ${error.message}`);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  function handleReset() {
    if (confirm('Promptu varsayılan değere sıfırlamak istediğinize emin misiniz?')) {
      setPrompt(DEFAULT_PROMPT);
    }
  }

  if (loading) return <p className="text-gray-500 text-sm">Yükleniyor...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ayarlar</h1>

      <div className="bg-white rounded-xl border p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">Tarif Dönüştürme Promptu (System Prompt)</label>
          <button onClick={handleReset} className="text-xs text-gray-500 hover:text-gray-700">
            Varsayılana Sıfırla
          </button>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={24}
          className="w-full rounded-lg border-gray-300 text-sm font-mono"
        />

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          {saved && <span className="text-green-600 text-sm">Kaydedildi!</span>}
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Bu prompt, &quot;Tarif Oluştur&quot; ve &quot;Ham Tarif Dönüştür&quot; işlemlerinde Ollama&apos;ya gönderilen system prompt olarak kullanılır.
        </p>
      </div>
    </div>
  );
}
