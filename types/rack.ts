/**
 * Rack Types for PatchPath AI
 * Represents modular synthesizer racks and their configurations
 */

import { type Module, type ModuleType } from './module';

export interface RackCapabilities {
  // Audio synthesis capabilities
  hasVCO: boolean;
  hasVCF: boolean;
  hasVCA: boolean;
  hasLFO: boolean;
  hasEnvelope: boolean;
  hasSequencer: boolean;
  hasEffects: boolean;

  // Video synthesis capabilities (October 2025 update)
  hasVideoSync?: boolean; // CRITICAL: Must have sync generator for video
  hasRampGenerator?: boolean; // Core building block for video patterns
  hasColorizer?: boolean; // For color video generation
  hasKeyer?: boolean; // For video compositing
  hasVideoEncoder?: boolean; // For output to HDMI/composite displays
  hasVideoDecoder?: boolean; // For processing external video sources
  videoModuleTypes?: ModuleType[]; // List of specific video module types
  videoSyncSource?: string; // Which module provides sync (e.g., "ESG3", "Visual Cortex")
  isVideoRack?: boolean; // Majority of modules are video synthesis
  isHybridRack?: boolean; // Mix of audio + video modules

  // General capabilities
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
  techniquesPossible: string[]; // e.g., ["FM synthesis", "Subtractive", "Generative"]
  warnings: string[]; // e.g., ["No VCA detected - you may not be able to control amplitude"]
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
    hp?: number;
  };
}
