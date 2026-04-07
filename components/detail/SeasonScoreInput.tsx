'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  entryId: number;
  currentScore: number | null;
}

export function SeasonScoreInput({ entryId, currentScore }: Props) {
  const [score, setScore] = useState(currentScore?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    const val = score.trim() === '' ? null : parseFloat(score);
    await fetch(`/api/media/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personal_score: val }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="mt-1.5 flex items-center gap-1">
      <input
        type="number"
        min="0"
        max="10"
        step="0.5"
        placeholder="—"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
        className="w-14 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs tabular-nums dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      <span className="text-[10px] text-slate-400">you</span>
      {saving && <span className="text-[10px] text-slate-400">…</span>}
    </div>
  );
}
