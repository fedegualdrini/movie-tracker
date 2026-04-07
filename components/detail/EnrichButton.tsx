'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface EnrichButtonProps {
  id: number;
  enrichedAt: string | null;
  hasTmdbKey: boolean;
}

export function EnrichButton({ id, enrichedAt, hasTmdbKey }: EnrichButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!hasTmdbKey) {
    return (
      <p className="text-xs text-slate-400">
        Add TMDB_API_KEY to .env.local to enable enrichment
      </p>
    );
  }

  async function enrich() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/media/${id}/enrich`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Enrichment failed');
      } else {
        router.refresh();
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button onClick={enrich} disabled={loading} variant="outline" size="sm" className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? 'Fetching…' : 'Fetch Metadata'}
      </Button>
      {enrichedAt && (
        <p className="text-xs text-slate-400">
          Last enriched: {new Date(enrichedAt).toLocaleDateString()}
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
