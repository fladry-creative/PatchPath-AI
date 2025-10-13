'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';

interface VideoSynthesisGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabId = 'overview' | 'sync' | 'ramps' | 'voltage' | 'workflow';

export function VideoSynthesisGuideModal({ open, onOpenChange }: VideoSynthesisGuideModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📺' },
    { id: 'sync', label: 'Sync is Critical', icon: '⚡' },
    { id: 'ramps', label: 'Horizontal vs Vertical', icon: '📊' },
    { id: 'voltage', label: 'Voltage Ranges', icon: '🔌' },
    { id: 'workflow', label: 'Signal Flow', icon: '🔄' },
  ];

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="📺 Video Synthesis Guide"
      description="Learn the fundamentals of modular video synthesis"
      size="xl"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'border border-orange-500/50 bg-orange-500/20 text-orange-300'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px] text-slate-300">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'sync' && <SyncTab />}
          {activeTab === 'ramps' && <RampsTab />}
          {activeTab === 'voltage' && <VoltageTab />}
          {activeTab === 'workflow' && <WorkflowTab />}
        </div>

        {/* Footer */}
        <div className="mt-8 rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
          <p className="text-sm text-slate-300">
            📚 <strong>Want to dive deeper?</strong> Check out our comprehensive{' '}
            <a
              href="/docs/VIDEO_SYNTHESIS.md"
              target="_blank"
              className="text-purple-300 underline hover:text-purple-200"
            >
              Video Synthesis Documentation
            </a>
          </p>
        </div>
      </div>
    </Modal>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-2xl font-bold text-white">What is Video Synthesis?</h3>
        <p className="mb-4 leading-relaxed">
          Video synthesis is the generation of electronic video signals using modular synthesizers.
          Unlike audio synthesis (which generates sound), video synthesis creates moving images and
          visual patterns in real-time.
        </p>
      </div>

      <div>
        <h4 className="mb-3 text-lg font-semibold text-orange-300">
          Key Differences from Audio Synthesis
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left font-semibold text-white">Aspect</th>
                <th className="px-4 py-3 text-left font-semibold text-cyan-300">Audio Synthesis</th>
                <th className="px-4 py-3 text-left font-semibold text-orange-300">
                  Video Synthesis
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <td className="px-4 py-3 font-medium">Voltage Range</td>
                <td className="px-4 py-3">±5V bipolar</td>
                <td className="px-4 py-3">0-1V unipolar (LZX standard)</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="px-4 py-3 font-medium">Frequency</td>
                <td className="px-4 py-3">20 Hz - 20 kHz</td>
                <td className="px-4 py-3">~400 kHz (horizontal scan)</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="px-4 py-3 font-medium">Sync</td>
                <td className="px-4 py-3">Optional (free-running)</td>
                <td className="px-4 py-3">
                  <span className="font-bold text-red-400">MANDATORY</span>
                </td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="px-4 py-3 font-medium">Dimensions</td>
                <td className="px-4 py-3">1D (time)</td>
                <td className="px-4 py-3">2D (horizontal + vertical)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Core Module</td>
                <td className="px-4 py-3">VCO (oscillator)</td>
                <td className="px-4 py-3">Ramp Generator</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
        <p className="text-sm">
          <strong className="text-orange-300">💡 Key Takeaway:</strong> Video synthesis operates at
          much higher frequencies with stricter timing requirements than audio. Think of it as
          painting with electricity!
        </p>
      </div>
    </div>
  );
}

function SyncTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-2xl font-bold text-white">Why Sync is CRITICAL</h3>
        <p className="mb-4 leading-relaxed">
          In audio synthesis, oscillators can run freely. In video synthesis,{' '}
          <strong className="text-red-400">ALL modules must be synchronized</strong> to a master
          timing source, or your image will tear, roll, or fail to display entirely.
        </p>
      </div>

      <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-6">
        <h4 className="mb-3 text-lg font-bold text-red-300">⚠️ Without Sync:</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-red-400">✗</span>
            <span>Image will tear or roll vertically</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400">✗</span>
            <span>Colors will be unstable or incorrect</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400">✗</span>
            <span>Display may not lock to the signal</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400">✗</span>
            <span>System will not function properly</span>
          </li>
        </ul>
      </div>

      <div>
        <h4 className="mb-3 text-lg font-semibold text-orange-300">Common Sync Generators</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <h5 className="mb-2 font-semibold text-white">LZX ESG3</h5>
            <p className="text-sm text-slate-400">
              Sync + encoder combo. Provides master timing and HDMI output in one module.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <h5 className="mb-2 font-semibold text-white">LZX Visual Cortex</h5>
            <p className="text-sm text-slate-400">
              Full video computer. Sync generation, encoding, and processing capabilities.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <h5 className="mb-2 font-semibold text-white">LZX Chromagnon</h5>
            <p className="text-sm text-slate-400">
              Hybrid analog + FPGA platform. Advanced sync and video processing.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <h5 className="mb-2 font-semibold text-white">Syntonie Sortie</h5>
            <p className="text-sm text-slate-400">
              DIY-friendly sync generator with composite video output.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
        <p className="text-sm">
          <strong className="text-green-300">✓ First Step in EVERY Video Patch:</strong> Distribute
          sync from your sync generator to ALL video modules before making any other connections.
        </p>
      </div>
    </div>
  );
}

function RampsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-2xl font-bold text-white">
          Horizontal vs Vertical: The Confusion
        </h3>
        <p className="mb-4 leading-relaxed">
          This is the <strong className="text-yellow-300">most counterintuitive concept</strong> in
          video synthesis and confuses everyone at first:
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-orange-500/50 bg-orange-500/10 p-6">
          <h4 className="mb-3 text-lg font-bold text-orange-300">Horizontal Ramp</h4>
          <p className="mb-4 text-2xl font-bold text-white">→ Creates VERTICAL bars</p>
          <p className="text-sm text-slate-400">
            The ramp varies during the horizontal scan, creating a gradient that appears as vertical
            bars on screen.
          </p>
        </div>

        <div className="rounded-xl border border-orange-500/50 bg-orange-500/10 p-6">
          <h4 className="mb-3 text-lg font-bold text-orange-300">Vertical Ramp</h4>
          <p className="mb-4 text-2xl font-bold text-white">↓ Creates HORIZONTAL bars</p>
          <p className="text-sm text-slate-400">
            The ramp varies during the vertical scan, creating a gradient that appears as horizontal
            bars on screen.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6">
        <h4 className="mb-3 text-lg font-semibold text-yellow-300">Why This Happens</h4>
        <p className="mb-4 text-sm leading-relaxed">
          Video displays work by scanning an electron beam (or equivalent) across the screen:
        </p>
        <ol className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="font-bold text-yellow-300">1.</span>
            <span>
              <strong>Horizontal scan:</strong> Beam moves left-to-right very quickly (~15 kHz)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-yellow-300">2.</span>
            <span>
              <strong>Vertical scan:</strong> After each line, beam moves down slightly (~60 Hz)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-yellow-300">3.</span>
            <span>
              A ramp that changes <strong>during</strong> the horizontal scan creates a pattern{' '}
              <strong>across</strong> the scan direction (vertical on screen)
            </span>
          </li>
        </ol>
      </div>

      <div>
        <h4 className="mb-3 text-lg font-semibold text-orange-300">Common Ramp Generators</h4>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <h5 className="mb-1 font-semibold text-white">LZX Angles</h5>
            <p className="text-xs text-slate-400">Horizontal ramp generator</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <h5 className="mb-1 font-semibold text-white">LZX Scrolls</h5>
            <p className="text-xs text-slate-400">Vertical ramp generator</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <h5 className="mb-1 font-semibold text-white">Syntonie Rampes</h5>
            <p className="text-xs text-slate-400">Dual H+V ramp generator</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VoltageTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-2xl font-bold text-white">Voltage Ranges: Audio vs Video</h3>
        <p className="mb-4 leading-relaxed">
          Audio and video modules operate at different voltage levels, which creates challenges (and
          creative opportunities) in hybrid systems.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-cyan-500/50 bg-cyan-500/10 p-6">
          <h4 className="mb-3 text-lg font-bold text-cyan-300">🔊 Audio: ±5V Bipolar</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>Range: -5V to +5V</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>Center: 0V</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>Total swing: 10V peak-to-peak</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>Standard for Eurorack audio</span>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-orange-500/50 bg-orange-500/10 p-6">
          <h4 className="mb-3 text-lg font-bold text-orange-300">📺 Video: 0-1V Unipolar</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>Range: 0V to +1V</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>Black: 0V, White: 1V</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>Total swing: 1V</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span>LZX Patchable Video Standard</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-yellow-500/50 bg-yellow-500/10 p-6">
        <h4 className="mb-3 text-lg font-semibold text-yellow-300">
          ⚠️ Mixing Audio and Video Signals
        </h4>
        <p className="mb-4 text-sm leading-relaxed">
          When you patch audio modules (±5V) into video modules (0-1V), the audio signal will{' '}
          <strong className="text-red-400">clip and saturate</strong> the video signal:
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h5 className="mb-2 font-semibold text-red-300">The Problem:</h5>
            <ul className="space-y-1 text-xs">
              <li>• Audio oscillator outputs -5V to +5V</li>
              <li>• Video module expects 0V to +1V</li>
              <li>• Negative voltages clipped to 0V (black)</li>
              <li>• Voltages above +1V clipped to 1V (white)</li>
              <li>• Result: Hard edges, high contrast, loss of detail</li>
            </ul>
          </div>
          <div>
            <h5 className="mb-2 font-semibold text-green-300">The Opportunity:</h5>
            <ul className="space-y-1 text-xs">
              <li>• Clipping creates bold, graphic imagery</li>
              <li>• Hard edges can be aesthetically interesting</li>
              <li>• Experiment with audio LFOs for subtle modulation</li>
              <li>• Audio envelopes can gate video signals</li>
              <li>• Great for glitchy, experimental effects</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
        <p className="text-sm">
          <strong className="text-purple-300">💡 Pro Tip:</strong> When PatchPath AI detects a
          hybrid rack, it will warn you about voltage incompatibility and suggest creative ways to
          use audio-visual cross-modulation.
        </p>
      </div>
    </div>
  );
}

function WorkflowTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-2xl font-bold text-white">Typical Video Synthesis Workflow</h3>
        <p className="mb-4 leading-relaxed">
          Unlike audio synthesis (VCO → VCF → VCA), video synthesis follows a different signal flow
          focused on ramps, processing, and colorization.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-lg font-bold text-white">
            1
          </div>
          <div className="flex-1">
            <h4 className="mb-2 text-lg font-bold text-white">Sync Distribution</h4>
            <p className="mb-2 text-sm text-slate-300">
              <strong className="text-red-400">ALWAYS THE FIRST STEP.</strong> Route sync output
              from your sync generator to ALL video modules.
            </p>
            <p className="text-xs text-slate-500">
              Example: ESG3 Sync Out → Angles Sync In, Scrolls Sync In, Passage Sync In, etc.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-black/20 p-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white">
            2
          </div>
          <div className="flex-1">
            <h4 className="mb-2 text-lg font-bold text-white">Ramp Generation</h4>
            <p className="mb-2 text-sm text-slate-300">
              Generate horizontal and/or vertical ramps. These are your foundational building
              blocks.
            </p>
            <p className="text-xs text-slate-500">
              Modules: LZX Angles (horizontal), Scrolls (vertical), Syntonie Rampes (dual)
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-black/20 p-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white">
            3
          </div>
          <div className="flex-1">
            <h4 className="mb-2 text-lg font-bold text-white">Ramp Processing</h4>
            <p className="mb-2 text-sm text-slate-300">
              Combine, multiply, add, or transform ramps to create complex patterns and shapes.
            </p>
            <p className="text-xs text-slate-500">
              Modules: LZX Multiplier, Video Calculator, Mapper, Polar Fringe, Syntonie CBV series
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-black/20 p-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white">
            4
          </div>
          <div className="flex-1">
            <h4 className="mb-2 text-lg font-bold text-white">Colorization</h4>
            <p className="mb-2 text-sm text-slate-300">
              Convert luminance (black & white) signals into RGB color using colorizer modules.
            </p>
            <p className="text-xs text-slate-500">
              Modules: LZX Passage, Contour (voltage-controlled colorization)
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-black/20 p-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white">
            5
          </div>
          <div className="flex-1">
            <h4 className="mb-2 text-lg font-bold text-white">Keying & Mixing</h4>
            <p className="mb-2 text-sm text-slate-300">
              Composite multiple layers using luminance or chroma keying. Mix RGB channels.
            </p>
            <p className="text-xs text-slate-500">
              Modules: LZX FKG3 (keyer), SMX3 (RGB mixer), Syntonie Isohélie
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-black/20 p-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white">
            6
          </div>
          <div className="flex-1">
            <h4 className="mb-2 text-lg font-bold text-white">Encoding & Output</h4>
            <p className="mb-2 text-sm text-slate-300">
              Convert the Eurorack video signals to HDMI or composite video for display.
            </p>
            <p className="text-xs text-slate-500">
              Modules: LZX ESG3, Visual Cortex (HDMI), Syntonie Sortie (composite)
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-500 text-lg font-bold text-white">
            7
          </div>
          <div className="flex-1">
            <h4 className="mb-2 text-lg font-bold text-white">Feedback (Optional)</h4>
            <p className="mb-2 text-sm text-slate-300">
              Route output back into processing for evolving, organic patterns. Start subtle!
            </p>
            <p className="text-xs text-red-400">
              ⚠️ Warning: Feedback can be unstable and cause runaway brightness. Use with caution.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
        <p className="text-sm">
          <strong className="text-green-300">✓ Remember:</strong> PatchPath AI follows this workflow
          when generating video synthesis patches. It will always start with sync distribution and
          guide you through the proper signal flow.
        </p>
      </div>
    </div>
  );
}
