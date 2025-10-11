'use client';

import React, { useState } from 'react';
import { type Patch } from '@/types/patch';
import { PatchGenerationForm } from './PatchGenerationForm';
import { PatchCard } from './PatchCard';

export function PatchDashboard() {
  const [currentPatch, setCurrentPatch] = useState<Patch | null>(null);
  const [variations, setVariations] = useState<Patch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  const handlePatchGenerated = (patch: Patch, patchVariations?: Patch[]) => {
    setCurrentPatch(patch);
    setVariations(patchVariations || []);
    setError(null);
    setShowForm(false); // Hide form after successful generation
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleGenerateAnother = () => {
    setShowForm(true);
    setCurrentPatch(null);
    setVariations([]);
    setError(null);
  };

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-red-300">Error</h3>
              <p className="text-sm text-red-200">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-red-200">
              ✕
            </button>
          </div>
        </div>
      ) : null}

      {/* Generation Form */}
      {showForm ? (
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-8 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="mb-2 text-3xl font-bold text-white">🎨 Generate a Patch</h2>
            <p className="text-slate-300">Tell us about your rack and what you want to create</p>
          </div>
          <PatchGenerationForm onPatchGenerated={handlePatchGenerated} onError={handleError} />
        </div>
      ) : null}

      {/* Generated Patch Display */}
      {currentPatch ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">✨ Your Generated Patch</h2>
            <button
              onClick={handleGenerateAnother}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
            >
              Generate Another
            </button>
          </div>

          <PatchCard patch={currentPatch} />

          {/* Variations */}
          {variations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">🔄 Variations</h3>
              <div className="grid gap-6 lg:grid-cols-2">
                {variations.map((variation, index) => (
                  <div key={variation.id} className="space-y-2">
                    <div className="text-sm font-semibold text-purple-300">
                      Variation {index + 1}
                    </div>
                    <PatchCard patch={variation} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Empty State (when no patch and form is hidden) */}
      {!showForm && !currentPatch && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-12 text-center backdrop-blur-sm">
          <div className="mb-4 text-6xl">🎸</div>
          <h3 className="mb-2 text-xl font-bold text-white">Ready to create?</h3>
          <p className="mb-6 text-slate-300">Generate your first AI-powered patch</p>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-purple-500 px-8 py-3 font-semibold text-white transition-all hover:bg-purple-600"
          >
            Get Started
          </button>
        </div>
      )}
    </div>
  );
}
