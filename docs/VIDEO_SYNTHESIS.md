# Video Synthesis Support

## Overview

PatchPath AI now includes comprehensive support for video synthesis modules and racks. This feature enables the AI to understand, analyze, and generate patches for video synthesis systems, particularly those built around the LZX Industries ecosystem and other video synthesis manufacturers.

**Update**: October 2025 - Complete video synthesis support implementation

## What is Video Synthesis?

Video synthesis is the generation of electronic video signals using modular synthesizers. Unlike audio synthesis (which generates sound), video synthesis creates moving images and visual patterns in real-time.

### Key Differences from Audio Synthesis

| Aspect            | Audio Synthesis         | Video Synthesis              |
| ----------------- | ----------------------- | ---------------------------- |
| **Voltage Range** | ±5V bipolar             | 0-1V unipolar (LZX standard) |
| **Frequency**     | 20 Hz - 20 kHz          | ~400 kHz (horizontal scan)   |
| **Sync**          | Optional (free-running) | **MANDATORY**                |
| **Dimensions**    | 1D (time)               | 2D (horizontal + vertical)   |
| **Core Module**   | VCO (oscillator)        | Ramp Generator               |

## Supported Video Module Types

PatchPath AI recognizes the following video module categories:

### Core Video Modules

1. **SyncGenerator** (CRITICAL)
   - Master timing source for the entire system
   - Examples: LZX ESG3, Visual Cortex, Chromagnon
   - **Without sync, video systems will NOT function**

2. **RampGenerator** (Core Building Block)
   - Creates linear gradients (horizontal/vertical)
   - Examples: LZX Angles, Scrolls, Diver; Syntonie Rampes
   - Analogous to VCOs in audio synthesis

3. **ShapeGenerator**
   - Generates geometric patterns
   - Examples: LZX DSG3

4. **VideoEncoder**
   - Converts Eurorack signals to HDMI/composite video
   - Examples: LZX ESG3, Visual Cortex
   - Required for output to displays

5. **VideoDecoder**
   - Converts external video to Eurorack signals
   - Examples: Syntonie Entrée, Component decoder
   - Enables processing of camera/playback sources

### Processing & Effects

6. **Colorizer**
   - Adds RGB color to luminance signals
   - Examples: LZX Passage, Contour

7. **Keyer**
   - Luminance/chroma keying for compositing layers
   - Examples: LZX FKG3, Syntonie Isohélie

8. **VideoMixer**
   - RGB matrix mixing and signal combination
   - Examples: LZX SMX3

9. **VideoProcessor**
   - Math operations, transforms, effects
   - Examples: LZX Multiplier, Video Calculator, Mapper, Polar Fringe
   - Syntonie: CBV001, CBV002, VU008, Seuils

### Utilities & Display

10. **VideoUtility**
    - Signal routing, distribution, multiples
    - Examples: LZX Staircase, Switcher, PAB, PGO

11. **VideoDisplay**
    - Monitors, visualizers, waveform displays
    - Examples: LZX Escher Sketch, Liquid TV, Diver

## Supported Manufacturers

### LZX Industries

Primary manufacturer of Eurorack video synthesis modules. PatchPath AI has specific knowledge of LZX modules including:

- **Gen3 Modules**: ESG3, DSG3, DWO3, FKG3, SMX3, TBC2
- **Classic Modules**: Visual Cortex, Passage, Contour, Angles, Scrolls, Diver
- **Advanced**: Chromagnon (analog + FPGA), Escher Sketch (with display)

### Syntonie

European DIY video synthesis manufacturer:

- Rampes, Entrée, Sortie, Isohélie, Seuils, Component
- CBV series (Circuit Bent Video)
- VU008 and other utilities

### Generic Video Modules

PatchPath AI will also detect generic video modules from any manufacturer using pattern matching on names and descriptions.

## Video Synthesis Workflow

The typical video synthesis signal path:

```
1. Sync Distribution → ALL modules must receive sync
2. Ramp Generation → Create horizontal/vertical gradients
3. Processing → Multiply, add, transform ramps
4. Colorization → Convert luminance to RGB
5. Keying/Mixing → Composite multiple layers
6. Encoding → Convert to HDMI/composite
7. Display → Output to monitor/projector
```

### CRITICAL: Sync Distribution

**Video synthesis systems REQUIRE sync distribution as the FIRST step in any patch.**

Without sync:

- Image will tear or roll
- Colors will be unstable
- Display may not lock to signal
- System will not function properly

Example sync distribution:

```
ESG3 Sync Out → Angles Sync In
ESG3 Sync Out → Scrolls Sync In
ESG3 Sync Out → Passage Sync In
ESG3 Sync Out → SMX3 Sync In
```

## Important Concepts

### 1. Horizontal vs Vertical (Counterintuitive!)

⚠️ **This confuses everyone at first:**

- **Horizontal ramp** → creates **VERTICAL bars** on screen
- **Vertical ramp** → creates **HORIZONTAL bars** on screen

**Why?** The ramp varies during the scan direction. A horizontal scan with changing voltage creates a vertical gradient.

### 2. Voltage Compatibility

- **Video signals**: 0-1V unipolar (LZX Patchable Video Standard)
- **Audio signals**: ±5V bipolar

**Using audio modules in video context:**

- Audio oscillators will CLIP/SATURATE video signals
- This can be creative (hard edges, high contrast) but is not "clean"
- Always warn users about voltage incompatibility

**LFOs and Envelopes:**

- Can modulate video ramp speeds (animation)
- Can gate video signals on/off
- Generally work well in hybrid setups

### 3. Feedback Loops

Video feedback is extremely powerful but:

- Can be unstable/unpredictable
- May cause runaway brightness
- Creates evolving, organic patterns
- Start with subtle amounts and adjust

### 4. Ramp-Based Workflow

Unlike audio (VCO → VCF → VCA), video uses:

- Ramps as the foundation
- Math operations (multiply, add) to combine ramps
- Colorizers to add RGB
- Keyers to composite layers

## Rack Type Classification

### Pure Video Rack (>50% video modules)

Characteristics:

- Majority of modules are video synthesis
- Does NOT require VCO/VCF/VCA
- MUST have SyncGenerator
- Should have RampGenerator, VideoEncoder

Example:

```
- ESG3 (Sync + Encoder)
- Angles (Ramp)
- Scrolls (Ramp)
- Passage (Colorizer)
- FKG3 (Keyer)
- SMX3 (Mixer)
```

### Hybrid Rack (≤50% video modules)

Characteristics:

- Mix of audio and video modules
- Can do audio-visual cross-modulation
- Requires warnings about voltage compatibility
- Creative experimentation encouraged

Example:

```
- VCO (Audio)
- VCF (Audio)
- ESG3 (Video Sync)
- Angles (Video Ramp)
```

Cross-modulation possibilities:

- Audio VCO → Video Colorizer (clipped modulation)
- LFO → Ramp speed (animated patterns)
- Envelope → Video keyer threshold

## Capability Analysis

When analyzing video racks, PatchPath AI checks for:

### Critical Requirements

✅ **Sync Generator** - MANDATORY for video racks
✅ **Video Encoder** - Needed for output to displays
✅ **Ramp Generator** - Core building block

### Warnings

- ⚠️ No sync generator → System will NOT function
- ⚠️ No encoder → Cannot output to displays
- ⚠️ No ramp generator → Cannot create patterns
- ⚠️ Hybrid rack → Audio ±5V vs Video 0-1V incompatibility
- ⚠️ Feedback loops → Can be unstable

### Technique Detection

Based on available modules, the AI identifies possible techniques:

- 🎨 Geometric color patterns (ramps + colorizers)
- 🎬 Video compositing & keying
- 📹 External video processing
- 🌀 Raster manipulation & feedback
- 🔊🎨 Audio-visual cross-modulation (hybrid racks)
- ✨ Complete video workflow (sync → ramps → processing → output)

## Patch Generation

When generating patches for video racks, Claude follows these rules:

### 1. Sync ALWAYS First

```json
"patchingOrder": [
  "Step 1: Distribute sync from ESG3 to all video modules (Angles, Scrolls, Passage, SMX3)",
  "Step 2: Generate vertical bars with Angles (horizontal ramp)",
  "Step 3: Generate horizontal bars with Scrolls (vertical ramp)",
  ...
]
```

### 2. Ramp-Based Workflow

```
Ramps → Processing → Colorization → Keying → Mixing → Encoding
```

### 3. Educational Explanations

Patches include "whyThisWorks" sections explaining:

- Sync requirements
- Horizontal/vertical confusion
- Voltage ranges
- Signal flow

### 4. Voltage Compatibility Warnings

For hybrid racks:

```
"tips": [
  "⚠️ Audio VCO outputs ±5V which will clip the 0-1V video signal - expect hard edges and high contrast",
  "💡 This clipping can be creative - experiment with VCO waveforms for different edge textures"
]
```

## Testing

### Test Coverage

Video synthesis features are tested with:

**Unit Tests** (`__tests__/lib/`):

- `scraper-video-detection.test.ts` (39 tests) - Module type detection
- `analyzer-video.test.ts` (25 tests) - Capability analysis and warnings

**Total**: 64 video synthesis tests, all passing ✅

### Test Racks

Examples used for testing:

- LZX professional rack: https://modulargrid.net/e/racks/view/1213836
- Minimal video system (sync + ramps + encoder)
- Hybrid audio+video rack
- Incomplete rack (missing sync)

## API Usage

### Analyzing a Video Rack

```typescript
import { scrapeModularGridRack } from '@/lib/scraper/modulargrid';
import { analyzeRack, analyzeRackCapabilities } from '@/lib/scraper/analyzer';

// Scrape LZX rack
const rack = await scrapeModularGridRack('https://modulargrid.net/e/racks/view/1213836');

// Analyze capabilities
const capabilities = analyzeRackCapabilities(rack.modules);

console.log(capabilities.isVideoRack); // true
console.log(capabilities.hasVideoSync); // true
console.log(capabilities.videoSyncSource); // "ESG3" or "Visual Cortex"
console.log(capabilities.hasRampGenerator); // true

// Get analysis with warnings/suggestions
const analysis = analyzeRack(rack);

console.log(analysis.warnings); // Video-specific warnings
console.log(analysis.techniquesPossible); // Video synthesis techniques
```

### Generating a Video Patch

```typescript
import { generatePatch } from '@/lib/ai/claude';

const patch = await generatePatch(
  rack,
  capabilities,
  analysis,
  'Create geometric color patterns with feedback',
  {
    technique: 'Raster manipulation',
    genre: 'Abstract visual',
  }
);

console.log(patch.patchingOrder);
// Step 1: Distribute sync from ESG3...
// Step 2: Generate vertical bars with Angles...
// Step 3: Colorize with Passage...
```

## Known Limitations

1. **Module I/O Detection**: Scraper doesn't parse individual inputs/outputs (ModularGrid limitation)
2. **Video Standards**: Assumes LZX 0-1V standard (VGA uses 0-0.7V, may vary by manufacturer)
3. **Patch Validation**: No runtime check that suggested connections are physically possible
4. **Hybrid Complexity**: Audio-video voltage conversion requires manual attenuation/scaling

## Future Enhancements

Potential improvements for future releases:

- Visual patch diagrams (2D representation)
- Sync distribution validation
- Color space visualization
- Integration with LZX Videomancer (FPGA platform)
- Support for other manufacturers (expanded pattern matching)
- Module I/O database enrichment

## Resources

### Official Documentation

- **LZX Industries**: https://lzxindustries.net
- **LZX Technical Docs**: https://docs.lzxindustries.net
- **LZX Community**: https://community.lzxindustries.net
- **Syntonie**: https://syntonie.ovh

### Learning Video Synthesis

- LZX Getting Started: https://lzxindustries.net/getting-started
- LZX YouTube Channel: Video tutorials
- MOD WIGGLER Video Forum: https://modwiggler.com/forum/viewforum.php?f=48

## Support

For issues or questions about video synthesis support:

- GitHub Issues: https://github.com/anthropics/patchpath-ai/issues
- Tag with: `video-synthesis` label

---

**Generated**: October 2025
**PatchPath AI Version**: 0.2.0 (Video Synthesis Update)
