'use client';

import { useState, useRef } from 'react';
import { Sparkles, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProgressEvent {
  type: 'start' | 'enriched' | 'skip' | 'error' | 'complete';
  title?: string;
  done?: number;
  total?: number;
  failed?: number;
  poster?: string | null;
  tmdbScore?: number | null;
  rtScore?: string | null;
  reason?: string;
  error?: string;
}

export function EnrichAllButton() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [log, setLog] = useState<ProgressEvent[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  async function startEnrichAll() {
    setRunning(true);
    setProgress(null);
    setLog([]);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch('/api/enrich-all', { method: 'POST', signal: abort.signal });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const evt = JSON.parse(line.slice(6)) as ProgressEvent;
          setProgress(evt);
          if (evt.type === 'enriched' || evt.type === 'skip' || evt.type === 'error') {
            setLog((prev) => [evt, ...prev].slice(0, 50));
          }
          if (evt.type === 'complete') setRunning(false);
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setRunning(false);
      }
    }
  }

  function stop() {
    abortRef.current?.abort();
    setRunning(false);
  }

  const pct = progress?.total ? Math.round(((progress.done ?? 0) / progress.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {!running ? (
          <Button onClick={startEnrichAll} variant="default" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Enrich All Missing
          </Button>
        ) : (
          <Button onClick={stop} variant="destructive" size="sm">
            Stop
          </Button>
        )}
        {progress?.type === 'complete' && (
          <p className="text-sm text-green-600 font-medium">
            Done — {progress.done} enriched, {progress.failed} skipped
          </p>
        )}
      </div>

      {(running || (progress && progress.type !== 'complete')) && progress?.total && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{progress.title ?? '…'}</span>
            <span>{progress.done ?? 0} / {progress.total}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-800 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          {(progress.failed ?? 0) > 0 && (
            <p className="text-xs text-amber-600">{progress.failed} no match found</p>
          )}
        </div>
      )}

      {log.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-2 space-y-0.5">
          {log.map((evt, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {evt.type === 'enriched' ? (
                <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 flex-shrink-0 text-amber-400" />
              )}
              <span className={`truncate ${evt.type === 'enriched' ? 'text-slate-700' : 'text-slate-400'}`}>
                {evt.title}
                {evt.type === 'enriched' && evt.tmdbScore && (
                  <span className="ml-1 text-slate-400">TMDB {evt.tmdbScore.toFixed(1)}{evt.rtScore ? ` · RT ${evt.rtScore}` : ''}</span>
                )}
                {(evt.type === 'skip' || evt.type === 'error') && (
                  <span className="ml-1 text-slate-400">— {evt.reason ?? evt.error}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
