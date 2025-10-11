'use client';

import React from 'react';
import { type Patch } from '@/types/patch';

interface PatchCardProps {
  patch: Patch;
}

export function PatchCard({ patch }: PatchCardProps) {
  const { metadata, connections, parameterSuggestions, whyThisWorks, tips } = patch;

  // Difficulty color mapping
  const difficultyColors = {
    beginner: 'bg-green-500/20 text-green-300 border-green-500/30',
    intermediate: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    advanced: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-purple-900/50 p-8 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex-1">
          <h2 className="mb-2 text-3xl font-bold text-white">{metadata.title}</h2>
          <p className="text-lg text-slate-300">{metadata.description}</p>
          {metadata.soundDescription ? (
            <p className="mt-2 text-purple-300 italic">🎵 {metadata.soundDescription}</p>
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

      {/* Cable Connections */}
      <div className="mb-8">
        <h3 className="mb-4 text-xl font-bold text-white">🔌 Cable Routing</h3>
        <div className="space-y-3">
          {connections.map((connection, index) => (
            <div
              key={connection.id}
              className="rounded-xl border border-white/5 bg-black/30 p-4 transition-all hover:border-purple-500/30 hover:bg-black/50"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-cyan-300">
                      {connection.from.moduleName}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">{connection.from.outputName}</span>
                    <span className="text-purple-400">→</span>
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
      <div className="flex gap-3">
        <button className="flex-1 rounded-xl bg-purple-500 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:bg-purple-600">
          Save to Cookbook
        </button>
        <button className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10">
          Export PDF
        </button>
      </div>
    </div>
  );
}
