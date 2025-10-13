'use client';

import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { type TechniqueInfo } from '@/lib/education/technique-info';

interface TechniqueExplainerProps {
  technique: TechniqueInfo;
  children: React.ReactNode;
}

export function TechniqueExplainer({ technique, children }: TechniqueExplainerProps) {
  const categoryConfig = {
    video: {
      border: 'border-orange-500/30',
      bg: 'bg-gradient-to-br from-orange-500/10 to-red-500/10',
      badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      heading: 'text-orange-300',
      accent: 'text-orange-400',
    },
    audio: {
      border: 'border-purple-500/30',
      bg: 'bg-gradient-to-br from-purple-500/10 to-blue-500/10',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      heading: 'text-purple-300',
      accent: 'text-purple-400',
    },
    hybrid: {
      border: 'border-pink-500/30',
      bg: 'bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10',
      badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      heading: 'text-pink-300',
      accent: 'text-pink-400',
    },
  };

  const config = categoryConfig[technique.category];

  const difficultyConfig = {
    beginner: { color: 'text-green-400', label: 'Beginner-Friendly' },
    intermediate: { color: 'text-yellow-400', label: 'Intermediate' },
    advanced: { color: 'text-red-400', label: 'Advanced' },
  };

  const difficulty = difficultyConfig[technique.difficulty];

  return (
    <Popover.Root>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className={`z-50 w-[90vw] max-w-2xl overflow-hidden rounded-xl border ${config.border} ${config.bg} animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 shadow-2xl backdrop-blur-xl`}
          sideOffset={8}
          collisionPadding={16}
        >
          <div className="max-h-[80vh] overflow-y-auto p-6">
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-3xl">{technique.icon}</span>
                  <h3 className={`text-2xl font-bold ${config.heading}`}>{technique.name}</h3>
                </div>
                <p className="text-slate-300">{technique.shortDescription}</p>
              </div>
              <Popover.Close className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path
                    d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                    fill="currentColor"
                  />
                </svg>
              </Popover.Close>
            </div>

            {/* Badges */}
            <div className="mb-4 flex flex-wrap gap-2">
              <span className={`rounded-lg border px-3 py-1 text-xs font-semibold ${config.badge}`}>
                {technique.category === 'video'
                  ? '📺 Video'
                  : technique.category === 'audio'
                    ? '🎵 Audio'
                    : '🎨 Hybrid'}
              </span>
              <span
                className={`rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold ${difficulty.color}`}
              >
                {difficulty.label}
              </span>
            </div>

            {/* Full Description */}
            <div className="mb-6">
              <h4 className="mb-2 text-sm font-bold tracking-wide text-slate-400 uppercase">
                What is it?
              </h4>
              <p className="text-sm leading-relaxed text-slate-300">{technique.fullDescription}</p>
            </div>

            {/* Required Modules */}
            <div className="mb-6">
              <h4 className="mb-2 text-sm font-bold tracking-wide text-slate-400 uppercase">
                What You Need
              </h4>
              <div className="space-y-2">
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-500">Required:</p>
                  <div className="flex flex-wrap gap-2">
                    {technique.requiredModules.map((module) => (
                      <span
                        key={module}
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-slate-200"
                      >
                        {module}
                      </span>
                    ))}
                  </div>
                </div>
                {technique.optionalModules && technique.optionalModules.length > 0 ? (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-slate-500">
                      Optional (enhances the patch):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {technique.optionalModules.map((module) => (
                        <span
                          key={module}
                          className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs font-medium text-slate-400"
                        >
                          {module}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Basic Patch */}
            <div className="mb-6">
              <h4 className="mb-2 text-sm font-bold tracking-wide text-slate-400 uppercase">
                How to Patch It
              </h4>
              <div className={`rounded-lg border ${config.border} bg-black/20 p-4`}>
                <pre className="text-xs leading-relaxed whitespace-pre-wrap text-slate-300">
                  {technique.basicPatch}
                </pre>
              </div>
            </div>

            {/* Tips */}
            {technique.tips.length > 0 && (
              <div className="mb-6">
                <h4 className="mb-2 text-sm font-bold tracking-wide text-slate-400 uppercase">
                  💡 Tips
                </h4>
                <ul className="space-y-1.5">
                  {technique.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className={`mt-0.5 ${config.accent}`}>•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Examples */}
            <div className="mb-6">
              <h4 className="mb-2 text-sm font-bold tracking-wide text-slate-400 uppercase">
                Examples
              </h4>
              <div className="space-y-2">
                {technique.examples.map((example, index) => (
                  <div key={index} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-sm font-medium text-slate-200">{example}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Character Description */}
            {technique.soundCharacter || technique.visualCharacter ? (
              <div className="mb-6">
                <h4 className="mb-2 text-sm font-bold tracking-wide text-slate-400 uppercase">
                  {technique.soundCharacter ? '🎧 Sound Character' : '👁️ Visual Character'}
                </h4>
                <p className="text-sm text-slate-300 italic">
                  &ldquo;{technique.soundCharacter || technique.visualCharacter}&rdquo;
                </p>
              </div>
            ) : null}

            {/* Related Techniques */}
            {technique.relatedTechniques && technique.relatedTechniques.length > 0 ? (
              <div>
                <h4 className="mb-2 text-sm font-bold tracking-wide text-slate-400 uppercase">
                  Related Techniques
                </h4>
                <div className="flex flex-wrap gap-2">
                  {technique.relatedTechniques.map((related) => (
                    <span
                      key={related}
                      className={`rounded-lg border ${config.border} ${config.bg} px-3 py-1.5 text-xs font-medium ${config.accent}`}
                    >
                      {related.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <Popover.Arrow className="fill-slate-900" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
