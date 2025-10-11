/**
 * Rack Types for PatchPath AI
 * Represents modular synthesizer racks and their configurations
 */

import { Module, ModuleType } from './module';

export interface RackCapabilities {
  hasVCO: boolean;
  hasVCF: boolean;
  hasVCA: boolean;
  hasLFO: boolean;
  hasEnvelope: boolean;
  hasSequencer: boolean;
  hasEffects: boolean;
  moduleTypes: ModuleType[];
  totalHP: number;
  totalPowerDraw: {
    positive12V: number;
    negative12V: number;
    positive5V: number;
  };
}

export interface RackAnalysis {
  missingFundamentals: ModuleType[];
  suggestions: string[];
  techniquesPossible: string[];   // e.g., ["FM synthesis", "Subtractive", "Generative"]
  warnings: string[];             // e.g., ["No VCA detected - you may not be able to control amplitude"]
}

export interface Rack {
  id: string;
  userId: string;
  name: string;
  modularGridUrl: string;
  modules: Module[];
  capabilities: RackCapabilities;
  analysis: RackAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export interface RackRow {
  rowNumber: number;
  modules: Module[];
  totalHP: number;
  maxHP: number;
}

export interface ParsedRack {
  url: string;
  rows: RackRow[];
  modules: Module[];
  metadata: {
    rackId: string;
    userName?: string;
    rackName?: string;
  };
}
