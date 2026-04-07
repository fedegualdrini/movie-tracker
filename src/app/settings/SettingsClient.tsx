'use client';

import { useState, useRef } from 'react';
import { Download, Upload, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DEFAULT_PATH = 'D:\\Downloads\\Movies.xlsx';

const sectionClass = 'rounded-xl border border-slate-200 p-5 space-y-4 dark:border-slate-800';
const headingClass = 'font-semibold text-slate-800 dark:text-slate-100';
const descClass = 'text-sm text-slate-500 dark:text-slate-400';

export function SettingsClient() {
  // File upload (works everywhere — local + Railway)
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File path (local only fallback)
  const [importPath, setImportPath] = useState(DEFAULT_PATH);
  const [useUpload, setUseUpload] = useState(true);

  const [importResult, setImportResult] = useState<{ inserted: number; skipped: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  async function runImport() {
    setImporting(true);
    setImportResult(null);
    setImportError(null);

    try {
      let res: Response;

      if (useUpload) {
        if (!file) { setImportError('Please select a file first'); setImporting(false); return; }
        const formData = new FormData();
        formData.append('file', file);
        res = await fetch('/api/import', { method: 'POST', body: formData });
      } else {
        res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: importPath }),
        });
      }

      const data = await res.json() as { inserted?: number; skipped?: number; errors?: string[]; error?: string };
      if (!res.ok) { setImportError(data.error ?? 'Import failed'); return; }
      setImportResult({ inserted: data.inserted ?? 0, skipped: data.skipped ?? 0, errors: data.errors ?? [] });
    } catch {
      setImportError('Network error');
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <section className={sectionClass}>
        <h2 className={headingClass}>Import from Excel</h2>
        <p className={descClass}>Re-import your Movies.xlsx. Existing entries won&apos;t be duplicated.</p>

        {/* Mode toggle */}
        <div className="flex rounded-md border border-slate-200 overflow-hidden text-xs w-fit dark:border-slate-700">
          <button
            onClick={() => setUseUpload(true)}
            className={`px-3 py-1.5 font-medium transition-colors ${useUpload ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'}`}
          >
            Upload file
          </button>
          <button
            onClick={() => setUseUpload(false)}
            className={`px-3 py-1.5 font-medium transition-colors ${!useUpload ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'}`}
          >
            File path (local)
          </button>
        </div>

        {useUpload ? (
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <FolderOpen className="h-4 w-4" />
              {file ? file.name : 'Choose Movies.xlsx…'}
            </button>
            <Button onClick={runImport} disabled={importing || !file} variant="outline">
              <Upload className="h-4 w-4" />
              {importing ? 'Importing…' : 'Import'}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={importPath}
              onChange={(e) => setImportPath(e.target.value)}
              placeholder="Path to Movies.xlsx"
              className="font-mono text-xs"
            />
            <Button onClick={runImport} disabled={importing} variant="outline">
              <Upload className="h-4 w-4" />
              {importing ? 'Importing…' : 'Import'}
            </Button>
          </div>
        )}

        {importResult && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800 dark:bg-green-950/30 dark:border-green-900 dark:text-green-400">
            <p className="font-medium">Import complete</p>
            <p>Inserted: {importResult.inserted} · Skipped: {importResult.skipped}</p>
            {importResult.errors.length > 0 && <p className="text-red-600 mt-1">{importResult.errors.length} errors</p>}
          </div>
        )}
        {importError && <p className="text-sm text-red-500">{importError}</p>}
      </section>

      <section className={sectionClass}>
        <h2 className={headingClass}>Export to Excel</h2>
        <p className={descClass}>Download all entries as an .xlsx file organised by year and type.</p>
        <a href="/api/export" download="Movies_export.xlsx">
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Download Movies_export.xlsx
          </Button>
        </a>
      </section>
    </>
  );
}
