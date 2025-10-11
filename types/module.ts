/**
 * Module Types for PatchPath AI
 * Represents modular synthesizer modules and their specifications
 */

export type ModuleType =
  | 'VCO' // Voltage Controlled Oscillator
  | 'VCF' // Voltage Controlled Filter
  | 'VCA' // Voltage Controlled Amplifier
  | 'LFO' // Low Frequency Oscillator
  | 'EG' // Envelope Generator
  | 'Sequencer'
  | 'Utility'
  | 'Effect'
  | 'Mixer'
  | 'MIDI'
  | 'Clock'
  | 'Logic'
  | 'Random'
  | 'Video' // Generic video module (fallback)
  | VideoModuleType
  | 'Other';

/**
 * Video Synthesis Module Types
 * Based on LZX Industries ecosystem and October 2025 video synthesis research
 *
 * Unlike audio synthesis (VCO/VCF/VCA), video synthesis uses different building blocks:
 * - Ramp Generators (core building block, analogous to VCOs in audio)
 * - Sync Generators (CRITICAL - video requires shared sync, unlike free-running audio)
 * - Colorizers (add color to luminance signals)
 * - Keyers (compositing based on brightness/color)
 * - Encoders/Decoders (interface with standard video formats)
 */
export type VideoModuleType =
  | 'VideoOscillator' // Wideband video-rate oscillators (e.g., LZX DWO3)
  | 'RampGenerator' // Horizontal/vertical ramp generators (e.g., LZX Angles, Scrolls, Syntonie Rampes)
  | 'ShapeGenerator' // Geometric pattern generators (e.g., LZX DSG3)
  | 'SyncGenerator' // Master sync source - CRITICAL for video systems (e.g., LZX ESG3, Visual Cortex)
  | 'VideoEncoder' // Convert Eurorack voltages to video standards HDMI/composite (e.g., LZX ESG3)
  | 'VideoDecoder' // Convert external video to Eurorack signals (e.g., Syntonie Entrée)
  | 'Colorizer' // Color processing modules (e.g., LZX Passage, Contour)
  | 'Keyer' // Luminance/chroma keying for compositing (e.g., LZX FKG3)
  | 'VideoMixer' // RGB/component mixing (e.g., LZX SMX3)
  | 'VideoProcessor' // Effects, transforms, math operations (e.g., LZX Video Motion, Video Calculator)
  | 'VideoUtility' // Switching, routing, multiples for video signals
  | 'VideoDisplay'; // Monitors, visualizers, waveform displays (e.g., LZX Escher Sketch, Diver)

/**
 * Signal Types including Video Synthesis Standards
 *
 * Video synthesis uses different voltage ranges and signal types than audio:
 * - Video: 0-1V unipolar (LZX Patchable Video Standard)
 * - Audio: ±5V bipolar
 * - Sync: 1V logic signals (horizontal ~15.734 kHz, vertical ~60 Hz)
 */
export type SignalType =
  | 'audio' // Audio signals (±5V bipolar, 20Hz-20kHz)
  | 'cv' // Control voltage (typically ±5V or 0-10V)
  | 'gate' // Gate/trigger signals (0V/+5V)
  | 'clock' // Clock signals
  | 'video' // Generic video signal (fallback)
  | 'video_rgb' // RGB color channels (0-1V per channel, LZX standard)
  | 'video_component' // YPbPr component video (luminance + color difference)
  | 'video_composite' // Composite NTSC/PAL video output
  | 'video_sync' // Sync signals (1V logic, line rate ~15.734 kHz)
  | 'video_luminance' // Grayscale/luma signal (0-1V)
  | 'video_ramp'; // Horizontal/vertical ramps (linear waveforms)

export interface ModuleInput {
  name: string;
  type: SignalType;
  voltageRange?: string; // e.g., "-5V to +5V", "0-10V"
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
  hp: number; // Horizontal Pitch (width in Eurorack units)
  depth?: number; // Depth in mm
  power: {
    positive12V?: number; // mA
    negative12V?: number; // mA
    positive5V?: number; // mA
  };
  inputs: ModuleInput[];
  outputs: ModuleOutput[];
  description?: string;
  specialCapabilities?: string[]; // e.g., ["through-zero FM", "waveshaping"]
  moduleGridUrl?: string;
  position?: {
    // Position in rack
    row: number;
    column: number;
  };
}

export interface ModuleDatabase {
  [moduleId: string]: Module;
}
