'use client';

import React from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { getModuleInfo, type ModuleTypeInfo } from '@/lib/education/module-info';

interface ModuleTypeTooltipProps {
  moduleType: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function ModuleTypeTooltip({ moduleType, children, side = 'top' }: ModuleTypeTooltipProps) {
  const info = getModuleInfo(moduleType);

  if (!info) {
    // No tooltip if module type not found
    return <>{children}</>;
  }

  return (
    <Tooltip side={side} content={<ModuleTypeTooltipContent info={info} />}>
      {children}
    </Tooltip>
  );
}

function ModuleTypeTooltipContent({ info }: { info: ModuleTypeInfo }) {
  // Theme colors based on category
  const categoryColors = {
    video: {
      border: 'border-orange-500/30',
      bg: 'bg-orange-500/10',
      text: 'text-orange-300',
      badge: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    },
    audio: {
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/10',
      text: 'text-purple-300',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    },
    utility: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/10',
      text: 'text-blue-300',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    },
  };

  const colors = categoryColors[info.category];

  return (
    <div className="w-80">
      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{info.icon}</span>
          <h4 className="font-bold text-white">{info.title}</h4>
        </div>
        {info.critical ? (
          <span className="rounded border border-red-500/50 bg-red-500/20 px-1.5 py-0.5 text-xs font-bold text-red-300">
            CRITICAL
          </span>
        ) : null}
      </div>

      {/* Description */}
      <p className="mb-3 text-sm text-slate-300">{info.description}</p>

      {/* Purpose */}
      <div className={`mb-3 rounded-lg border ${colors.border} ${colors.bg} p-2`}>
        <p className="text-xs leading-relaxed text-slate-300">{info.purpose}</p>
      </div>

      {/* Examples */}
      {info.examples.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Examples
          </p>
          <div className="flex flex-wrap gap-1">
            {info.examples.map((example, idx) => (
              <span key={idx} className={`rounded border px-2 py-0.5 text-xs ${colors.badge}`}>
                {example}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category badge */}
      <div className="mt-3 flex items-center justify-end gap-2">
        {info.videoOnly ? (
          <span className="rounded bg-orange-500/20 px-2 py-0.5 text-xs text-orange-300">
            📺 Video Only
          </span>
        ) : null}
        {info.audioOnly ? (
          <span className="rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
            🎵 Audio Only
          </span>
        ) : null}
      </div>
    </div>
  );
}
