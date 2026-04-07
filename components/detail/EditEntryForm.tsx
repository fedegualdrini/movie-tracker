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
  personal_score: number | null;
  watched: number;
}

export function EditEntryForm({ item }: { item: MediaRow }) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(item.personal_score?.toString() ?? '');
  const [title, setTitle] = useState(item.title);
  const [year, setYear] = useState(item.release_year.toString());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    const scoreVal = score.trim() === '' ? null : parseFloat(score);
    await fetch(`/api/media/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, release_year: parseInt(year), personal_score: scoreVal }),
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
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Release Year</label>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Your Score (leave blank for No Visto)</label>
              <Input
                type="number"
                min="0"
                max="10"
                step="0.5"
                placeholder="0 – 10"
                value={score}
                onChange={(e) => setScore(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
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
