'use client';

import React, { useState } from 'react';
import { type RackCapabilities, type RackAnalysis } from '@/types/rack';
import { type Module } from '@/types/module';
import { ModuleTypeTooltip } from '@/components/education/ModuleTypeTooltip';
import { getModuleIcon } from '@/lib/education/module-info';
import { TechniqueExplainer } from '@/components/education/TechniqueExplainer';
import { findTechniqueByName } from '@/lib/education/technique-info';
import { RackVisualization } from './RackVisualization';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface RackAnalysisCardProps {
  capabilities: RackCapabilities;
  analysis: RackAnalysis;
  modules: Module[];
  rackName?: string;
  moduleCount: number;
}

export function RackAnalysisCard({
  capabilities,
  analysis,
  modules,
  rackName,
  moduleCount,
}: RackAnalysisCardProps) {
  const [showVisualization, setShowVisualization] = useState(true);

  // Determine rack type
  const rackType = capabilities.isVideoRack
    ? 'video'
    : capabilities.isHybridRack
      ? 'hybrid'
      : 'audio';

  // Calculate number of rows from modules
  const maxRow = Math.max(...modules.map((m) => m.row || 0), 0);
  const rows = maxRow + 1;

  const rackTypeConfig = {
    video: {
      badge: '🎬 Video Synthesis Rack',
      gradient: 'from-orange-500/20 to-red-500/20',
      borderColor: 'border-orange-500/30',
      textColor: 'text-orange-300',
      bgColor: 'bg-orange-500/10',
    },
    audio: {
      badge: '🎵 Audio Synthesis Rack',
      gradient: 'from-blue-500/20 to-purple-500/20',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-300',
      bgColor: 'bg-purple-500/10',
    },
    hybrid: {
      badge: '🎨 Hybrid Audio + Video Rack',
      gradient: 'from-purple-500/20 via-pink-500/20 to-orange-500/20',
      borderColor: 'border-pink-500/30',
      textColor: 'text-pink-300',
      bgColor: 'bg-gradient-to-r from-purple-500/10 to-orange-500/10',
    },
  };

  const config = rackTypeConfig[rackType];

  // Module type breakdown
  const moduleTypeCounts = modules.reduce(
    (acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const sortedModuleTypes = Object.entries(moduleTypeCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div
      className={`rounded-2xl border ${config.borderColor} bg-gradient-to-br ${config.gradient} p-6 backdrop-blur-sm`}
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex-1">
          <div
            className={`mb-3 inline-block rounded-full ${config.bgColor} px-4 py-2 text-sm font-bold`}
          >
            {config.badge}
          </div>
          {rackName ? <h3 className="text-2xl font-bold text-white">{rackName}</h3> : null}
          <p className="text-slate-300">
            {moduleCount} modules • {capabilities.totalHP} HP • {rows} {rows === 1 ? 'row' : 'rows'}
          </p>
        </div>
        <button
          onClick={() => setShowVisualization(!showVisualization)}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/10"
        >
          {showVisualization ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide Rack
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show Rack
            </>
          )}
        </button>
      </div>

      {/* Rack Visualization */}
      {showVisualization && modules.length > 0 ? (
        <div className="mb-6">
          <RackVisualization modules={modules} totalHP={capabilities.totalHP} rows={rows} />
        </div>
      ) : null}

      {/* Critical Warnings (if any) */}
      {analysis.warnings.length > 0 && (
        <div className="mb-6 space-y-2">
          {analysis.warnings.map((warning, index) => {
            const isCritical = warning.includes('🚨') || warning.includes('NO SYNC');
            return (
              <div
                key={index}
                className={`rounded-lg border p-3 ${
                  isCritical
                    ? 'border-red-500/50 bg-red-500/10 text-red-200'
                    : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200'
                }`}
              >
                <p className="text-sm">{warning}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Capabilities Checklist */}
        <div>
          <h4 className="mb-3 text-sm font-bold tracking-wide text-slate-400 uppercase">
            Capabilities
          </h4>
          <div className="space-y-2">
            {rackType === 'video' || rackType === 'hybrid' ? (
              <>
                <CapabilityItem
                  label="Sync Generator"
                  moduleType="SyncGenerator"
                  present={capabilities.hasVideoSync}
                  critical
                  note={capabilities.videoSyncSource}
                />
                <CapabilityItem
                  label="Ramp Generator"
                  moduleType="RampGenerator"
                  present={capabilities.hasRampGenerator}
                  critical
                />
                <CapabilityItem
                  label="Video Encoder"
                  moduleType="VideoEncoder"
                  present={capabilities.hasVideoEncoder}
                  critical
                />
                <CapabilityItem
                  label="Colorizer"
                  moduleType="Colorizer"
                  present={capabilities.hasColorizer}
                />
                <CapabilityItem label="Keyer" moduleType="Keyer" present={capabilities.hasKeyer} />
                <CapabilityItem
                  label="Video Decoder"
                  moduleType="VideoDecoder"
                  present={capabilities.hasVideoDecoder}
                />
              </>
            ) : null}

            {rackType === 'audio' || rackType === 'hybrid' ? (
              <>
                <CapabilityItem
                  label="VCO (Oscillator)"
                  moduleType="VCO"
                  present={capabilities.hasVCO}
                  critical
                />
                <CapabilityItem
                  label="VCF (Filter)"
                  moduleType="VCF"
                  present={capabilities.hasVCF}
                />
                <CapabilityItem
                  label="VCA (Amplifier)"
                  moduleType="VCA"
                  present={capabilities.hasVCA}
                />
                <CapabilityItem
                  label="Envelope"
                  moduleType="EG"
                  present={capabilities.hasEnvelope}
                />
                <CapabilityItem label="LFO" moduleType="LFO" present={capabilities.hasLFO} />
                <CapabilityItem
                  label="Sequencer"
                  moduleType="Sequencer"
                  present={capabilities.hasSequencer}
                />
              </>
            ) : null}
          </div>
        </div>

        {/* Module Breakdown */}
        <div>
          <h4 className="mb-3 text-sm font-bold tracking-wide text-slate-400 uppercase">
            Module Breakdown
          </h4>
          <div className="space-y-2">
            {sortedModuleTypes.slice(0, 8).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <ModuleTypeTooltip moduleType={type} side="right">
                  <button className="flex cursor-help items-center gap-1.5 text-left text-slate-300 transition-colors hover:text-white">
                    <span className="text-sm">{getModuleIcon(type)}</span>
                    <span>{type}</span>
                  </button>
                </ModuleTypeTooltip>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${config.bgColor}`}
                      style={{ width: `${(count / moduleCount) * 100}%` }}
                    />
                  </div>
                  <span className={`font-semibold ${config.textColor}`}>{count}</span>
                </div>
              </div>
            ))}
            {sortedModuleTypes.length > 8 && (
              <p className="text-xs text-slate-500">
                + {sortedModuleTypes.length - 8} more types...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Possible Techniques */}
      {analysis.techniquesPossible.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-bold tracking-wide text-slate-400 uppercase">
            Possible Techniques
            <span className="ml-2 text-xs font-normal text-slate-500">(click for details)</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.techniquesPossible.map((technique, index) => {
              const techniqueInfo = findTechniqueByName(technique);

              const pill = (
                <span
                  className={`rounded-lg border ${config.borderColor} ${config.bgColor} px-3 py-1.5 text-sm ${config.textColor} ${techniqueInfo ? 'cursor-pointer transition-all hover:scale-105 hover:shadow-lg' : ''}`}
                >
                  {techniqueInfo?.icon ? `${techniqueInfo.icon} ` : ''}
                  {technique}
                </span>
              );

              if (techniqueInfo) {
                return (
                  <TechniqueExplainer key={index} technique={techniqueInfo}>
                    {pill}
                  </TechniqueExplainer>
                );
              }

              return <span key={index}>{pill}</span>;
            })}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-bold tracking-wide text-slate-400 uppercase">
            💡 Suggestions
          </h4>
          <ul className="space-y-2">
            {analysis.suggestions.slice(0, 4).map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                <span className={config.textColor}>•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface CapabilityItemProps {
  label: string;
  moduleType?: string;
  present?: boolean;
  critical?: boolean;
  note?: string;
}

function CapabilityItem({
  label,
  moduleType,
  present = false,
  critical = false,
  note,
}: CapabilityItemProps) {
  const content = (
    <div className="flex items-center justify-between">
      <span
        className={`text-sm ${present ? 'text-slate-200' : 'text-slate-500'} ${moduleType ? 'cursor-help border-b border-dotted border-slate-600 hover:border-slate-400' : ''}`}
      >
        {label}
      </span>
      <div className="flex items-center gap-2">
        {note ? <span className="text-xs text-slate-400">({note})</span> : null}
        {present ? (
          <span className="text-green-400">✓</span>
        ) : (
          <span className={critical ? 'text-red-400' : 'text-slate-600'}>✗</span>
        )}
      </div>
    </div>
  );

  if (moduleType) {
    return <ModuleTypeTooltip moduleType={moduleType}>{content}</ModuleTypeTooltip>;
  }

  return content;
}
