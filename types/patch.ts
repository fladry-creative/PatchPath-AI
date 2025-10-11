/**
 * Patch Types for PatchPath AI
 * Represents synthesizer patches and cable routing
 */

import { type SignalType } from './module';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Connection {
  id: string;
  from: {
    moduleId: string;
    moduleName: string;
    outputName: string;
  };
  to: {
    moduleId: string;
    moduleName: string;
    inputName: string;
  };
  signalType: SignalType;
  importance: 'primary' | 'modulation' | 'utility'; // For visual hierarchy
  note?: string; // e.g., "Patch with attenuator for best results"
}

export interface ParameterSuggestion {
  moduleId: string;
  moduleName: string;
  parameter: string;
  value: string; // e.g., "12 o'clock", "fully clockwise", "around 3"
  reasoning?: string;
}

export interface PatchMetadata {
  title: string;
  description: string;
  soundDescription?: string; // What it sounds like
  difficulty: DifficultyLevel;
  estimatedTime: number; // minutes
  techniques: string[]; // e.g., ["FM", "waveshaping", "generative"]
  genres: string[]; // e.g., ["ambient", "techno", "experimental"]
  userIntent?: string; // Original user request
}

export interface Patch {
  id: string;
  userId: string;
  rackId: string;
  metadata: PatchMetadata;
  connections: Connection[];
  patchingOrder: string[]; // Array of connection IDs in suggested order
  parameterSuggestions: ParameterSuggestion[];
  whyThisWorks: string; // Educational explanation
  tips: string[];
  variations?: string[]; // IDs of variation patches
  parentPatchId?: string; // If this is a variation
  createdAt: Date;
  updatedAt: Date;

  // User interaction
  userRating?: 'loved' | 'meh' | 'disaster';
  userNotes?: string;
  triedAt?: Date;
  saved: boolean;
  tags: string[]; // User custom tags
}

export interface PatchGenerationRequest {
  rackId: string;
  intent: string; // User's natural language request
  technique?: string;
  genre?: string;
  difficulty?: DifficultyLevel;
}

export interface PatchGenerationResponse {
  patch: Patch;
  alternatives?: Patch[]; // 3-5 variations
  warnings?: string[];
}

export interface PatchCollection {
  id: string;
  userId: string;
  name: string;
  patches: string[]; // Patch IDs
  createdAt: Date;
  updatedAt: Date;
}
