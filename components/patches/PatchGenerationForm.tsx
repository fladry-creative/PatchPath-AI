'use client';

import { useState } from 'react';
import { type Patch } from '@/types/patch';

interface PatchGenerationFormProps {
  onPatchGenerated: (patch: Patch, variations?: Patch[]) => void;
  onError: (error: string) => void;
}

export function PatchGenerationForm({ onPatchGenerated, onError }: PatchGenerationFormProps) {
  const [rackUrl, setRackUrl] = useState('');
  const [intent, setIntent] = useState('');
  const [technique, setTechnique] = useState('');
  const [genre, setGenre] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>(
    'intermediate'
  );
  const [generateVariations, setGenerateVariations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rackUrl.trim() || !intent.trim()) {
      onError('Please provide both a rack URL and describe what you want to create');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/patches/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rackUrl: rackUrl.trim(),
          intent: intent.trim(),
          technique: technique.trim() || undefined,
          genre: genre.trim() || undefined,
          difficulty,
          generateVariations,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate patch');
      }

      onPatchGenerated(data.patch, data.variations);

      // Optionally reset form
      // setIntent('');
      // setTechnique('');
      // setGenre('');
    } catch (error) {
      console.error('Patch generation error:', error);
      onError(error instanceof Error ? error.message : 'Failed to generate patch');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rack URL */}
      <div>
        <label htmlFor="rackUrl" className="mb-2 block text-sm font-semibold text-slate-200">
          ModularGrid Rack URL
        </label>
        <input
          id="rackUrl"
          type="url"
          value={rackUrl}
          onChange={(e) => setRackUrl(e.target.value)}
          placeholder="https://modulargrid.net/e/racks/view/..."
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          disabled={isLoading}
        />
        <p className="mt-1 text-xs text-slate-400">
          Paste your ModularGrid rack URL (we&apos;ll analyze your modules)
        </p>
      </div>

      {/* Intent */}
      <div>
        <label htmlFor="intent" className="mb-2 block text-sm font-semibold text-slate-200">
          What do you want to create?
        </label>
        <textarea
          id="intent"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="e.g., Dark ambient drone with evolving textures, rhythmic techno bassline, experimental generative sequence..."
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          disabled={isLoading}
        />
      </div>

      {/* Optional Fields */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Technique */}
        <div>
          <label htmlFor="technique" className="mb-2 block text-sm font-semibold text-slate-200">
            Technique (optional)
          </label>
          <input
            id="technique"
            type="text"
            value={technique}
            onChange={(e) => setTechnique(e.target.value)}
            placeholder="e.g., FM, waveshaping"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            disabled={isLoading}
          />
        </div>

        {/* Genre */}
        <div>
          <label htmlFor="genre" className="mb-2 block text-sm font-semibold text-slate-200">
            Genre (optional)
          </label>
          <input
            id="genre"
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="e.g., techno, ambient"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            disabled={isLoading}
          />
        </div>

        {/* Difficulty */}
        <div>
          <label htmlFor="difficulty" className="mb-2 block text-sm font-semibold text-slate-200">
            Difficulty
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')
            }
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            disabled={isLoading}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Generate Variations */}
      <div className="flex items-center gap-3">
        <input
          id="variations"
          type="checkbox"
          checked={generateVariations}
          onChange={(e) => setGenerateVariations(e.target.checked)}
          className="h-5 w-5 rounded border-white/10 bg-black/30 text-purple-500 focus:ring-2 focus:ring-purple-500/50"
          disabled={isLoading}
        />
        <label htmlFor="variations" className="text-sm text-slate-200">
          Generate 3 variations (takes a bit longer)
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !rackUrl.trim() || !intent.trim()}
        className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 text-lg font-bold text-white transition-all hover:from-purple-600 hover:to-pink-600 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-3">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></span>
            Generating Patch...
          </span>
        ) : (
          '🎨 Generate Patch'
        )}
      </button>

      {/* Demo Link */}
      <div className="text-center">
        <button
          type="button"
          onClick={() =>
            setRackUrl('https://modulargrid.net/e/racks/view/2383104')
          }
          className="text-sm text-purple-400 hover:text-purple-300 hover:underline"
          disabled={isLoading}
        >
          Use demo rack for testing
        </button>
      </div>
    </form>
  );
}
