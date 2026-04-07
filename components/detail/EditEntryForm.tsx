'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface MediaRow {
  id: number;
  title: string;
  release_year: number;
  media_type: string;
  sheet_year: number;
  season_number: number;
  personal_score: number | null;
  watched: number;
}

const selectClass = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

export function EditEntryForm({ item }: { item: MediaRow }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [year, setYear] = useState(item.release_year.toString());
  const [sheetYear, setSheetYear] = useState(item.sheet_year.toString());
  const [mediaType, setMediaType] = useState(item.media_type);
  const [seasonNumber, setSeasonNumber] = useState((item.season_number ?? 1).toString());
  const [score, setScore] = useState(item.personal_score?.toString() ?? '');
  const [watched, setWatched] = useState(item.watched === 1);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    const scoreVal = score.trim() === '' ? null : parseFloat(score);
    await fetch(`/api/media/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        release_year: parseInt(year),
        sheet_year: parseInt(sheetYear),
        media_type: mediaType,
        season_number: parseInt(seasonNumber),
        personal_score: scoreVal,
        watched: scoreVal != null ? 1 : (watched ? 1 : 0),
      }),
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm('Delete this entry?')) return;
    setDeleting(true);
    await fetch(`/api/media/${item.id}`, { method: 'DELETE' });
    router.push('/library');
  }

  const isSeries = mediaType === 'series' || mediaType === 'anime';

  return (
    <div className="flex gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} className={selectClass}>
                  <option value="movie">Movie</option>
                  <option value="series">Series</option>
                  <option value="anime">Anime</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tracked In</label>
                <Input type="number" value={sheetYear} onChange={(e) => setSheetYear(e.target.value)} placeholder="2025" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Release Year</label>
                <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
              {isSeries && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Season</label>
                  <Input type="number" min="1" value={seasonNumber} onChange={(e) => setSeasonNumber(e.target.value)} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Score (blank = No Visto)</label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  placeholder="0 – 10"
                  value={score}
                  onChange={(e) => { setScore(e.target.value); if (e.target.value) setWatched(true); }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <select
                  value={score.trim() !== '' ? 'scored' : watched ? 'watched' : 'unwatched'}
                  onChange={(e) => {
                    if (e.target.value === 'unwatched') { setWatched(false); setScore(''); }
                    else if (e.target.value === 'watched') { setWatched(true); setScore(''); }
                  }}
                  className={selectClass}
                >
                  <option value="unwatched">No Visto</option>
                  <option value="watched">Watched (no score)</option>
                  <option value="scored" disabled>Scored ↑</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button variant="destructive" size="sm" onClick={remove} disabled={deleting}>
        <Trash2 className="h-4 w-4" />
        {deleting ? 'Deleting…' : 'Delete'}
      </Button>
    </div>
  );
}
