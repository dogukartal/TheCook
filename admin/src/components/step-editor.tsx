'use client';

import type { RecipeStep, SefimQA } from '@/lib/types';

interface Props {
  steps: RecipeStep[];
  onChange: (steps: RecipeStep[]) => void;
}

function emptyStep(): RecipeStep {
  return {
    title: '',
    instruction: '',
    why: '',
    looksLikeWhenDone: '',
    commonMistake: '',
    recovery: '',
    stepImage: null,
    timerSeconds: null,
    checkpoint: null,
    warning: null,
    sefimQA: [],
  };
}

export default function StepEditor({ steps, onChange }: Props) {
  function updateStep(idx: number, patch: Partial<RecipeStep>) {
    const next = [...steps];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  }

  function addStep() {
    onChange([...steps, emptyStep()]);
  }

  function removeStep(idx: number) {
    onChange(steps.filter((_, i) => i !== idx));
  }

  function moveStep(idx: number, dir: -1 | 1) {
    const next = [...steps];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function addQA(stepIdx: number) {
    const next = [...steps];
    next[stepIdx] = {
      ...next[stepIdx],
      sefimQA: [...next[stepIdx].sefimQA, { question: '', answer: '' }],
    };
    onChange(next);
  }

  function updateQA(stepIdx: number, qaIdx: number, patch: Partial<SefimQA>) {
    const next = [...steps];
    const qa = [...next[stepIdx].sefimQA];
    qa[qaIdx] = { ...qa[qaIdx], ...patch };
    next[stepIdx] = { ...next[stepIdx], sefimQA: qa };
    onChange(next);
  }

  function removeQA(stepIdx: number, qaIdx: number) {
    const next = [...steps];
    next[stepIdx] = {
      ...next[stepIdx],
      sefimQA: next[stepIdx].sefimQA.filter((_, i) => i !== qaIdx),
    };
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => (
        <div key={idx} className="border rounded-lg bg-gray-50 overflow-hidden">
          <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b">
            <span className="text-sm font-medium text-gray-700">Adım {idx + 1}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => moveStep(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs">▲</button>
              <button onClick={() => moveStep(idx, 1)} disabled={idx === steps.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs">▼</button>
              <button onClick={() => removeStep(idx)} className="text-red-500 hover:text-red-700 text-xs">Sil</button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Başlık</label>
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) => updateStep(idx, { title: e.target.value })}
                  className="w-full rounded border-gray-300 text-sm"
                  placeholder="Soğanı kavur"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Timer (sn)</label>
                  <input
                    type="number"
                    value={step.timerSeconds ?? ''}
                    onChange={(e) => updateStep(idx, { timerSeconds: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full rounded border-gray-300 text-sm"
                    placeholder="300"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Talimat</label>
              <textarea
                value={step.instruction}
                onChange={(e) => updateStep(idx, { instruction: e.target.value })}
                rows={2}
                className="w-full rounded border-gray-300 text-sm"
                placeholder="Tencerede tereyağını eritip soğanı pembeleşene kadar kavurun."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Neden? (Teknik açıklama)</label>
              <textarea
                value={step.why}
                onChange={(e) => updateStep(idx, { why: e.target.value })}
                rows={2}
                className="w-full rounded border-gray-300 text-sm"
                placeholder="Soğanı yağda kavurmak Maillard reaksiyonu ile tatlılığını ortaya çıkarır."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bittiğinde nasıl görünmeli?</label>
              <textarea
                value={step.looksLikeWhenDone}
                onChange={(e) => updateStep(idx, { looksLikeWhenDone: e.target.value })}
                rows={2}
                className="w-full rounded border-gray-300 text-sm"
                placeholder="Soğanlar saydam ve kenarları hafif altın sarısı renkte."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sık yapılan hata</label>
                <textarea
                  value={step.commonMistake}
                  onChange={(e) => updateStep(idx, { commonMistake: e.target.value })}
                  rows={2}
                  className="w-full rounded border-gray-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kurtarma yolu</label>
                <textarea
                  value={step.recovery}
                  onChange={(e) => updateStep(idx, { recovery: e.target.value })}
                  rows={2}
                  className="w-full rounded border-gray-300 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Checkpoint</label>
                <input
                  type="text"
                  value={step.checkpoint ?? ''}
                  onChange={(e) => updateStep(idx, { checkpoint: e.target.value || null })}
                  className="w-full rounded border-gray-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Uyarı</label>
                <input
                  type="text"
                  value={step.warning ?? ''}
                  onChange={(e) => updateStep(idx, { warning: e.target.value || null })}
                  className="w-full rounded border-gray-300 text-sm"
                />
              </div>
            </div>

            {/* Sef'im Q&A */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sef&apos;im Q&amp;A</label>
              {step.sefimQA.map((qa, qIdx) => (
                <div key={qIdx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={qa.question}
                    onChange={(e) => updateQA(idx, qIdx, { question: e.target.value })}
                    placeholder="Soru"
                    className="flex-1 rounded border-gray-300 text-sm"
                  />
                  <input
                    type="text"
                    value={qa.answer}
                    onChange={(e) => updateQA(idx, qIdx, { answer: e.target.value })}
                    placeholder="Cevap"
                    className="flex-1 rounded border-gray-300 text-sm"
                  />
                  <button onClick={() => removeQA(idx, qIdx)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
                </div>
              ))}
              <button onClick={() => addQA(idx)} className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                + Soru/Cevap Ekle
              </button>
            </div>
          </div>
        </div>
      ))}

      <button onClick={addStep} className="text-sm text-orange-600 hover:text-orange-700 font-medium">
        + Adım Ekle
      </button>
    </div>
  );
}
