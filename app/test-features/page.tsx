'use client';

import React, { useState } from 'react';
import { VideoSynthesisGuideModal } from '@/components/education/VideoSynthesisGuideModal';
import { RackAnalysisCard } from '@/components/racks/RackAnalysisCard';
import { type RackCapabilities, type RackAnalysis } from '@/types/rack';

// Demo data for testing
const demoCapabilities: RackCapabilities = {
  hasVCO: true,
  hasVCF: true,
  hasVCA: true,
  hasEnvelope: true,
  hasLFO: true,
  hasSequencer: true,
  hasEffects: false,
  hasVideoSync: true,
  hasRampGenerator: true,
  hasVideoEncoder: true,
  hasVideoDecoder: false,
  hasColorizer: true,
  hasKeyer: false,
  isVideoRack: true,
  isHybridRack: true,
  moduleTypes: [
    'VCO',
    'VCF',
    'VCA',
    'EG',
    'LFO',
    'Sequencer',
    'SyncGenerator',
    'RampGenerator',
    'VideoEncoder',
    'Colorizer',
  ],
  totalHP: 208,
  totalPowerDraw: {
    positive12V: 1500,
    negative12V: 800,
    positive5V: 0,
  },
};

const demoAnalysis: RackAnalysis = {
  techniquesPossible: [
    'Geometric Patterns',
    'Ramp Multiplication',
    'Color Modulation',
    'Modulation Mapping',
    'FM Synthesis',
    'Subtractive Synthesis',
  ],
  missingFundamentals: [],
  suggestions: ['This rack is ready for video synthesis exploration!'],
  warnings: [],
};

const demoModules = [
  {
    id: 'lzx-esg3',
    name: 'ESG3',
    manufacturer: 'LZX Industries',
    type: 'SyncGenerator' as const,
    hp: 12,
    power: { positive12V: 150, negative12V: 50 },
    inputs: [],
    outputs: [],
  },
  {
    id: 'syntonie-rampes',
    name: 'Rampes',
    manufacturer: 'Syntonie',
    type: 'RampGenerator' as const,
    hp: 14,
    power: { positive12V: 120, negative12V: 50 },
    inputs: [],
    outputs: [],
  },
  {
    id: 'maths',
    name: 'Maths',
    manufacturer: 'Make Noise',
    type: 'Utility' as const,
    hp: 20,
    power: { positive12V: 60, negative12V: 60 },
    inputs: [],
    outputs: [],
  },
  {
    id: 'vco-1',
    name: 'Dixie II+',
    manufacturer: 'Intellijel',
    type: 'VCO' as const,
    hp: 12,
    power: { positive12V: 85, negative12V: 75 },
    inputs: [],
    outputs: [],
  },
  {
    id: 'vco-2',
    name: 'Plaits',
    manufacturer: 'Mutable Instruments',
    type: 'VCO' as const,
    hp: 12,
    power: { positive12V: 60, negative12V: 5 },
    inputs: [],
    outputs: [],
  },
  {
    id: 'vcf',
    name: 'Ripples',
    manufacturer: 'Mutable Instruments',
    type: 'VCF' as const,
    hp: 8,
    power: { positive12V: 70, negative12V: 70 },
    inputs: [],
    outputs: [],
  },
  {
    id: 'vca',
    name: 'Veils',
    manufacturer: 'Mutable Instruments',
    type: 'VCA' as const,
    hp: 10,
    power: { positive12V: 90, negative12V: 90 },
    inputs: [],
    outputs: [],
  },
  {
    id: 'envelope',
    name: 'Quadra',
    manufacturer: 'Intellijel',
    type: 'EG' as const,
    hp: 12,
    power: { positive12V: 120, negative12V: 100 },
    inputs: [],
    outputs: [],
  },
];

export default function TestFeaturesPage() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">Phase 2 Features Test Page</h1>
          <p className="text-slate-300">Testing all educational features without authentication</p>
        </div>

        {/* Task 1: Video Synthesis Guide Modal */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-2xl font-bold text-white">
            ✅ Task 1: Video Synthesis Guide Modal
          </h2>
          <p className="mb-4 text-slate-300">
            Comprehensive educational modal with 5 tabs explaining video synthesis concepts.
          </p>
          <button
            onClick={() => setIsGuideOpen(true)}
            className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-6 py-3 font-semibold text-orange-300 transition-all hover:border-orange-500/50 hover:bg-orange-500/20"
          >
            📺 Open Video Synthesis Guide
          </button>
        </div>

        {/* Task 2: Interactive Tooltips + Task 3: Smart Suggestions + Task 4: Technique Explainers */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-2xl font-bold text-white">
            ✅ Tasks 2, 3, & 4: Rack Analysis with Tooltips & Clickable Techniques
          </h2>
          <p className="mb-4 text-slate-300">
            Hover over capability items and module types to see tooltips. Click technique pills for
            detailed explainers.
          </p>
          <RackAnalysisCard
            capabilities={demoCapabilities}
            analysis={demoAnalysis}
            modules={demoModules}
            rackName="Demo Hybrid System"
            moduleCount={demoModules.length}
          />
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6">
          <h3 className="mb-2 text-xl font-bold text-green-300">🎉 All Features Implemented!</h3>
          <ul className="space-y-2 text-slate-300">
            <li>
              ✅ <strong>Task 1:</strong> Video Synthesis Guide Modal (5 tabs, comprehensive
              education)
            </li>
            <li>
              ✅ <strong>Task 2:</strong> Interactive Module Tooltips (25+ module types with rich
              content)
            </li>
            <li>
              ✅ <strong>Task 3:</strong> Smart Intent Suggestions (contextual patch ideas)
            </li>
            <li>
              ✅ <strong>Task 4:</strong> Technique Explainers (16 techniques with full details)
            </li>
          </ul>
          <p className="mt-4 text-sm text-slate-400">
            Phase 2: 80% Complete (core features done, optional animations/reference card remaining)
          </p>
        </div>
      </div>

      {/* Modals */}
      <VideoSynthesisGuideModal open={isGuideOpen} onOpenChange={setIsGuideOpen} />
    </div>
  );
}
