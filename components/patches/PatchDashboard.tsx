'use client';

import React, { useState, useOptimistic, useTransition } from 'react';
import { type Patch } from '@/types/patch';
import { PatchGenerationForm } from './PatchGenerationForm';
import { PatchCard } from './PatchCard';
import { PatchVariationsCarousel } from './PatchVariationsCarousel';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, FormInput } from 'lucide-react';
import { useConfetti } from '@/lib/hooks/useConfetti';

export function PatchDashboard() {
  const [currentPatch, setCurrentPatch] = useState<Patch | null>(null);
  const [variations, setVariations] = useState<Patch[]>([]);
  const [adoptedVariationIndex, setAdoptedVariationIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [mode, setMode] = useState<'form' | 'chat'>('form'); // NEW: mode toggle
  const [rackUrl] = useState<string>(''); // NEW: track rack URL for chat
  const [isPending, startTransition] = useTransition();
  const { celebrate } = useConfetti();

  // React 19 optimistic UI for instant feedback
  const [optimisticPatch, setOptimisticPatch] = useOptimistic(
    currentPatch,
    (_, newPatch: Patch) => newPatch
  );

  const handlePatchGenerated = (patch: Patch, patchVariations?: Patch[]) => {
    setCurrentPatch(patch);
    setVariations(patchVariations || []);
    setError(null);
    setShowForm(false); // Hide form after successful generation

    // 🎉 CELEBRATE!
    celebrate();
  };

  const handleChatPatchGenerated = (patch: Patch) => {
    setCurrentPatch(patch);
    setError(null);
    setShowForm(false);

    // 🎉 CELEBRATE!
    celebrate();
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleGenerateAnother = () => {
    setShowForm(true);
    setCurrentPatch(null);
    setVariations([]);
    setAdoptedVariationIndex(null);
    setError(null);
  };

  /**
   * Adopt a variation - Replace main patch with selected variation
   * Uses React 19 optimistic UI for instant feedback
   */
  const handleAdoptVariation = (variation: Patch, index: number) => {
    // Optimistically update the UI immediately
    startTransition(() => {
      setOptimisticPatch(variation);
    });

    // Actually update the state
    setCurrentPatch(variation);
    setAdoptedVariationIndex(index);

    // Optional: Save to database in background
    // This could be a server action or API call
    // For now, we just update local state
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

      {/* Mode Toggle */}
      {showForm ? (
        <div className="flex justify-center">
          <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1 backdrop-blur-sm">
            <button
              onClick={() => setMode('form')}
              className={`flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all ${
                mode === 'form'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FormInput className="h-5 w-5" />
              Form Mode
            </button>
            <button
              onClick={() => setMode('chat')}
              className={`flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all ${
                mode === 'chat'
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              Chat Mode
            </button>
          </div>
        </div>
      ) : null}

      {/* Generation Form or Chat Interface */}
      {showForm ? (
        <AnimatePresence mode="wait">
          {mode === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-8 backdrop-blur-sm"
            >
              <div className="mb-6">
                <h2 className="mb-2 text-3xl font-bold text-white">🎨 Generate a Patch</h2>
                <p className="text-slate-300">
                  Fill in the details and we&apos;ll design a custom patch for your rack
                </p>
              </div>
              <PatchGenerationForm onPatchGenerated={handlePatchGenerated} onError={handleError} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 p-8 backdrop-blur-sm"
            >
              <div className="mb-6">
                <h2 className="mb-2 text-3xl font-bold text-white">💬 Chat with Your Assistant</h2>
                <p className="text-slate-300">
                  Have a natural conversation about what you want to create
                </p>
              </div>
              <ChatInterface rackUrl={rackUrl} onPatchGenerated={handleChatPatchGenerated} />
            </motion.div>
          )}
        </AnimatePresence>
      ) : null}

      {/* Generated Patch Display */}
      {currentPatch ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              ✨ {adoptedVariationIndex !== null ? 'Adopted Variation' : 'Your Generated Patch'}
            </h2>
            <button
              onClick={handleGenerateAnother}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
            >
              Generate Another
            </button>
          </div>

          {/* Main Patch Card with optimistic updates */}
          <AnimatePresence mode="wait">
            <motion.div
              key={optimisticPatch?.id || currentPatch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PatchCard patch={optimisticPatch || currentPatch} />
            </motion.div>
          </AnimatePresence>

          {/* Variations Carousel */}
          {variations.length > 0 && (
            <PatchVariationsCarousel
              variations={variations}
              onAdoptVariation={handleAdoptVariation}
              adoptedIndex={adoptedVariationIndex}
            />
          )}

          {/* Loading indicator for pending transitions */}
          {isPending ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed right-8 bottom-8 rounded-full bg-purple-500 px-6 py-3 text-white shadow-lg"
            >
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span className="font-semibold">Switching patch...</span>
              </div>
            </motion.div>
          ) : null}
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
