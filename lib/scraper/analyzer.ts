/**
 * Rack Analysis Engine
 * Analyzes rack capabilities and provides insights
 */

import { type Module, type ModuleType } from '@/types/module';
import { type ParsedRack, type RackCapabilities, type RackAnalysis } from '@/types/rack';

/**
 * Analyze rack capabilities (October 2025 update: comprehensive video synthesis support)
 */
export function analyzeRackCapabilities(modules: Module[]): RackCapabilities {
  const moduleTypes = new Set<ModuleType>();
  const videoModuleTypes: ModuleType[] = [];
  let totalHP = 0;
  const totalPower = {
    positive12V: 0,
    negative12V: 0,
    positive5V: 0,
  };

  // Video module type categories for detection
  const VIDEO_MODULE_CATEGORIES = [
    'VideoOscillator',
    'RampGenerator',
    'ShapeGenerator',
    'SyncGenerator',
    'VideoEncoder',
    'VideoDecoder',
    'Colorizer',
    'Keyer',
    'VideoMixer',
    'VideoProcessor',
    'VideoUtility',
    'VideoDisplay',
    'Video',
  ];

  let videoSyncSource: string | undefined;

  modules.forEach((module) => {
    moduleTypes.add(module.type);
    totalHP += module.hp;

    if (module.power.positive12V) totalPower.positive12V += module.power.positive12V;
    if (module.power.negative12V) totalPower.negative12V += module.power.negative12V;
    if (module.power.positive5V) totalPower.positive5V += module.power.positive5V;

    // Track video modules
    if (VIDEO_MODULE_CATEGORIES.includes(module.type)) {
      videoModuleTypes.push(module.type);
    }

    // Identify video sync source (first sync generator found)
    if (module.type === 'SyncGenerator' && !videoSyncSource) {
      videoSyncSource = module.name;
    }
  });

  // Determine if this is a video or hybrid rack
  const videoModuleCount = videoModuleTypes.length;
  const totalModuleCount = modules.length;
  const isVideoRack = videoModuleCount > totalModuleCount * 0.5; // >50% video modules
  const isHybridRack = videoModuleCount > 0 && videoModuleCount <= totalModuleCount * 0.5;

  return {
    // Audio capabilities
    hasVCO: moduleTypes.has('VCO'),
    hasVCF: moduleTypes.has('VCF'),
    hasVCA: moduleTypes.has('VCA'),
    hasLFO: moduleTypes.has('LFO'),
    hasEnvelope: moduleTypes.has('EG'),
    hasSequencer: moduleTypes.has('Sequencer'),
    hasEffects: moduleTypes.has('Effect'),

    // Video capabilities (October 2025 update)
    hasVideoSync: moduleTypes.has('SyncGenerator'),
    hasRampGenerator: moduleTypes.has('RampGenerator'),
    hasColorizer: moduleTypes.has('Colorizer'),
    hasKeyer: moduleTypes.has('Keyer'),
    hasVideoEncoder: moduleTypes.has('VideoEncoder'),
    hasVideoDecoder: moduleTypes.has('VideoDecoder'),
    videoModuleTypes,
    videoSyncSource,
    isVideoRack,
    isHybridRack,

    // General capabilities
    moduleTypes: Array.from(moduleTypes),
    totalHP,
    totalPowerDraw: totalPower,
  };
}

/**
 * Analyze rack and provide insights
 */
export function analyzeRack(rack: ParsedRack): RackAnalysis {
  const capabilities = analyzeRackCapabilities(rack.modules);
  const missingFundamentals: ModuleType[] = [];
  const suggestions: string[] = [];
  const techniquesPossible: string[] = [];
  const warnings: string[] = [];

  // Check for fundamental components (ONLY for non-pure-video racks)
  // Pure video racks don't need VCO/VCF/VCA - they use ramps/sync instead
  const isPureVideoRack = capabilities.isVideoRack;

  if (!isPureVideoRack) {
    if (!capabilities.hasVCO) {
      missingFundamentals.push('VCO');
      suggestions.push('Add a VCO (oscillator) to generate sound sources');
    }

    if (!capabilities.hasVCF) {
      missingFundamentals.push('VCF');
      suggestions.push('Add a VCF (filter) for subtractive synthesis');
    } else {
      techniquesPossible.push('Subtractive synthesis');
    }

    if (!capabilities.hasVCA) {
      missingFundamentals.push('VCA');
      warnings.push('No VCA detected - you may not be able to control amplitude');
    }

    if (!capabilities.hasEnvelope) {
      missingFundamentals.push('EG');
      suggestions.push('Add an envelope generator for dynamic control');
    }
  }

  // Determine possible techniques - AUDIO SYNTHESIS
  if (capabilities.hasVCO && capabilities.hasVCF && capabilities.hasVCA) {
    techniquesPossible.push('Classic voice architecture');
  }

  if (capabilities.hasVCO && rack.modules.filter((m) => m.type === 'VCO').length >= 2) {
    techniquesPossible.push('FM synthesis');
    techniquesPossible.push('Cross-modulation');
  }

  if (capabilities.hasLFO) {
    techniquesPossible.push('Modulation effects');
    techniquesPossible.push('Tremolo & vibrato');
  }

  if (capabilities.hasSequencer) {
    techniquesPossible.push('Generative sequences');
    techniquesPossible.push('Melodic patterns');
  }

  if (capabilities.hasEffects) {
    techniquesPossible.push('Effects processing');
  }

  if (capabilities.moduleTypes.includes('Random')) {
    techniquesPossible.push('Generative patching');
    techniquesPossible.push('Chaotic systems');
  }

  // VIDEO SYNTHESIS ANALYSIS (October 2025 update)
  if (capabilities.isVideoRack || capabilities.isHybridRack) {
    // CRITICAL: Video requires sync generator (unlike audio which can free-run)
    if (!capabilities.hasVideoSync) {
      missingFundamentals.push('SyncGenerator');
      warnings.push('🚨 NO SYNC GENERATOR - Video system will NOT function without master sync!');
      warnings.push(
        '⚠️  Video synthesis REQUIRES synchronized timing across all modules (unlike audio)'
      );
      suggestions.push('Add a sync generator (LZX ESG3, Visual Cortex, Chromagnon, or equivalent)');
    } else if (capabilities.videoSyncSource) {
      // System has sync - note which module provides it
      suggestions.push(
        `✅ Sync provided by ${capabilities.videoSyncSource} - distribute to all video modules first`
      );
    }

    // Check for encoder (needed for output to displays)
    if (!capabilities.hasVideoEncoder) {
      warnings.push(
        '⚠️  No video encoder detected - you may not be able to output to HDMI/composite displays'
      );
      suggestions.push(
        'Add a video encoder (LZX ESG3, Visual Cortex) to convert signals to standard video formats'
      );
    }

    // Check for ramp generators (core building block)
    if (!capabilities.hasRampGenerator) {
      warnings.push(
        '⚠️  No ramp generator - ramps are the core building block of video synthesis (like VCOs for audio)'
      );
      suggestions.push(
        'Add ramp generators (LZX Angles/Scrolls, Syntonie Rampes) for creating visual patterns'
      );
    }

    // Determine video synthesis techniques based on available modules
    if (capabilities.hasRampGenerator && capabilities.hasColorizer) {
      techniquesPossible.push('🎨 Geometric color patterns (ramps + colorization)');
    }

    if (capabilities.hasKeyer) {
      techniquesPossible.push('🎬 Video compositing & keying effects');
    }

    if (capabilities.hasVideoDecoder) {
      techniquesPossible.push('📹 External video processing & effects');
    }

    if (
      capabilities.hasRampGenerator &&
      capabilities.videoModuleTypes?.includes('VideoProcessor')
    ) {
      techniquesPossible.push('🌀 Raster manipulation & feedback loops');
      warnings.push('⚠️  Video feedback can be unstable/unpredictable - start with subtle amounts');
    }

    if (
      capabilities.hasVideoSync &&
      capabilities.hasRampGenerator &&
      capabilities.hasVideoEncoder
    ) {
      techniquesPossible.push(
        '✨ Complete video synthesis workflow (sync → ramps → processing → output)'
      );
    }

    // HYBRID RACK WARNINGS (audio + video cross-patching)
    if (capabilities.isHybridRack) {
      warnings.push(
        '🎛️  HYBRID RACK: Audio modules output ±5V, video expects 0-1V (signals will clip/saturate)'
      );
      suggestions.push(
        '💡 CREATIVE TIP: Audio oscillators can modulate video signals for interesting effects (expect clipping)'
      );
      techniquesPossible.push('🔊🎨 Audio-visual cross-modulation (experimental)');
    }

    // Educational note about horizontal/vertical confusion
    if (capabilities.hasRampGenerator) {
      suggestions.push(
        '📚 IMPORTANT: Horizontal ramp creates VERTICAL bars, vertical ramp creates HORIZONTAL bars (scan direction vs. pattern orientation)'
      );
    }
  }

  // Power warnings
  if (capabilities.totalPowerDraw.positive12V > 2000) {
    warnings.push(
      `High +12V power draw (${capabilities.totalPowerDraw.positive12V}mA) - ensure your PSU can handle it`
    );
  }

  // HP warnings
  const standardCaseHP = 168; // 2x 84HP rows
  if (capabilities.totalHP > standardCaseHP) {
    warnings.push(
      `Rack exceeds standard case size (${capabilities.totalHP}HP > ${standardCaseHP}HP)`
    );
  }

  return {
    missingFundamentals,
    suggestions,
    techniquesPossible,
    warnings,
  };
}

/**
 * Generate a human-readable summary of the rack
 */
export function generateRackSummary(rack: ParsedRack, analysis: RackAnalysis): string {
  const { modules } = rack;
  const moduleCount = modules.length;

  let summary = `Your rack contains ${moduleCount} modules across ${rack.rows.length} row(s).\n\n`;

  // Module breakdown
  const typeCounts = modules.reduce(
    (acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  summary += '📊 Module Breakdown:\n';
  Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      summary += `  • ${type}: ${count}\n`;
    });

  summary += '\n';

  // Capabilities
  if (analysis.techniquesPossible.length > 0) {
    summary += '✨ Possible Techniques:\n';
    analysis.techniquesPossible.forEach((technique) => {
      summary += `  • ${technique}\n`;
    });
    summary += '\n';
  }

  // Warnings
  if (analysis.warnings.length > 0) {
    summary += '⚠️  Warnings:\n';
    analysis.warnings.forEach((warning) => {
      summary += `  • ${warning}\n`;
    });
    summary += '\n';
  }

  // Suggestions
  if (analysis.suggestions.length > 0) {
    summary += '💡 Suggestions:\n';
    analysis.suggestions.forEach((suggestion) => {
      summary += `  • ${suggestion}\n`;
    });
  }

  return summary;
}
