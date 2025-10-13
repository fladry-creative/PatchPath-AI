'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { type Patch } from '@/types/patch';
import { type RackCapabilities, type RackAnalysis } from '@/types/rack';
import { type Module } from '@/types/module';
import { RackAnalysisCard } from '@/components/racks/RackAnalysisCard';

interface PatchGenerationFormProps {
  onPatchGenerated: (patch: Patch, variations?: Patch[]) => void;
  onError: (error: string) => void;
}

interface RackAnalysisData {
  capabilities: RackCapabilities;
  analysis: RackAnalysis;
  modules: Module[];
  rack: {
    name?: string;
    moduleCount: number;
  };
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
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  const [isAnalyzingRack, setIsAnalyzingRack] = useState(false);
  const [rackAnalysis, setRackAnalysis] = useState<RackAnalysisData | null>(null);

  // Analyze rack when URL changes (with debouncing)
  const analyzeRack = useCallback(async (url: string) => {
    if (!url || !url.includes('modulargrid.net')) {
      setRackAnalysis(null);
      return;
    }

    setIsAnalyzingRack(true);
    try {
      const response = await fetch('/api/racks/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success) {
        setRackAnalysis({
          capabilities: data.capabilities,
          analysis: data.analysis,
          modules: data.modules,
          rack: data.rack,
        });
      } else {
        setRackAnalysis(null);
      }
    } catch (error) {
      console.error('Rack analysis error:', error);
      setRackAnalysis(null);
    } finally {
      setIsAnalyzingRack(false);
    }
  }, []);

  // Debounced rack analysis effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (rackUrl.trim()) {
        analyzeRack(rackUrl.trim());
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [rackUrl, analyzeRack]);

  const handleRandomRack = async () => {
    setIsLoadingRandom(true);
    try {
      const response = await fetch('/api/racks/random');
      const data = await response.json();

      if (data.success) {
        setRackUrl(data.rack.url);
      } else {
        onError(data.message || 'Failed to load random rack');
      }
    } catch (error) {
      console.error('Random rack error:', error);
      onError('Failed to load random rack');
    } finally {
      setIsLoadingRandom(false);
    }
  };

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

  // Dynamic placeholder based on rack type
  const getIntentPlaceholder = () => {
    if (!rackAnalysis) {
      return 'e.g., Dark ambient drone with evolving textures, rhythmic techno bassline, experimental generative sequence...';
    }

    if (rackAnalysis.capabilities.isVideoRack) {
      return 'e.g., Create geometric color patterns with feedback, animated vertical bars with horizontal scan manipulation...';
    }

    if (rackAnalysis.capabilities.isHybridRack) {
      return 'e.g., Audio-visual cross-modulation experiment, use audio VCO to modulate video colorizer for glitchy effects...';
    }

    return 'e.g., Dark ambient drone with evolving textures, rhythmic techno bassline, experimental generative sequence...';
  };

  // Generate smart intent suggestions based on rack capabilities
  const getIntentSuggestions = (): string[] => {
    if (!rackAnalysis) return [];

    const { capabilities, analysis } = rackAnalysis;
    const suggestions: string[] = [];

    // VIDEO RACK SUGGESTIONS
    if (capabilities.isVideoRack) {
      if (capabilities.hasRampGenerator && capabilities.hasColorizer) {
        suggestions.push('Create geometric color patterns with ramp multiplication');
      }
      if (capabilities.hasKeyer && capabilities.hasRampGenerator) {
        suggestions.push('Multi-layer video composition with luminance keying');
      }
      if (capabilities.hasVideoDecoder) {
        suggestions.push('Process external camera feed with feedback effects');
      }
      if (
        capabilities.hasRampGenerator &&
        capabilities.videoModuleTypes?.includes('VideoProcessor')
      ) {
        suggestions.push('Raster manipulation with feedback loops and evolving patterns');
      }
      if (capabilities.hasColorizer) {
        suggestions.push('Animated color gradients with voltage-controlled hue shifts');
      }
    }

    // HYBRID RACK SUGGESTIONS
    if (capabilities.isHybridRack) {
      suggestions.push('Audio-visual cross-modulation: LFO controls video ramp speed');
      if (capabilities.hasEnvelope) {
        suggestions.push('Use audio envelope to gate video colorizer on/off');
      }
      if (capabilities.hasVCO) {
        suggestions.push('Audio oscillator modulates video for glitchy hard-edge effects');
      }
      if (capabilities.hasSequencer) {
        suggestions.push('Synchronized audio melody with triggered video pattern changes');
      }
    }

    // AUDIO RACK SUGGESTIONS
    if (!capabilities.isVideoRack && !capabilities.isHybridRack) {
      if (capabilities.hasSequencer && capabilities.hasVCF) {
        suggestions.push('Generative melodic sequence with evolving filter sweeps');
      }
      if (capabilities.hasVCO && capabilities.hasVCF && capabilities.hasEffects) {
        suggestions.push('Complex ambient texture with layered effects processing');
      }
      if (capabilities.hasSequencer) {
        suggestions.push('Rhythmic techno pattern with modulated parameters');
      }
      if (capabilities.hasLFO && capabilities.hasVCF) {
        suggestions.push('Deep bass drone with slow filter modulation');
      }
      if (capabilities.moduleTypes.includes('Random')) {
        suggestions.push('Chaotic generative patch with random modulation sources');
      }
    }

    // MISSING FUNDAMENTALS - suggest workarounds
    if (analysis.missingFundamentals.includes('VCO') && capabilities.hasLFO) {
      suggestions.push('Use LFO as audio-rate oscillator for experimental tones');
    }

    return suggestions.slice(0, 5); // Max 5 suggestions
  };

  const intentSuggestions = getIntentSuggestions();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Vision Upload CTA */}
      <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-white">📸 NEW: Upload Rack Photo</h3>
            <p className="mt-1 text-sm text-slate-400">
              Don&apos;t have a ModularGrid URL? Upload a photo of your rack and let AI identify all
              modules!
            </p>
          </div>
          <a
            href="/vision-upload"
            className="flex-shrink-0 rounded-lg border border-blue-500/50 bg-blue-500/20 px-4 py-2 text-sm font-bold text-blue-300 transition-all hover:scale-105 hover:border-blue-500 hover:bg-blue-500/30"
          >
            Upload Photo →
          </a>
        </div>
      </div>

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
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
          disabled={isLoading || isLoadingRandom}
        />
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Paste your ModularGrid rack URL (we&apos;ll analyze your modules with AI vision)
            </p>
            <button
              type="button"
              onClick={handleRandomRack}
              disabled={isLoading || isLoadingRandom}
              className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 transition-all hover:border-purple-500/50 hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoadingRandom ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border border-purple-300/20 border-t-purple-300"></span>
                  Loading...
                </>
              ) : (
                <>
                  <span>🎲</span>
                  Try Random Rack
                </>
              )}
            </button>
          </div>

          {/* NEW: Help text for both URL formats */}
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer hover:text-slate-400">
              ℹ️ Supported URL formats
            </summary>
            <div className="mt-2 space-y-1 pl-4">
              <div>
                <strong className="text-slate-400">Rack page:</strong>
                <code className="ml-2 rounded bg-black/30 px-2 py-0.5 text-[10px]">
                  https://modulargrid.net/e/racks/view/[ID]
                </code>
              </div>
              <div>
                <strong className="text-slate-400">CDN image (faster):</strong>
                <code className="ml-2 rounded bg-black/30 px-2 py-0.5 text-[10px]">
                  https://cdn.modulargrid.net/img/racks/modulargrid_[ID].jpg
                </code>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                💡 Tip: Right-click your rack image on ModularGrid and select &quot;Copy Image
                Address&quot; for the CDN URL (10x faster!)
              </p>
            </div>
          </details>
        </div>
      </div>

      {/* Rack Analysis Card */}
      {isAnalyzingRack ? (
        <div className="rounded-xl border border-white/10 bg-black/20 p-8 text-center backdrop-blur-sm">
          <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-2 border-purple-300/20 border-t-purple-300"></div>
          <p className="text-sm text-slate-400">Analyzing your rack...</p>
        </div>
      ) : null}

      {rackAnalysis && !isAnalyzingRack ? (
        <RackAnalysisCard
          capabilities={rackAnalysis.capabilities}
          analysis={rackAnalysis.analysis}
          modules={rackAnalysis.modules}
          rackName={rackAnalysis.rack.name}
          moduleCount={rackAnalysis.rack.moduleCount}
        />
      ) : null}

      {/* Intent */}
      <div>
        <label htmlFor="intent" className="mb-2 block text-sm font-semibold text-slate-200">
          What do you want to create?
        </label>
        <textarea
          id="intent"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder={getIntentPlaceholder()}
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
          disabled={isLoading || isLoadingRandom}
        />

        {/* Smart Intent Suggestions */}
        {intentSuggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold text-slate-400">💡 Try these ideas:</p>
            <div className="flex flex-wrap gap-2">
              {intentSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setIntent(suggestion)}
                  className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-sm text-purple-300 transition-all hover:scale-105 hover:border-purple-500/50 hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading || isLoadingRandom}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
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
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
            disabled={isLoading || isLoadingRandom}
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
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
            disabled={isLoading || isLoadingRandom}
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
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
            disabled={isLoading || isLoadingRandom}
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
          disabled={isLoading || isLoadingRandom}
        />
        <label htmlFor="variations" className="text-sm text-slate-200">
          Generate 3 variations (takes a bit longer)
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || isLoadingRandom || !rackUrl.trim() || !intent.trim()}
        className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 text-lg font-bold text-white transition-all hover:scale-105 hover:from-purple-600 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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
          onClick={() => setRackUrl('https://modulargrid.net/e/racks/view/2383104')}
          className="text-sm text-purple-400 hover:text-purple-300 hover:underline"
          disabled={isLoading || isLoadingRandom}
        >
          Use demo rack for testing
        </button>
      </div>
    </form>
  );
}
