#!/usr/bin/env tsx
/**
 * Gemini 2.5 Flash IMAGE - Real Image Generation Test
 *
 * Tests ACTUAL image generation (not text!)
 * Uses gemini-2.5-flash-image model
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// All the new aspect ratios released Oct 2, 2025!
const testScenarios = [
  {
    name: 'basic-subtractive-square',
    title: 'Basic Subtractive Patch',
    aspectRatio: '1:1', // Instagram post
    prompt: `Create a professional technical schematic diagram for a modular synthesizer patch.

PATCH: Basic Subtractive Synthesis

MODULES:
- VCO (Moog) - Oscillator
- VCF (Moog Ladder) - Filter
- ADSR Envelope
- VCA - Amplifier

CONNECTIONS:
1. VCO sawtooth output → VCF audio input (ORANGE cable)
2. VCF output → VCA audio input (ORANGE cable)
3. ADSR output → VCF cutoff CV (BLUE cable)
4. ADSR output → VCA CV (BLUE cable)
5. Keyboard gate → ADSR gate (GREEN cable)

STYLE: Clean technical schematic, light background, color-coded cables:
- 🟠 ORANGE = Audio signals
- 🔵 BLUE = CV/modulation
- 🟢 GREEN = Gate/trigger
Use smooth curved cables, label all connections clearly, professional quality suitable for Instagram sharing.`
  },
  {
    name: 'fm-synthesis-wide',
    title: 'FM Synthesis Patch',
    aspectRatio: '16:9', // Desktop/YouTube
    prompt: `Create a professional technical schematic diagram for a modular synthesizer FM patch.

PATCH: FM Synthesis

MODULES:
- VCO-1 (Carrier oscillator)
- VCO-2 (Modulator oscillator)
- VCA
- ADSR Envelope
- Attenuverter (CV control)

CONNECTIONS:
1. VCO-2 output → Attenuverter input (ORANGE)
2. Attenuverter output → VCO-1 FM input (BLUE - modulation)
3. VCO-1 output → VCA audio input (ORANGE)
4. ADSR output → VCA CV (BLUE)
5. ADSR output → Attenuverter CV for FM depth control (BLUE)

STYLE: Widescreen technical schematic, show FM modulation path clearly, color-coded cables, professional quality for YouTube/desktop display.`
  },
  {
    name: 'generative-vertical',
    title: 'Generative Sequence',
    aspectRatio: '9:16', // Instagram Stories/TikTok
    prompt: `Create a professional technical schematic diagram for a generative modular synth patch.

PATCH: Random Melody Generator

MODULES (top to bottom):
- Clock (timing source)
- Random CV source
- Sample & Hold
- Quantizer (scale quantization)
- VCO (oscillator)
- VCF (filter)
- VCA (amplifier)
- ADSR Envelope

CONNECTIONS:
1. Clock → Sample & Hold trigger (PURPLE clock signal)
2. Random CV → Sample & Hold input (BLUE)
3. Sample & Hold → Quantizer input (BLUE)
4. Quantizer → VCO 1V/oct (BLUE)
5. VCO → VCF input (ORANGE audio)
6. VCF → VCA input (ORANGE audio)
7. Clock → ADSR gate (GREEN gate)
8. ADSR → VCA CV (BLUE)

STYLE: Vertical layout optimized for mobile/stories, show signal flow top-to-bottom, color-coded cables, educational annotations, professional quality.`
  }
];

async function generateRealImage(scenario: typeof testScenarios[0]): Promise<void> {
  console.log(`\n🎨 Generating REAL IMAGE: ${scenario.title}`);
  console.log(`   Aspect Ratio: ${scenario.aspectRatio}`);

  const startTime = Date.now();

  try {
    // Use the IMAGE generation model!
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image'
    });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: scenario.prompt
        }]
      }],
      generationConfig: {
        // Specify aspect ratio (new feature Oct 2, 2025!)
        responseModalities: 'image',
        // @ts-ignore - new feature, types may not be updated
        aspectRatio: scenario.aspectRatio
      }
    });

    const response = await result.response;
    const duration = Date.now() - startTime;

    console.log(`   ✅ Generated in ${(duration / 1000).toFixed(2)}s`);

    // Extract image data
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidates in response');
    }

    const parts = candidates[0].content.parts;
    let imageData: Buffer | null = null;

    for (const part of parts) {
      if (part.inlineData) {
        imageData = Buffer.from(part.inlineData.data, 'base64');
        break;
      }
    }

    if (!imageData) {
      throw new Error('No image data found in response');
    }

    // Save the image!
    const outputDir = path.join(process.cwd(), 'claudedocs', 'gemini-images');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `${scenario.name}.png`);
    fs.writeFileSync(outputFile, imageData);

    console.log(`   🖼️  Image saved: ${outputFile}`);
    console.log(`   📊 Image size: ${(imageData.length / 1024).toFixed(2)} KB`);
    console.log(`   💰 Cost: $0.039`);

  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    throw error;
  }
}

async function runImageTests() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║       Gemini 2.5 Flash IMAGE - REAL Image Generation            ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  console.log('\n🎯 Testing gemini-2.5-flash-image model');
  console.log('📸 Generating ACTUAL images for modular synth patches');
  console.log('📱 Using new aspect ratios (Oct 2, 2025 release)\n');

  const startTime = Date.now();
  const results = [];

  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`\n[${i + 1}/${testScenarios.length}] ${scenario.title}`);
    console.log('─'.repeat(70));

    try {
      await generateRealImage(scenario);
      results.push({ scenario: scenario.name, success: true });
    } catch (error) {
      console.error(`Failed to generate ${scenario.name}`);
      console.error(error);
      results.push({ scenario: scenario.name, success: false });
    }

    // Small delay between requests
    if (i < testScenarios.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next request...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const totalDuration = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;

  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                        Test Summary                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Success: ${successCount}/${testScenarios.length}`);
  console.log(`⏱️  Total time: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`📊 Average time per image: ${(totalDuration / testScenarios.length / 1000).toFixed(2)}s`);
  console.log(`💰 Total cost: $${(successCount * 0.039).toFixed(3)}`);
  console.log(`\n📁 Images saved in: claudedocs/gemini-images/`);
  console.log(`\n🎉 OPEN THE IMAGES AND CHECK THEM OUT!`);
  console.log(`\nAspect ratios tested:`);
  console.log(`  - 1:1 (Instagram square)`);
  console.log(`  - 16:9 (Desktop/YouTube)`);
  console.log(`  - 9:16 (Stories/TikTok)`);
}

runImageTests().catch(console.error);
