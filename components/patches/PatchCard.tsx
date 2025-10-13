'use client';

import React, { useState, useRef } from 'react';
import { type Patch } from '@/types/patch';
import { Download, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PatchCardProps {
  patch: Patch;
}

export function PatchCard({ patch }: PatchCardProps) {
  const { metadata, connections, parameterSuggestions, whyThisWorks, tips, diagramData } = patch;
  const [showDiagramFullscreen, setShowDiagramFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Determine rack type (with fallback for old patches)
  const rackType = metadata.rackType || 'audio';

  // Export to PNG using modern approach
  const exportToPNG = async () => {
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      if (!cardRef.current) return;

      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      if (!cardRef.current) return;

      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Rack type configuration
  const rackTypeConfig = {
    video: {
      badge: '🎬 Video Synthesis',
      gradient: 'from-slate-900/90 to-orange-900/50',
      borderColor: 'border-orange-500/20',
      accentColor: 'text-orange-300',
      connectionColor: 'border-orange-500/30 bg-orange-500/5',
    },
    audio: {
      badge: '🎵 Audio Synthesis',
      gradient: 'from-slate-900/90 to-purple-900/50',
      borderColor: 'border-purple-500/20',
      accentColor: 'text-purple-300',
      connectionColor: 'border-purple-500/30 bg-purple-500/5',
    },
    hybrid: {
      badge: '🎨 Hybrid A/V',
      gradient: 'from-slate-900/90 via-purple-900/50 to-orange-900/50',
      borderColor: 'border-pink-500/20',
      accentColor: 'text-pink-300',
      connectionColor: 'border-pink-500/30 bg-pink-500/5',
    },
  };

  const config = rackTypeConfig[rackType];

  // Difficulty color mapping
  const difficultyColors = {
    beginner: 'bg-green-500/20 text-green-300 border-green-500/30',
    intermediate: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    advanced: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  // Check if first step mentions sync (for video patches)
  const isSyncDistributionStep = (step: string) => {
    const lowerStep = step.toLowerCase();
    return (
      lowerStep.includes('sync') &&
      (lowerStep.includes('distribute') || lowerStep.includes('step 1'))
    );
  };

  return (
    <div
      ref={cardRef}
      className={`rounded-2xl border ${config.borderColor} bg-gradient-to-br ${config.gradient} p-8 backdrop-blur-sm`}
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-3">
            <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
              {config.badge}
            </span>
          </div>
          <h2 className="mb-2 text-3xl font-bold text-white">{metadata.title}</h2>
          <p className="text-lg text-slate-300">{metadata.description}</p>
          {metadata.soundDescription ? (
            <p className={`mt-2 italic ${config.accentColor}`}>
              {rackType === 'video' ? '🎬' : '🎵'} {metadata.soundDescription}
            </p>
          ) : null}
        </div>
      </div>

      {/* Metadata Pills */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${difficultyColors[metadata.difficulty]}`}
        >
          {metadata.difficulty.toUpperCase()}
        </div>
        <div className="rounded-full border border-blue-500/30 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-300">
          ⏱️ {metadata.estimatedTime} min
        </div>
      </div>

      {/* Tags */}
      <div className="mb-8 flex flex-wrap gap-2">
        {metadata.techniques.map((technique) => (
          <span
            key={technique}
            className="rounded-lg bg-purple-500/20 px-3 py-1 text-sm text-purple-200"
          >
            {technique}
          </span>
        ))}
        {metadata.genres.map((genre) => (
          <span key={genre} className="rounded-lg bg-pink-500/20 px-3 py-1 text-sm text-pink-200">
            {genre}
          </span>
        ))}
      </div>

      {/* AI-Generated Diagram (October 2025 - Gemini Integration) */}
      {diagramData ? (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">🎨 Patch Diagram</h3>
            <button
              onClick={() => setShowDiagramFullscreen(true)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-all hover:bg-white/10"
              aria-label="View diagram fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
            {/* Base64 data URI - Next.js Image doesn't support this */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${diagramData}`}
              alt={`Patch diagram for ${metadata.title}`}
              className="h-auto w-full"
            />
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            ✨ AI-generated diagram • Color-coded cables • Professional quality
          </p>

          {/* Fullscreen Modal */}
          <AnimatePresence>
            {showDiagramFullscreen ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDiagramFullscreen(false)}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
              >
                {/* Base64 data URI - Next.js Image doesn't support this */}
                {}
                <motion.img
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                  src={`data:image/png;base64,${diagramData}`}
                  alt={`Patch diagram for ${metadata.title}`}
                  className="max-h-[90vh] max-w-[90vw] rounded-xl"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={() => setShowDiagramFullscreen(false)}
                  className="absolute top-4 right-4 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/20"
                  aria-label="Close fullscreen"
                >
                  ✕
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}

      {/* Patching Order (emphasize sync for video) */}
      {patch.patchingOrder && patch.patchingOrder.length > 0 ? (
        <div className="mb-8">
          <h3 className="mb-4 text-xl font-bold text-white">📋 Patching Order</h3>
          <div className="space-y-2">
            {patch.patchingOrder.map((step, index) => {
              const isSyncStep = isSyncDistributionStep(step);
              return (
                <div
                  key={index}
                  className={`rounded-lg border p-3 ${
                    isSyncStep && rackType !== 'audio'
                      ? 'border-orange-500/50 bg-orange-500/10'
                      : 'border-white/10 bg-black/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isSyncStep && rackType !== 'audio'
                          ? 'bg-orange-500 text-white'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <p className="flex-1 text-sm text-slate-200">
                      {isSyncStep && rackType !== 'audio' ? <span className="mr-1">⚡</span> : null}
                      {step}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Cable Connections */}
      <div className="mb-8">
        <h3 className="mb-4 text-xl font-bold text-white">🔌 Cable Routing</h3>
        <div className="space-y-3">
          {connections.map((connection, index) => (
            <div
              key={connection.id}
              className={`rounded-xl border ${config.connectionColor} hover:border-opacity-50 p-4 transition-all hover:bg-black/50`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${
                    rackType === 'video'
                      ? 'from-orange-500 to-red-500'
                      : rackType === 'hybrid'
                        ? 'from-purple-500 to-orange-500'
                        : 'from-purple-500 to-pink-500'
                  } text-sm font-bold text-white`}
                >
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-cyan-300">
                      {connection.from.moduleName}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">{connection.from.outputName}</span>
                    <span className={config.accentColor}>→</span>
                    <span className="font-semibold text-pink-300">{connection.to.moduleName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">{connection.to.inputName}</span>
                  </div>
                  {connection.note ? (
                    <p className="mt-1 text-xs text-slate-400 italic">{connection.note}</p>
                  ) : null}
                </div>
                <span className="flex-shrink-0 text-xs text-slate-500">
                  {connection.signalType}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parameter Suggestions */}
      {parameterSuggestions.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-xl font-bold text-white">🎛️ Knob Positions</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {parameterSuggestions.map((param, index) => (
              <div key={index} className="rounded-xl border border-white/5 bg-black/30 p-4">
                <div className="mb-1 font-semibold text-purple-300">{param.moduleName}</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{param.parameter}</span>
                  <span className="rounded-full bg-purple-500/20 px-3 py-1 text-sm font-semibold text-purple-200">
                    {param.value}
                  </span>
                </div>
                {param.reasoning ? (
                  <p className="mt-2 text-xs text-slate-400 italic">{param.reasoning}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why This Works */}
      <div className="mb-8 rounded-xl border border-purple-500/20 bg-purple-500/10 p-6">
        <h3 className="mb-3 text-xl font-bold text-white">💡 Why This Works</h3>
        <p className="leading-relaxed text-slate-300">{whyThisWorks}</p>
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-xl font-bold text-white">✨ Pro Tips</h3>
          <ul className="space-y-2">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-3 text-slate-300">
                <span className="text-purple-400">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button className="flex-1 rounded-xl bg-purple-500 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50">
          Save to Cookbook
        </button>
        <button
          onClick={exportToPDF}
          disabled={isExporting}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Export PDF</span>
            </>
          )}
        </button>
        <button
          onClick={exportToPNG}
          disabled={isExporting}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Export as PNG"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">PNG</span>
        </button>
      </div>
    </div>
  );
}
