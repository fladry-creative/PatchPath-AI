/**
 * Technique Information Database
 * Comprehensive definitions for synthesis techniques
 */

export interface TechniqueInfo {
  id: string;
  name: string;
  icon: string;
  shortDescription: string;
  fullDescription: string;
  category: 'video' | 'audio' | 'hybrid';
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  // What you need
  requiredModules: string[];
  optionalModules?: string[];

  // How to do it
  basicPatch: string;
  tips: string[];

  // Examples
  examples: string[];
  soundCharacter?: string; // For audio techniques
  visualCharacter?: string; // For video techniques

  // Related
  relatedTechniques?: string[];
}

export const TECHNIQUE_DATABASE: Record<string, TechniqueInfo> = {
  // ==================== VIDEO TECHNIQUES ====================

  'geometric-patterns': {
    id: 'geometric-patterns',
    name: 'Geometric Patterns',
    icon: '📐',
    shortDescription: 'Create lines, circles, and shapes using ramp generators',
    fullDescription:
      'Geometric pattern synthesis uses ramp generators (horizontal and vertical) as the foundation for creating shapes. By multiplying, inverting, and combining ramps, you can create lines, grids, circles, spirals, and complex geometric forms.',
    category: 'video',
    difficulty: 'beginner',
    requiredModules: ['Sync Generator', 'Ramp Generator (H+V)', 'Video Encoder'],
    optionalModules: ['Multiplier', 'Colorizer', 'Video Mixer'],
    basicPatch:
      '1. Distribute sync to all modules\n2. Patch H-Ramp to one encoder input\n3. Patch V-Ramp to another encoder input\n4. Adjust encoder levels to create lines\n5. Add colorizer for color',
    tips: [
      'Start with single ramps to understand behavior',
      'Multiplying ramps together creates circles/ellipses',
      'Inverting ramps flips shapes',
      'Mix multiple ramps for complex patterns',
    ],
    examples: [
      'Horizontal line: H-Ramp → Encoder',
      'Vertical line: V-Ramp → Encoder',
      'Circle: H-Ramp × V-Ramp → Encoder',
      'Grid: Mix H-Ramp + V-Ramp → Encoder',
    ],
    visualCharacter:
      'Clean, precise geometric shapes with hard edges. Classic video synthesis aesthetic.',
    relatedTechniques: ['ramp-multiplication', 'feedback-patching'],
  },

  'ramp-multiplication': {
    id: 'ramp-multiplication',
    name: 'Ramp Multiplication',
    icon: '✖️',
    shortDescription: 'Multiply ramps to create circles, ellipses, and complex curves',
    fullDescription:
      'Multiplying horizontal and vertical ramps together creates circular and elliptical shapes. This is the fundamental technique for creating curved forms in video synthesis. By adjusting the amplitude of each ramp before multiplication, you control the aspect ratio of the resulting shape.',
    category: 'video',
    difficulty: 'intermediate',
    requiredModules: [
      'Sync Generator',
      'Ramp Generator (H+V)',
      'Multiplier or Video Processor',
      'Video Encoder',
    ],
    optionalModules: ['Attenuator', 'Offset', 'Colorizer'],
    basicPatch:
      '1. Patch H-Ramp to Multiplier input 1\n2. Patch V-Ramp to Multiplier input 2\n3. Patch Multiplier output to Encoder\n4. Adjust ramp levels for shape control',
    tips: [
      'Equal amplitude H+V ramps = perfect circle',
      'Unequal amplitudes = ellipse or oval',
      'Add DC offset to move shapes around screen',
      'Multiply by audio LFO for organic motion',
    ],
    examples: [
      'Circle: H-Ramp (1V) × V-Ramp (1V)',
      'Horizontal ellipse: H-Ramp (0.5V) × V-Ramp (1V)',
      'Moving circle: Add offset to multiplier output',
      'Pulsing circle: Modulate ramp amplitude with LFO',
    ],
    visualCharacter: 'Smooth curves and circular forms. Can be very organic when modulated.',
    relatedTechniques: ['geometric-patterns', 'modulation-mapping'],
  },

  'feedback-patching': {
    id: 'feedback-patching',
    name: 'Feedback Patching',
    icon: '🔄',
    shortDescription: 'Route video output back into input for recursive, evolving patterns',
    fullDescription:
      'Feedback in video synthesis creates self-referential, recursive images that evolve over time. By routing the video output (or a processed version) back into the input, you create feedback loops that can produce trails, echoes, and infinitely complex evolving patterns. This is one of the most powerful techniques for creating organic, unpredictable visuals.',
    category: 'video',
    difficulty: 'advanced',
    requiredModules: [
      'Sync Generator',
      'Video Decoder',
      'Video Encoder',
      'Video Mixer or Processor',
    ],
    optionalModules: ['Colorizer', 'Keyer', 'Delay'],
    basicPatch:
      '1. Create basic video signal\n2. Decode video to component signals\n3. Process/mix components\n4. Feed processed signal back to encoder input\n5. Mix feedback with fresh signal',
    tips: [
      'Start with low feedback levels (10-20%)',
      'Too much feedback = unstable image or pure white',
      'Add colorizer in feedback loop for color shifting',
      'Use keyer to control feedback regions',
      'Decay control is critical for stability',
    ],
    examples: [
      'Video trails: Encoder → Decoder → Mixer (80% feedback)',
      'Color shifting: Add colorizer in feedback path',
      'Kaleidoscope: Add keyer + rotation in loop',
      'Echo effect: Add video delay in feedback path',
    ],
    visualCharacter:
      'Organic, evolving, often psychedelic. Can range from subtle trails to chaotic complexity.',
    relatedTechniques: ['keying-compositing', 'color-modulation'],
  },

  'keying-compositing': {
    id: 'keying-compositing',
    name: 'Keying & Compositing',
    icon: '🎭',
    shortDescription: 'Layer and combine multiple video sources using threshold-based switching',
    fullDescription:
      'Keying (chromakey/lumakey) allows you to composite multiple video sources by using brightness or color thresholds to switch between sources. This is the video equivalent of mixing in audio, but with spatial control. You can create layered compositions, cutouts, overlays, and complex multi-source patches.',
    category: 'video',
    difficulty: 'intermediate',
    requiredModules: ['Sync Generator', 'Keyer', 'Video Encoder (multiple)', 'Video Mixer'],
    optionalModules: ['Colorizer', 'Video Processor'],
    basicPatch:
      '1. Create two separate video sources\n2. Patch both to Keyer inputs (A/B)\n3. Set key threshold (brightness or color)\n4. Output shows A where key signal is high, B where low',
    tips: [
      'Lumakey = brightness threshold (most common)',
      'Chromakey = color-based selection',
      'Adjust threshold to control transition',
      'Use processed video as key signal for creative effects',
      'Stack multiple keyers for complex composites',
    ],
    examples: [
      'Simple composite: Shapes (A) keyed over ramps (B)',
      'Cutout effect: Circle as key signal',
      'Dynamic masking: LFO-modulated key threshold',
      'Multi-layer: Chain 3+ keyers for complex scenes',
    ],
    visualCharacter:
      'Clean layered compositions. Can be collage-like or seamless depending on threshold.',
    relatedTechniques: ['geometric-patterns', 'feedback-patching'],
  },

  'color-modulation': {
    id: 'color-modulation',
    name: 'Color Modulation',
    icon: '🌈',
    shortDescription: 'Control hue, saturation, and brightness using CV signals',
    fullDescription:
      'Color modulation uses CV signals to control the color parameters of your video. This can range from simple color cycling (LFO to hue) to complex color mapping where different parts of the image respond to different modulators. Colorizers typically have inputs for hue (color wheel position), saturation (color intensity), and brightness.',
    category: 'video',
    difficulty: 'beginner',
    requiredModules: ['Sync Generator', 'Colorizer', 'Video Encoder'],
    optionalModules: ['LFO', 'Envelope', 'Audio input', 'Sequencer'],
    basicPatch:
      '1. Create monochrome video signal\n2. Patch to Colorizer input\n3. Patch LFO to Hue CV input\n4. Adjust LFO rate for color cycling speed',
    tips: [
      'LFO to hue = classic rainbow cycling',
      'Envelope to brightness = pulsing colors',
      'Audio to hue = music-reactive colors',
      'Multiple modulators = complex color behavior',
      'Attenuate CV signals to control intensity',
    ],
    examples: [
      'Rainbow cycle: Slow LFO → Hue CV',
      'Pulsing colors: Fast LFO → Saturation CV',
      'Music-reactive: Audio envelope → Hue',
      'Sequenced palette: Sequencer → Hue (quantized colors)',
    ],
    visualCharacter: 'Vibrant, dynamic colors. Can be subtle or intensely psychedelic.',
    relatedTechniques: ['modulation-mapping', 'audio-rate-modulation'],
  },

  'modulation-mapping': {
    id: 'modulation-mapping',
    name: 'Modulation Mapping',
    icon: '🗺️',
    shortDescription: 'Cross-patch audio and video CV signals for hybrid control',
    fullDescription:
      'Modulation mapping is the core of hybrid audio/video patching. Audio modules (LFOs, envelopes, sequencers) can control video parameters, and video signals can modulate audio parameters. This creates tight integration between sound and vision, where they influence each other in musically and visually interesting ways.',
    category: 'hybrid',
    difficulty: 'intermediate',
    requiredModules: ['Any audio modulation source', 'Any video parameter with CV input'],
    optionalModules: ['Attenuator', 'Offset', 'VCA for scaling'],
    basicPatch:
      '1. Patch audio LFO to video ramp speed CV\n2. Patch video sync to audio clock input\n3. Create feedback loop: audio controls video, video controls audio',
    tips: [
      'Audio LFO → Video ramp speed = music-synced motion',
      'Audio envelope → Video brightness = sound-reactive flash',
      'Video sync → Audio clock = video-locked rhythm',
      'Attenuate CV for subtle control',
      'Try opposite mappings for different effects',
    ],
    examples: [
      'Beat-synced shapes: Kick drum → Ramp speed',
      'Sound-reactive colors: Audio level → Hue',
      'Video-locked sequence: Sync → Sequencer clock',
      'Cross-modulation: LFO → Video, Video out → VCF',
    ],
    visualCharacter:
      'Tightly synchronized audio/video. Organic relationships between sound and image.',
    relatedTechniques: ['color-modulation', 'audio-rate-modulation'],
  },

  // ==================== AUDIO TECHNIQUES ====================

  'subtractive-synthesis': {
    id: 'subtractive-synthesis',
    name: 'Subtractive Synthesis',
    icon: '🎛️',
    shortDescription: 'Start with harmonically rich waveform, sculpt with filters',
    fullDescription:
      'Subtractive synthesis is the classic synthesis method: start with a harmonically rich oscillator waveform (saw, square), then remove frequencies using filters (VCF) to shape the tone. This is the foundation of most vintage synthesizer sounds and remains incredibly powerful for creating warm, evolving timbres.',
    category: 'audio',
    difficulty: 'beginner',
    requiredModules: ['VCO', 'VCF', 'VCA'],
    optionalModules: ['Envelope (EG)', 'LFO', 'Attenuator'],
    basicPatch:
      '1. VCO (saw wave) → VCF input\n2. VCF output → VCA input\n3. Envelope → VCF cutoff CV (for filter sweep)\n4. Envelope → VCA CV (for amplitude contour)',
    tips: [
      'Saw wave = bright, full spectrum start',
      'Square wave = hollow, odd harmonics',
      'Envelope to filter cutoff = classic "wah" sweep',
      'Resonance adds character and emphasis',
      'High resonance = screaming, aggressive tone',
    ],
    examples: [
      'Classic bass: Saw → Lowpass filter (low cutoff)',
      'Pad: Saw → Lowpass filter (slow envelope)',
      'Lead: Saw → Lowpass filter (fast attack, high resonance)',
      'Pluck: Saw → Lowpass (fast decay envelope to filter)',
    ],
    soundCharacter: 'Warm, vintage, versatile. From deep bass to screaming leads.',
    relatedTechniques: ['filter-fm', 'modulation-madness'],
  },

  'fm-synthesis': {
    id: 'fm-synthesis',
    name: 'FM Synthesis',
    icon: '📻',
    shortDescription: 'Modulate oscillator frequency with another oscillator for complex timbres',
    fullDescription:
      'Frequency Modulation (FM) synthesis uses one oscillator (modulator) to modulate the frequency of another oscillator (carrier). This creates complex, evolving harmonic spectra that can range from subtle vibrato to bell-like tones to aggressive, inharmonic timbres. FM is extremely powerful but can be unpredictable.',
    category: 'audio',
    difficulty: 'intermediate',
    requiredModules: ['VCO (carrier)', 'VCO (modulator)', 'VCA or Attenuator'],
    optionalModules: ['Envelope (for modulation depth)', 'VCF (to tame harsh tones)'],
    basicPatch:
      '1. Modulator VCO → Attenuator or VCA\n2. Attenuated signal → Carrier VCO FM input\n3. Carrier output → Audio out\n4. Envelope → VCA (to control FM depth)',
    tips: [
      'Harmonic ratios matter: 1:2 = octave, 1:1 = unison',
      'Integer ratios (2:1, 3:2) = harmonic tones',
      'Non-integer ratios = inharmonic, bell-like',
      'Modulation depth controls brightness',
      'Start with low modulation, increase gradually',
    ],
    examples: [
      'Bell tones: Carrier 100Hz, Modulator 314Hz (π ratio)',
      'Brass: Carrier 220Hz, Modulator 440Hz (1:2)',
      'Evolving pad: Envelope to FM depth VCA',
      'Aggressive bass: Low carrier, high mod depth',
    ],
    soundCharacter: 'Bright, metallic, complex. Can be harmonic or inharmonic.',
    relatedTechniques: ['waveshaping', 'audio-rate-modulation'],
  },

  waveshaping: {
    id: 'waveshaping',
    name: 'Waveshaping',
    icon: '〰️',
    shortDescription: 'Distort waveforms to add harmonics and grit',
    fullDescription:
      'Waveshaping uses nonlinear transfer functions (distortion, folding, clipping) to alter the shape of a waveform, adding harmonics and complexity. This can range from subtle warming to extreme distortion. Wave folders are particularly popular, creating fractal-like harmonic content as the input amplitude increases.',
    category: 'audio',
    difficulty: 'intermediate',
    requiredModules: ['VCO', 'Wavefolder or Distortion'],
    optionalModules: ['VCA (to control drive)', 'VCF (to tame harsh harmonics)', 'Envelope'],
    basicPatch:
      '1. VCO (sine or triangle) → Wavefolder input\n2. Increase VCO level or folder drive\n3. Observe harmonic content increase\n4. Optional: VCF to shape output',
    tips: [
      'Sine wave = cleanest result (pure harmonics)',
      'Triangle = next cleanest',
      'More drive = more harmonics = brighter',
      'Modulate drive with envelope for dynamics',
      'Combine with FM for extreme complexity',
    ],
    examples: [
      'Warm bass: Sine → Wavefolder (low drive)',
      'Screaming lead: Triangle → Wavefolder (high drive)',
      'Evolving texture: Envelope → Folder drive CV',
      'Chord tones: Sine → Heavy folding (generates overtone series)',
    ],
    soundCharacter: 'Bright, aggressive, harmonically rich. Can be smooth or harsh.',
    relatedTechniques: ['fm-synthesis', 'filter-fm'],
  },

  'generative-sequencing': {
    id: 'generative-sequencing',
    name: 'Generative Sequencing',
    icon: '🎲',
    shortDescription: 'Use randomness and modulation to create evolving, non-repeating patterns',
    fullDescription:
      'Generative techniques use randomness, probability, and modulation to create musical patterns that evolve over time without direct user control. This can range from simple random note selection to complex systems where multiple parameters influence each other, creating emergent musical behavior.',
    category: 'audio',
    difficulty: 'advanced',
    requiredModules: ['Random source or Sample & Hold', 'Sequencer or Quantizer'],
    optionalModules: ['Clock divider', 'Logic modules', 'Probability modules'],
    basicPatch:
      '1. Clock → Sample & Hold trigger\n2. Random source → S&H input\n3. S&H output → Quantizer (for musical notes)\n4. Quantizer → VCO pitch',
    tips: [
      'Quantizer makes random notes musical',
      'Clock dividers create rhythmic variety',
      'Multiple random sources = polyphony',
      'Patch modulation to control randomness level',
      'Use logic gates to add rules/constraints',
    ],
    examples: [
      'Wandering melody: Random → Quantizer → VCO',
      'Euclidean rhythms: Clock divider patterns',
      'Probability gates: Random trigger patterns',
      'Chaotic drums: Multiple randoms to different voices',
    ],
    soundCharacter: 'Unpredictable, organic, evolving. Can be melodic or rhythmic.',
    relatedTechniques: ['modulation-madness', 'west-coast-synthesis'],
  },

  'west-coast-synthesis': {
    id: 'west-coast-synthesis',
    name: 'West Coast Synthesis',
    icon: '🌊',
    shortDescription: 'Complex waveforms through modulation and waveshaping instead of filtering',
    fullDescription:
      'West Coast synthesis (pioneered by Buchla) emphasizes complex waveform generation through modulation, waveshaping, and low-pass gates instead of traditional subtractive filtering. The focus is on creating harmonic complexity at the source rather than filtering it away. This creates sounds that are more organic, percussive, and dynamic.',
    category: 'audio',
    difficulty: 'advanced',
    requiredModules: ['VCO', 'Wavefolder or Waveshaper', 'Low-pass Gate (LPG) or VCA+VCF'],
    optionalModules: ['Function generator', 'Random source', 'Modulation sources'],
    basicPatch:
      '1. VCO (sine) → Wavefolder\n2. Folder output → Low-pass Gate\n3. Function generator → LPG CV (strike)\n4. Random → VCO pitch (for variation)',
    tips: [
      'Sine waves are the foundation',
      'LPG creates natural attack/decay',
      'Modulate everything (no static settings)',
      'Embrace imperfection and variation',
      'Less filtering, more waveform manipulation',
    ],
    examples: [
      'Bongos: Sine → Folder → LPG (fast decay)',
      'Bells: Sine → Heavy folding → LPG',
      'Organic bass: Sine → Folder (envelope to drive)',
      'Melodic percussion: Random pitch + LPG',
    ],
    soundCharacter: 'Organic, percussive, alive. Sounds that breathe and evolve.',
    relatedTechniques: ['waveshaping', 'generative-sequencing'],
  },

  'modulation-madness': {
    id: 'modulation-madness',
    name: 'Modulation Madness',
    icon: '🌀',
    shortDescription: 'Cross-modulate everything for evolving, complex textures',
    fullDescription:
      'Modulation madness is the philosophy of patching modulators to control other modulators, creating complex webs of interdependence. LFOs modulate LFOs, envelopes control envelope times, sequencers control sequencer speeds. This creates sounds and patterns that evolve organically over long periods, with emergent behavior that surprises even the patcher.',
    category: 'audio',
    difficulty: 'advanced',
    requiredModules: ['Multiple LFOs', 'VCO', 'VCF'],
    optionalModules: ['Envelopes', 'Sequencers', 'Attenuators', 'Random sources'],
    basicPatch:
      '1. LFO 1 (slow) → LFO 2 rate CV\n2. LFO 2 (faster) → VCO pitch\n3. LFO 1 → VCF cutoff\n4. Create feedback loops between modulators',
    tips: [
      'Start simple, add modulation gradually',
      'Use attenuators to control modulation depth',
      'Slow modulators create long-term evolution',
      'Fast modulators create rhythmic variation',
      'Record long takes—patterns emerge over time',
    ],
    examples: [
      'Evolving drone: LFO → LFO → VCO + VCF',
      'Chaotic sequence: LFO → Sequencer clock rate',
      'Self-modulating filter: LFO → VCF, VCF → LFO rate',
      'Organic rhythms: Multiple LFOs → Clock dividers',
    ],
    soundCharacter: 'Evolving, unpredictable, organic. Never repeats exactly.',
    relatedTechniques: ['generative-sequencing', 'west-coast-synthesis'],
  },

  'filter-fm': {
    id: 'filter-fm',
    name: 'Filter FM',
    icon: '🎚️',
    shortDescription: 'Use audio-rate modulation of filter cutoff for unique timbres',
    fullDescription:
      'Filter FM involves modulating the cutoff frequency of a filter at audio rates (instead of slow LFO rates). This creates FM-like sidebands and can generate complex, metallic timbres similar to FM synthesis but with a different character. Self-resonating filters can even act as sine wave oscillators when driven into self-oscillation.',
    category: 'audio',
    difficulty: 'advanced',
    requiredModules: ['VCO', 'VCF (with audio-rate CV input)', 'VCO (modulator)'],
    optionalModules: ['VCA (to control modulation depth)', 'Attenuator'],
    basicPatch:
      '1. Carrier VCO → VCF audio input\n2. Modulator VCO → VCF cutoff CV\n3. Set filter resonance high\n4. Adjust modulation depth',
    tips: [
      'High resonance emphasizes effect',
      'Self-oscillating filters = extra harmonics',
      'Start with low modulation, increase slowly',
      'Works best with low carrier frequencies',
      'Combine with waveshaping for extreme sounds',
    ],
    examples: [
      'Metallic bass: Low carrier → Filter FM',
      'Screaming lead: High resonance + heavy FM',
      'Evolving drone: Envelope to FM depth',
      'Harmonic bells: Filter self-oscillation + FM',
    ],
    soundCharacter: 'Metallic, aggressive, FM-like but with filter characteristics.',
    relatedTechniques: ['fm-synthesis', 'subtractive-synthesis'],
  },

  'audio-rate-modulation': {
    id: 'audio-rate-modulation',
    name: 'Audio-Rate Modulation',
    icon: '⚡',
    shortDescription: 'Modulate parameters at audio speeds for complex, metallic timbres',
    fullDescription:
      'Audio-rate modulation means modulating any parameter (not just pitch) at audio frequencies (>20Hz). This can be applied to filters, VCAs, waveshapers, or any CV input. It creates sidebands, intermodulation, and complex harmonic content that would be impossible with traditional low-frequency modulation.',
    category: 'audio',
    difficulty: 'advanced',
    requiredModules: ['VCO (modulator)', 'Any module with fast CV input'],
    optionalModules: ['VCA', 'Attenuator', 'Waveshaper'],
    basicPatch:
      '1. Carrier signal → Target module input\n2. VCO → Target CV input (at audio rate)\n3. Adjust modulation depth\n4. Experiment with different carrier/modulator ratios',
    tips: [
      'Works on VCAs, VCFs, waveshapers, anything fast',
      'Creates ring modulation effects on VCAs',
      'Metallic, inharmonic on most targets',
      'Low depths can add subtle motion',
      'High depths = extreme timbral changes',
    ],
    examples: [
      'Ring mod: Audio → VCA, Audio → VCA CV',
      'Filter FM: Audio → VCF CV',
      'Wavefolder FM: Audio → Folder drive CV',
      'Complex tones: Multiple audio-rate mods on one target',
    ],
    soundCharacter: 'Metallic, complex, often inharmonic. Very modern sound design.',
    relatedTechniques: ['fm-synthesis', 'filter-fm', 'waveshaping'],
  },
};

export function getTechniqueInfo(techniqueId: string): TechniqueInfo | undefined {
  return TECHNIQUE_DATABASE[techniqueId];
}

export function getTechniquesByCategory(category: 'video' | 'audio' | 'hybrid'): TechniqueInfo[] {
  return Object.values(TECHNIQUE_DATABASE).filter((tech) => tech.category === category);
}

export function getAllTechniques(): TechniqueInfo[] {
  return Object.values(TECHNIQUE_DATABASE);
}

/**
 * Try to match a technique string to our database
 * Handles variations like "FM" → "fm-synthesis", "Geometric" → "geometric-patterns"
 */
export function findTechniqueByName(name: string): TechniqueInfo | undefined {
  const normalized = name.toLowerCase().trim();

  // Direct match
  if (TECHNIQUE_DATABASE[normalized]) {
    return TECHNIQUE_DATABASE[normalized];
  }

  // Fuzzy match
  for (const [id, info] of Object.entries(TECHNIQUE_DATABASE)) {
    if (
      info.name.toLowerCase().includes(normalized) ||
      normalized.includes(info.name.toLowerCase()) ||
      id.includes(normalized) ||
      normalized.includes(id)
    ) {
      return info;
    }
  }

  return undefined;
}
