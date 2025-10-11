/**
 * Rack Analysis Engine
 * Analyzes rack capabilities and provides insights
 */

import { Module, ModuleType } from '@/types/module';
import { ParsedRack, RackCapabilities, RackAnalysis } from '@/types/rack';

/**
 * Analyze rack capabilities
 */
export function analyzeRackCapabilities(modules: Module[]): RackCapabilities {
  const moduleTypes = new Set<ModuleType>();
  let totalHP = 0;
  let totalPower = {
    positive12V: 0,
    negative12V: 0,
    positive5V: 0,
  };

  modules.forEach(module => {
    moduleTypes.add(module.type);
    totalHP += module.hp;

    if (module.power.positive12V) totalPower.positive12V += module.power.positive12V;
    if (module.power.negative12V) totalPower.negative12V += module.power.negative12V;
    if (module.power.positive5V) totalPower.positive5V += module.power.positive5V;
  });

  return {
    hasVCO: moduleTypes.has('VCO'),
    hasVCF: moduleTypes.has('VCF'),
    hasVCA: moduleTypes.has('VCA'),
    hasLFO: moduleTypes.has('LFO'),
    hasEnvelope: moduleTypes.has('EG'),
    hasSequencer: moduleTypes.has('Sequencer'),
    hasEffects: moduleTypes.has('Effect'),
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

  // Check for fundamental components
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

  // Determine possible techniques
  if (capabilities.hasVCO && capabilities.hasVCF && capabilities.hasVCA) {
    techniquesPossible.push('Classic voice architecture');
  }

  if (capabilities.hasVCO && rack.modules.filter(m => m.type === 'VCO').length >= 2) {
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

  // Power warnings
  if (capabilities.totalPowerDraw.positive12V > 2000) {
    warnings.push(`High +12V power draw (${capabilities.totalPowerDraw.positive12V}mA) - ensure your PSU can handle it`);
  }

  // HP warnings
  const standardCaseHP = 168; // 2x 84HP rows
  if (capabilities.totalHP > standardCaseHP) {
    warnings.push(`Rack exceeds standard case size (${capabilities.totalHP}HP > ${standardCaseHP}HP)`);
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
  const capabilities = analyzeRackCapabilities(modules);

  let summary = `Your rack contains ${moduleCount} modules across ${rack.rows.length} row(s).\n\n`;

  // Module breakdown
  const typeCounts = modules.reduce((acc, m) => {
    acc[m.type] = (acc[m.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
    analysis.techniquesPossible.forEach(technique => {
      summary += `  • ${technique}\n`;
    });
    summary += '\n';
  }

  // Warnings
  if (analysis.warnings.length > 0) {
    summary += '⚠️  Warnings:\n';
    analysis.warnings.forEach(warning => {
      summary += `  • ${warning}\n`;
    });
    summary += '\n';
  }

  // Suggestions
  if (analysis.suggestions.length > 0) {
    summary += '💡 Suggestions:\n';
    analysis.suggestions.forEach(suggestion => {
      summary += `  • ${suggestion}\n`;
    });
  }

  return summary;
}
