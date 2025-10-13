/**
 * Educational content for module types
 * Powers tooltips and educational features
 */

export interface ModuleTypeInfo {
  type: string;
  icon: string;
  title: string;
  description: string;
  purpose: string;
  examples: string[];
  critical?: boolean; // Red indicator for critical modules
  videoOnly?: boolean; // Only relevant for video racks
  audioOnly?: boolean; // Only relevant for audio racks
  category: 'video' | 'audio' | 'utility';
}

export const MODULE_TYPE_INFO: Record<string, ModuleTypeInfo> = {
  // === VIDEO SYNTHESIS MODULES ===
  SyncGenerator: {
    type: 'SyncGenerator',
    icon: '⚡',
    title: 'Sync Generator',
    description: 'Master timing source that synchronizes all video modules',
    purpose:
      'Provides essential timing signals. Without sync, video images will tear, roll, or fail to display.',
    examples: ['LZX ESG3', 'LZX Visual Cortex', 'LZX Chromagnon', 'Syntonie Sortie'],
    critical: true,
    videoOnly: true,
    category: 'video',
  },

  RampGenerator: {
    type: 'RampGenerator',
    icon: '📊',
    title: 'Ramp Generator',
    description: 'Creates linear gradients that form the foundation of video patterns',
    purpose:
      'Generates horizontal or vertical ramps (gradients). Horizontal ramps create vertical bars, vertical ramps create horizontal bars.',
    examples: ['LZX Angles', 'LZX Scrolls', 'Syntonie Rampes', 'LZX Diver'],
    critical: true,
    videoOnly: true,
    category: 'video',
  },

  ShapeGenerator: {
    type: 'ShapeGenerator',
    icon: '⬢',
    title: 'Shape Generator',
    description: 'Generates geometric patterns and shapes',
    purpose: 'Creates circles, triangles, and other geometric patterns for visual composition.',
    examples: ['LZX DSG3', 'LZX Passage (shape mode)'],
    videoOnly: true,
    category: 'video',
  },

  VideoEncoder: {
    type: 'VideoEncoder',
    icon: '📺',
    title: 'Video Encoder',
    description: 'Converts Eurorack video signals to standard video formats',
    purpose: 'Encodes internal video signals to HDMI or composite video for display output.',
    examples: ['LZX ESG3', 'LZX Visual Cortex', 'Syntonie Sortie'],
    critical: true,
    videoOnly: true,
    category: 'video',
  },

  VideoDecoder: {
    type: 'VideoDecoder',
    icon: '📹',
    title: 'Video Decoder',
    description: 'Converts external video sources to Eurorack signals',
    purpose: 'Decodes HDMI/composite video from cameras or media players into processable signals.',
    examples: ['Syntonie Entrée', 'LZX Component decoder'],
    videoOnly: true,
    category: 'video',
  },

  Colorizer: {
    type: 'Colorizer',
    icon: '🎨',
    title: 'Colorizer',
    description: 'Adds RGB color to black & white (luminance) signals',
    purpose: 'Converts luminance signals into full-color RGB output with voltage-controlled hue.',
    examples: ['LZX Passage', 'LZX Contour'],
    videoOnly: true,
    category: 'video',
  },

  Keyer: {
    type: 'Keyer',
    icon: '🔑',
    title: 'Keyer',
    description: 'Composites multiple video layers using luminance or chroma keying',
    purpose: 'Combines multiple video sources, cutting between them based on brightness or color.',
    examples: ['LZX FKG3', 'Syntonie Isohélie'],
    videoOnly: true,
    category: 'video',
  },

  VideoMixer: {
    type: 'VideoMixer',
    icon: '🎛️',
    title: 'Video Mixer',
    description: 'Mixes and combines RGB video signals',
    purpose: 'Matrix mixer for combining multiple RGB sources with crossfading and effects.',
    examples: ['LZX SMX3', 'LZX Visionary'],
    videoOnly: true,
    category: 'video',
  },

  VideoProcessor: {
    type: 'VideoProcessor',
    icon: '⚙️',
    title: 'Video Processor',
    description: 'Math operations and transformations on video signals',
    purpose:
      'Multiplies, adds, inverts, or transforms video signals. Essential for complex patterns.',
    examples: [
      'LZX Multiplier',
      'LZX Video Calculator',
      'LZX Mapper',
      'Syntonie CBV001',
      'Syntonie Seuils',
    ],
    videoOnly: true,
    category: 'video',
  },

  VideoUtility: {
    type: 'VideoUtility',
    icon: '🔧',
    title: 'Video Utility',
    description: 'Signal routing, distribution, and utility functions',
    purpose: 'Multiples, switches, attenuators, and other routing utilities for video signals.',
    examples: ['LZX Staircase', 'LZX Switcher', 'LZX PAB', 'LZX PGO'],
    videoOnly: true,
    category: 'video',
  },

  VideoDisplay: {
    type: 'VideoDisplay',
    icon: '🖥️',
    title: 'Video Display',
    description: 'Built-in monitors and visualizers',
    purpose:
      'Modules with integrated displays for monitoring signals or creating hybrid instruments.',
    examples: ['LZX Escher Sketch', 'LZX Liquid TV', 'LZX Diver (with screen)'],
    videoOnly: true,
    category: 'video',
  },

  // === AUDIO SYNTHESIS MODULES ===
  VCO: {
    type: 'VCO',
    icon: '🎵',
    title: 'VCO (Voltage Controlled Oscillator)',
    description: 'Generates audio waveforms at audible frequencies',
    purpose:
      'Primary sound source in audio synthesis. Generates sine, triangle, saw, square waves.',
    examples: ['Mutable Plaits', 'Make Noise DPO', 'Intellijel Dixie'],
    critical: true,
    audioOnly: true,
    category: 'audio',
  },

  VCF: {
    type: 'VCF',
    icon: '🎚️',
    title: 'VCF (Voltage Controlled Filter)',
    description: 'Shapes timbre by filtering frequencies',
    purpose: 'Removes or emphasizes frequency ranges. Essential for subtractive synthesis.',
    examples: ['Mutable Ripples', 'Make Noise QPAS', 'Intellijel Polaris'],
    audioOnly: true,
    category: 'audio',
  },

  VCA: {
    type: 'VCA',
    icon: '🔊',
    title: 'VCA (Voltage Controlled Amplifier)',
    description: 'Controls signal amplitude (volume)',
    purpose: 'Shapes volume dynamics, typically controlled by envelopes or LFOs.',
    examples: ['Mutable Veils', 'Intellijel Quad VCA', 'Make Noise ModDemix'],
    critical: true,
    audioOnly: true,
    category: 'audio',
  },

  EG: {
    type: 'EG',
    icon: '📈',
    title: 'Envelope Generator',
    description: 'Creates control voltages that change over time',
    purpose: 'Generates ADSR or complex envelopes for shaping sound dynamics.',
    examples: ['Mutable Stages', 'Make Noise Maths', 'Intellijel Quadra'],
    audioOnly: true,
    category: 'audio',
  },

  LFO: {
    type: 'LFO',
    icon: '〰️',
    title: 'LFO (Low Frequency Oscillator)',
    description: 'Generates slow modulation signals',
    purpose: 'Creates cyclic modulation for vibrato, tremolo, and rhythmic effects.',
    examples: ['Mutable Tides', 'Make Noise Wogglebug', 'Intellijel Quadrax (LFO mode)'],
    category: 'audio',
  },

  Sequencer: {
    type: 'Sequencer',
    icon: '🎹',
    title: 'Sequencer',
    description: 'Generates melodic or rhythmic patterns',
    purpose: 'Creates repeating sequences of notes, gates, or modulation.',
    examples: ['Mutable Marbles', 'Make Noise René', 'Intellijel Metropolix'],
    category: 'audio',
  },

  Effect: {
    type: 'Effect',
    icon: '✨',
    title: 'Effect Processor',
    description: 'Processes audio with delay, reverb, distortion, etc.',
    purpose: 'Adds space, texture, and character to sounds.',
    examples: ['Mutable Clouds', 'Make Noise Erbe-Verb', 'Intellijel Rainmaker'],
    category: 'audio',
  },

  Mixer: {
    type: 'Mixer',
    icon: '🎛️',
    title: 'Audio Mixer',
    description: 'Combines multiple audio signals',
    purpose: 'Mixes multiple audio sources with level control and panning.',
    examples: ['Intellijel Planar', 'Make Noise Dynamix', 'Mutable Veils (as mixer)'],
    category: 'utility',
  },

  // === UTILITY MODULES ===
  MIDI: {
    type: 'MIDI',
    icon: '🎹',
    title: 'MIDI Interface',
    description: 'Converts MIDI messages to CV/gate signals',
    purpose: 'Connects keyboards, controllers, or DAWs to Eurorack.',
    examples: ['Intellijel uMIDI', 'Expert Sleepers FH-2', 'Mutable Yarns'],
    category: 'utility',
  },

  Clock: {
    type: 'Clock',
    icon: '⏱️',
    title: 'Clock/Timing',
    description: 'Generates tempo and timing signals',
    purpose: 'Provides master clock and clock divisions for synchronization.',
    examples: ['Intellijel Tempi', 'Make Noise Tempi', "Pamela's New Workout"],
    category: 'utility',
  },

  Logic: {
    type: 'Logic',
    icon: '🔀',
    title: 'Logic Module',
    description: 'Boolean logic and gate processing',
    purpose: 'Performs AND, OR, NOT operations on gates for complex rhythms.',
    examples: ['Mutable Branches', 'Intellijel Logic', 'Joranalogue Compare 2'],
    category: 'utility',
  },

  Random: {
    type: 'Random',
    icon: '🎲',
    title: 'Random/Sample & Hold',
    description: 'Generates random voltages or values',
    purpose: 'Creates unpredictable modulation for generative patches.',
    examples: ['Mutable Marbles', 'Make Noise Wogglebug', 'Noise Engineering Variatic'],
    category: 'utility',
  },

  Utility: {
    type: 'Utility',
    icon: '🔧',
    title: 'Utility Module',
    description: 'Multiples, attenuators, offsets, and routing',
    purpose: 'Essential signal manipulation and routing utilities.',
    examples: ['Intellijel Triatt', 'Mutable Links', 'Happy Nerding 3xMIA'],
    category: 'utility',
  },

  Other: {
    type: 'Other',
    icon: '❓',
    title: 'Other Module',
    description: 'Specialized or uncategorized module',
    purpose: "Unique functionality that doesn't fit standard categories.",
    examples: [],
    category: 'utility',
  },
};

/**
 * Get module info by type
 */
export function getModuleInfo(type: string): ModuleTypeInfo | undefined {
  return MODULE_TYPE_INFO[type];
}

/**
 * Get appropriate icon for module type
 */
export function getModuleIcon(type: string): string {
  return MODULE_TYPE_INFO[type]?.icon || '❓';
}

/**
 * Check if module type is video-related
 */
export function isVideoModule(type: string): boolean {
  return MODULE_TYPE_INFO[type]?.videoOnly === true;
}

/**
 * Check if module type is audio-related
 */
export function isAudioModule(type: string): boolean {
  return MODULE_TYPE_INFO[type]?.audioOnly === true;
}

/**
 * Check if module type is critical (requires warning if missing)
 */
export function isCriticalModule(type: string): boolean {
  return MODULE_TYPE_INFO[type]?.critical === true;
}
