'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Module } from '@/types/module';
import { getModuleIcon } from '@/lib/education/module-info';

interface RackVisualizationProps {
  modules: Module[];
  totalHP: number;
  rows?: number;
}

// Eurorack standard: 1 HP = 5.08mm = ~0.2 inches
// For SVG, we'll use 10 pixels per HP for good visual sizing
const HP_TO_PIXELS = 10;
const ROW_HEIGHT = 128.5; // Eurorack standard 3U height in mm (converted to pixels)
const ROW_SPACING = 20; // Gap between rows

/**
 * Interactive SVG-based rack visualization
 * Shows modules as colored panels with accurate HP sizing
 */
export function RackVisualization({ modules, totalHP, rows = 1 }: RackVisualizationProps) {
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Organize modules by row
  const modulesByRow: Module[][] = [];
  for (let i = 0; i < rows; i++) {
    modulesByRow[i] = modules.filter((m) => m.row === i);
  }

  // Calculate dimensions
  const rackWidth = totalHP * HP_TO_PIXELS;
  const rackHeight = rows * ROW_HEIGHT + (rows - 1) * ROW_SPACING;

  // Get module color based on type
  const getModuleColor = (type: string): string => {
    const colors: Record<string, string> = {
      VCO: '#a855f7', // purple
      VCF: '#3b82f6', // blue
      VCA: '#10b981', // green
      EG: '#f59e0b', // amber
      LFO: '#06b6d4', // cyan
      Sequencer: '#ec4899', // pink
      Mixer: '#6366f1', // indigo
      Effect: '#8b5cf6', // violet
      MIDI: '#14b8a6', // teal
      Clock: '#f97316', // orange
      Logic: '#84cc16', // lime
      Random: '#eab308', // yellow
      Video: '#ef4444', // red
      SyncGenerator: '#dc2626', // dark red
      RampGenerator: '#fb923c', // orange-400
      Colorizer: '#f472b6', // pink-400
      Keyer: '#c084fc', // purple-400
      VideoMixer: '#a78bfa', // violet-400
      VideoProcessor: '#818cf8', // indigo-400
      VideoEncoder: '#f87171', // red-400
      VideoDecoder: '#fbbf24', // amber-400
      Utility: '#64748b', // slate
      Other: '#94a3b8', // slate-400
    };
    return colors[type] || '#94a3b8';
  };

  const handleModuleMouseEnter = (module: Module, event: React.MouseEvent) => {
    setHoveredModule(module.id);
    const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleModuleMouseLeave = () => {
    setHoveredModule(null);
  };

  return (
    <div className="relative">
      {/* SVG Rack */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <svg
          width={rackWidth + 40}
          height={rackHeight + 40}
          viewBox={`0 0 ${rackWidth + 40} ${rackHeight + 40}`}
          className="mx-auto"
          style={{ maxWidth: '100%', height: 'auto' }}
        >
          {/* Rack rails background */}
          <defs>
            <pattern
              id="rack-holes"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="10" cy="10" r="2" fill="#1e293b" />
            </pattern>
          </defs>

          {modulesByRow.map((rowModules, rowIndex) => {
            const rowY = rowIndex * (ROW_HEIGHT + ROW_SPACING) + 20;
            let currentX = 20;

            return (
              <g key={rowIndex}>
                {/* Row background with mounting holes */}
                <rect
                  x="10"
                  y={rowY - 5}
                  width={rackWidth + 20}
                  height={ROW_HEIGHT + 10}
                  fill="#0f172a"
                  stroke="#334155"
                  strokeWidth="2"
                  rx="4"
                />
                <rect
                  x="10"
                  y={rowY - 5}
                  width={rackWidth + 20}
                  height={ROW_HEIGHT + 10}
                  fill="url(#rack-holes)"
                  opacity="0.3"
                />

                {/* Modules */}
                {rowModules
                  .sort((a, b) => a.position - b.position)
                  .map((module, moduleIndex) => {
                    const moduleWidth = module.hp * HP_TO_PIXELS;
                    const x = currentX;
                    currentX += moduleWidth;

                    const moduleColor = getModuleColor(module.type);
                    const isHovered = hoveredModule === module.id;

                    return (
                      <motion.g
                        key={module.id || `${rowIndex}-${moduleIndex}`}
                        onMouseEnter={(e) =>
                          handleModuleMouseEnter(module, e as React.MouseEvent<SVGGElement>)
                        }
                        onMouseLeave={handleModuleMouseLeave}
                        className="cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Module panel */}
                        <rect
                          x={x}
                          y={rowY}
                          width={moduleWidth}
                          height={ROW_HEIGHT}
                          fill={moduleColor}
                          stroke={isHovered ? '#ffffff' : '#1e293b'}
                          strokeWidth={isHovered ? 3 : 1}
                          rx="2"
                          opacity={isHovered ? 0.9 : 0.7}
                        />

                        {/* Module icon (if wide enough) */}
                        {module.hp >= 6 && (
                          <text
                            x={x + moduleWidth / 2}
                            y={rowY + 30}
                            textAnchor="middle"
                            fontSize="24"
                            fill="#ffffff"
                            opacity="0.8"
                          >
                            {getModuleIcon(module.type)}
                          </text>
                        )}

                        {/* Module name (if wide enough) */}
                        {module.hp >= 8 && (
                          <text
                            x={x + moduleWidth / 2}
                            y={rowY + ROW_HEIGHT / 2 + 5}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#ffffff"
                            fontWeight="600"
                            opacity="0.9"
                          >
                            {module.name.length > 12
                              ? `${module.name.slice(0, 12)}...`
                              : module.name}
                          </text>
                        )}

                        {/* HP marking */}
                        <text
                          x={x + moduleWidth / 2}
                          y={rowY + ROW_HEIGHT - 10}
                          textAnchor="middle"
                          fontSize="8"
                          fill="#ffffff"
                          opacity="0.5"
                        >
                          {module.hp}HP
                        </text>
                      </motion.g>
                    );
                  })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredModule ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none fixed z-50"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="rounded-lg border border-white/20 bg-slate-900/95 px-4 py-2 shadow-xl backdrop-blur-sm">
              {(() => {
                const currentModule = modules.find((m) => m.id === hoveredModule);
                if (!currentModule) return null;

                return (
                  <>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-lg">{getModuleIcon(currentModule.type)}</span>
                      <p className="font-bold text-white">{currentModule.name}</p>
                    </div>
                    <p className="text-xs text-slate-400">{currentModule.manufacturer}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-300">
                      <span>{currentModule.hp} HP</span>
                      <span>•</span>
                      <span>{currentModule.type}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-purple-500"></div>
          <span>VCO/Sound Source</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-blue-500"></div>
          <span>VCF/Filter</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-green-500"></div>
          <span>VCA/Output</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-pink-500"></div>
          <span>Sequencer/Logic</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-red-500"></div>
          <span>Video Synthesis</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-slate-500"></div>
          <span>Utility/Other</span>
        </div>
      </div>
    </div>
  );
}
