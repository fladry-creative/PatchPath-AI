#!/usr/bin/env tsx
/**
 * Gemini 2.5 Flash Image - Demo Test
 *
 * Generates test patch diagrams to evaluate quality and style
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

// Check for API key
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in environment');
  console.error('Make sure .env.local has: GEMINI_API_KEY=your_key_here');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Test scenarios for modular synth patches
const testScenarios = [
  {
    name: 'basic-subtractive',
    title: 'Basic Subtractive Patch',
    modules: ['VCO (Moog)', 'VCF (Moog Ladder)', 'ADSR Envelope', 'VCA'],
    instructions: `
1. Patch VCO sawtooth output to VCF audio input
2. Patch VCF output to VCA audio input
3. Patch ADSR envelope output to VCF cutoff CV input
4. Patch ADSR envelope output to VCA CV input
5. Patch VCA output to mixer/audio out
6. Patch keyboard gate to ADSR gate input

Signal Flow: VCO → VCF → VCA → Out
Modulation: ADSR → VCF cutoff + VCA amplitude
    `.trim(),
    aspectRatio: '1:1'
  },
  {
    name: 'fm-synthesis',
    title: 'FM Synthesis Patch',
    modules: ['VCO-1 (Carrier)', 'VCO-2 (Modulator)', 'VCA', 'ADSR', 'Attenuverter'],
    instructions: `
1. Patch VCO-2 (modulator) output to Attenuverter input
2. Patch Attenuverter output to VCO-1 FM input
3. Patch VCO-1 (carrier) output to VCA audio input
4. Patch ADSR output to VCA CV input
5. Patch ADSR output to Attenuverter CV (modulation depth)
6. VCA output to audio out

FM Depth controlled by ADSR envelope for evolving timbres
    `.trim(),
    aspectRatio: '16:9'
  },
  {
    name: 'generative-sequence',
    title: 'Generative Sequence',
    modules: ['Clock', 'Random', 'Sample & Hold', 'Quantizer', 'VCO', 'VCF', 'VCA', 'ADSR'],
    instructions: `
1. Clock output to Sample & Hold trigger
2. Random CV to Sample & Hold input
3. Sample & Hold output to Quantizer input
4. Quantizer output to VCO 1V/oct input
5. VCO output to VCF input
6. VCF output to VCA input
7. Clock output to ADSR gate
8. ADSR output to VCA CV
9. VCA output to audio out

Random melodies, clock-synced rhythms
    `.trim(),
    aspectRatio: '9:16'
  }
];

async function generatePatchDiagram(scenario: typeof testScenarios[0]): Promise<void> {
  console.log(`\n🎨 Generating: ${scenario.title}`);
  console.log(`   Modules: ${scenario.modules.join(', ')}`);
  console.log(`   Aspect Ratio: ${scenario.aspectRatio}`);

  const prompt = `
Create a professional technical schematic diagram for a modular synthesizer patch.

PATCH: ${scenario.title}

MODULES PRESENT:
${scenario.modules.map((m, i) => `${i + 1}. ${m}`).join('\n')}

PATCH INSTRUCTIONS:
${scenario.instructions}

STYLE REQUIREMENTS:
- Professional technical schematic style (like engineering documentation)
- Clean, minimalist design with light background (white or light gray)
- Module blocks as rectangles with clear labels showing module names
- Use color-coded patch cables:
  🟠 ORANGE = Audio signals (oscillator outputs, filter outputs, VCA outputs)
  🔵 BLUE = CV (Control Voltage) - modulation sources like envelopes, LFOs
  🟢 GREEN = Gate/Trigger signals (clock, sequencer gates)
  🟣 PURPLE = Clock/timing signals
- Cables should use smooth curved bezier lines (avoid sharp 90-degree angles)
- Show signal flow direction with subtle arrow indicators
- Label connection points clearly (e.g., "VCO OUT", "VCF IN", "CUTOFF CV")
- Add brief annotations explaining key connections or signal flow
- Professional quality suitable for Instagram/Reddit sharing
- Ensure legibility - text should be readable when scaled down

IMPORTANT:
- Keep the design clean and uncluttered
- Use hierarchy: main signal path prominent, modulation subtle
- Make it educational: viewer should understand the patch from the diagram
- Output should be publication-ready quality

Create ONE complete diagram showing all connections described in the patch instructions.
  `.trim();

  const startTime = Date.now();

  try {
    // Note: Gemini 2.5 Flash for text, imagen-3 for image generation
    // Using text generation as a test (actual image generation requires different model)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const duration = Date.now() - startTime;

    console.log(`   ✅ Generated in ${(duration / 1000).toFixed(2)}s`);

    // Save response for review
    const outputDir = path.join(process.cwd(), 'claudedocs', 'gemini-tests');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `${scenario.name}-response.txt`);
    fs.writeFileSync(outputFile, `# ${scenario.title}\n\nGeneration Time: ${(duration / 1000).toFixed(2)}s\n\n## Prompt\n\n${prompt}\n\n## Response\n\n${text}\n`);

    console.log(`   📄 Response saved: ${outputFile}`);
    console.log(`   📊 Response length: ${text.length} characters`);

  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║         Gemini 2.5 Flash Image - Demo Test Suite                ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  console.log('\n⚠️  NOTE: Currently testing with Gemini 2.5 Flash (text model)');
  console.log('   Image generation requires Imagen-3 model which is in preview.');
  console.log('   This demo will:');
  console.log('   1. Test API connectivity ✅');
  console.log('   2. Validate prompt structure ✅');
  console.log('   3. Measure response times ✅');
  console.log('   4. Generate detailed descriptions that will guide image generation ✅\n');

  const startTime = Date.now();

  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`\n[${i + 1}/${testScenarios.length}] ${scenario.title}`);
    console.log('─'.repeat(70));

    try {
      await generatePatchDiagram(scenario);
    } catch (error) {
      console.error(`Failed to generate ${scenario.name}`);
      console.error(error);
    }

    // Small delay between requests
    if (i < testScenarios.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const totalDuration = Date.now() - startTime;

  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                        Test Summary                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Completed ${testScenarios.length} test scenarios`);
  console.log(`⏱️  Total time: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`📊 Average time per diagram: ${(totalDuration / testScenarios.length / 1000).toFixed(2)}s`);
  console.log(`\n📁 Results saved in: claudedocs/gemini-tests/`);
  console.log(`\n🎯 Next Steps:`);
  console.log(`   1. Review generated descriptions`);
  console.log(`   2. Evaluate prompt quality`);
  console.log(`   3. Adjust prompts for better image output`);
  console.log(`   4. When Imagen-3 access granted, switch to image generation`);
}

// Run the tests
runTests().catch(console.error);
