/**
 * Module Types for PatchPath AI
 * Represents modular synthesizer modules and their specifications
 */

export type ModuleType =
  | 'VCO'          // Voltage Controlled Oscillator
  | 'VCF'          // Voltage Controlled Filter
  | 'VCA'          // Voltage Controlled Amplifier
  | 'LFO'          // Low Frequency Oscillator
  | 'EG'           // Envelope Generator
  | 'Sequencer'
  | 'Utility'
  | 'Effect'
  | 'Mixer'
  | 'MIDI'
  | 'Clock'
  | 'Logic'
  | 'Random'
  | 'Video'
  | 'Other';

export type SignalType = 'audio' | 'cv' | 'gate' | 'clock' | 'video';

export interface ModuleInput {
  name: string;
  type: SignalType;
  voltageRange?: string;  // e.g., "-5V to +5V", "0-10V"
}

export interface ModuleOutput {
  name: string;
  type: SignalType;
  voltageRange?: string;
}

export interface Module {
  id: string;
  name: string;
  manufacturer: string;
  type: ModuleType;
  hp: number;                    // Horizontal Pitch (width in Eurorack units)
  depth?: number;                // Depth in mm
  power: {
    positive12V?: number;        // mA
    negative12V?: number;        // mA
    positive5V?: number;         // mA
  };
  inputs: ModuleInput[];
  outputs: ModuleOutput[];
  description?: string;
  specialCapabilities?: string[]; // e.g., ["through-zero FM", "waveshaping"]
  moduleGridUrl?: string;
  position?: {                   // Position in rack
    row: number;
    column: number;
  };
}

export interface ModuleDatabase {
  [moduleId: string]: Module;
}
