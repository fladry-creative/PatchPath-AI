/**
 * Vision-based Rack Analysis
 * Uses Claude Vision to identify modules from rack images
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface VisionModule {
  name: string;
  manufacturer?: string;
  position: {
    x: number; // Approximate X position (0-1)
    y: number; // Approximate Y position (0-1)
    width: number; // Approximate width in HP (estimated)
  };
  confidence: number; // 0-1 confidence score
  notes?: string; // Any visual observations
}

export interface RackVisionAnalysis {
  modules: VisionModule[];
  rackLayout: {
    rows: number;
    estimatedHP: number;
    case?: string; // Case manufacturer if visible
  };
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

/**
 * Analyze rack image using Claude Vision
 */
export async function analyzeRackImage(
  imageData: Buffer | string,
  imageType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<RackVisionAnalysis> {

  // Convert buffer to base64 if needed
  const base64Image = Buffer.isBuffer(imageData)
    ? imageData.toString('base64')
    : imageData;

  const systemPrompt = `You are an expert in modular synthesizers with deep knowledge of Eurorack modules.

Your task is to analyze images of modular synthesizer racks and identify individual modules.

For each module you can identify, provide:
1. Module name (be as specific as possible)
2. Manufacturer (if visible or identifiable)
3. Approximate position in the rack (left to right, top to bottom)
4. Estimated width in HP (Eurorack horizontal pitch units, typically 2-84 HP)
5. Confidence level (0-1) in your identification
6. Any notable visual details

Also analyze:
- Number of rows in the rack
- Estimated total HP capacity
- Case manufacturer if visible
- Overall image quality for analysis

IMPORTANT: Return your analysis as valid JSON in this exact structure:
{
  "modules": [
    {
      "name": "Module Name",
      "manufacturer": "Manufacturer Name",
      "position": {
        "x": 0.1,
        "y": 0.0,
        "width": 12
      },
      "confidence": 0.95,
      "notes": "Visual observations"
    }
  ],
  "rackLayout": {
    "rows": 2,
    "estimatedHP": 104,
    "case": "Case manufacturer if visible"
  },
  "overallQuality": "excellent|good|fair|poor",
  "recommendations": [
    "Suggestions for rack analysis improvements"
  ]
}`;

  console.log('🔍 Analyzing rack image with Claude Vision...');

  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307', // Use Haiku for cost-effective vision
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageType,
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: 'Please analyze this modular synthesizer rack and identify all visible modules. Return your analysis as JSON.',
          },
        ],
      },
    ],
    system: systemPrompt,
  });

  // Extract JSON from response
  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  // Handle potential JSON code block wrapping
  let jsonText = responseText;

  // Try to extract from ```json code block first
  const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  } else {
    // Try to find JSON object in the text (handles "Here is my analysis: {...")
    const objectMatch = responseText.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonText = objectMatch[0];
    }
  }

  const analysis: RackVisionAnalysis = JSON.parse(jsonText);

  console.log(`✅ Vision analysis complete: ${analysis.modules.length} modules identified`);

  return analysis;
}

/**
 * Check if vision analysis is configured
 */
export function isVisionConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Get vision model info
 */
export function getVisionModelInfo() {
  return {
    model: 'claude-3-haiku-20240307',
    provider: 'Anthropic',
    capabilities: ['image_analysis', 'module_identification', 'json_output'],
    costPer1MTokens: {
      input: 0.25, // Haiku pricing for vision
      output: 1.25,
    },
  };
}
