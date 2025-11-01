/**
 * Save Intent Detection
 * Detects when users want to save their current patch
 */

import logger from '@/lib/logger';
import { type PatchModification } from './modification-mapper';

/**
 * Save intent detection result
 */
export interface SaveIntentResult {
  detected: boolean;
  confidence: number; // 0.0 to 1.0
  reasoning: string;
}

/**
 * Keywords that indicate save intent
 */
const SAVE_KEYWORDS = [
  // Direct save requests
  'save',
  'save this',
  'save it',
  'keep this',
  'keep it',
  'bookmark',
  'bookmark this',
  
  // Positive feedback that implies save
  'perfect',
  'great',
  'love it',
  'i love it',
  'i like it',
  'looks good',
  'that works',
  'this is good',
  'this works',
  'exactly what i wanted',
  
  // Completion indicators
  'done',
  'finished',
  'that\'s it',
  'that\'s perfect',
  'that\'s great',
  'that\'s good',
  'i\'m done',
  'i\'m finished',
  
  // Approval phrases
  'yes',
  'yeah',
  'yep',
  'sure',
  'ok',
  'okay',
  'sounds good',
  'sounds perfect',
  'sounds great',
];

/**
 * Phrases that indicate NOT wanting to save
 */
const NO_SAVE_KEYWORDS = [
  'no',
  'nope',
  'not yet',
  'not now',
  'wait',
  'hold on',
  'not quite',
  'almost',
  'close',
  'getting there',
  'not right',
  'not good',
  'not working',
  'try again',
  'different',
  'something else',
  'another',
  'variation',
  'change',
  'modify',
  'adjust',
];

/**
 * Detect if user wants to save their current patch
 */
export function detectSaveIntent(message: string): SaveIntentResult {
  const lowerMessage = message.toLowerCase().trim();
  
  logger.debug('🔍 Detecting save intent', {
    message: message.substring(0, 50),
    messageLength: message.length,
  });

  // Check for explicit no-save indicators first
  for (const keyword of NO_SAVE_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      return {
        detected: false,
        confidence: 0.9,
        reasoning: `Message contains "${keyword}" which indicates not wanting to save`,
      };
    }
  }

  // Check for save keywords
  let maxConfidence = 0;
  let bestMatch = '';

  for (const keyword of SAVE_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      // Calculate confidence based on keyword strength and context
      let confidence = 0.7; // Base confidence
      
      // Higher confidence for direct save requests
      if (['save', 'save this', 'save it', 'bookmark', 'bookmark this'].includes(keyword)) {
        confidence = 0.95;
      }
      
      // Medium confidence for positive feedback
      if (['perfect', 'great', 'love it', 'i love it', 'i like it'].includes(keyword)) {
        confidence = 0.85;
      }
      
      // Lower confidence for general approval
      if (['yes', 'yeah', 'ok', 'okay', 'sounds good'].includes(keyword)) {
        confidence = 0.6;
      }

      // Boost confidence if it's the only word or at the end
      if (lowerMessage === keyword || lowerMessage.endsWith(keyword)) {
        confidence += 0.1;
      }

      // Boost confidence if it's a complete sentence
      if (lowerMessage.endsWith('.') || lowerMessage.endsWith('!')) {
        confidence += 0.05;
      }

      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        bestMatch = keyword;
      }
    }
  }

  // Check for very short positive responses (likely save intent)
  if (lowerMessage.length <= 10 && maxConfidence === 0) {
    const shortPositive = ['yes', 'yeah', 'yep', 'ok', 'okay', 'good', 'great', 'perfect'];
    if (shortPositive.includes(lowerMessage)) {
      maxConfidence = 0.7;
      bestMatch = lowerMessage;
    }
  }

  const detected = maxConfidence > 0.5;
  
  logger.info('💾 Save intent detection result', {
    detected,
    confidence: maxConfidence,
    bestMatch,
    reasoning: detected ? `Detected "${bestMatch}" with ${maxConfidence} confidence` : 'No save intent detected',
  });

  return {
    detected,
    confidence: maxConfidence,
    reasoning: detected 
      ? `Detected "${bestMatch}" with ${maxConfidence} confidence`
      : 'No save intent detected',
  };
}

/**
 * Generate intelligent patch name based on conversation and modifications
 */
export function generatePatchName(
  originalName: string,
  modifications: PatchModification[],
  conversationContext: string[]
): string {
  logger.debug('🏷️ Generating patch name', {
    originalName,
    modificationCount: modifications.length,
    contextLength: conversationContext.length,
  });

  // Extract descriptors from modifications
  const descriptors: string[] = [];
  
  for (const mod of modifications) {
    const desc = mod.description.toLowerCase();
    
    // Extract key words from modification descriptions
    if (desc.includes('darker')) descriptors.push('Darker');
    if (desc.includes('brighter')) descriptors.push('Brighter');
    if (desc.includes('reverb')) descriptors.push('Reverb Heavy');
    if (desc.includes('delay')) descriptors.push('Delayed');
    if (desc.includes('louder')) descriptors.push('Loud');
    if (desc.includes('softer')) descriptors.push('Soft');
    if (desc.includes('faster')) descriptors.push('Fast');
    if (desc.includes('slower')) descriptors.push('Slow');
    if (desc.includes('aggressive')) descriptors.push('Aggressive');
    if (desc.includes('smooth')) descriptors.push('Smooth');
    if (desc.includes('distortion')) descriptors.push('Distorted');
    if (desc.includes('modulation')) descriptors.push('Modulated');
  }

  // Remove duplicates and limit to 3 descriptors
  const uniqueDescriptors = [...new Set(descriptors)].slice(0, 3);

  // Generate new name
  let newName = originalName;

  if (uniqueDescriptors.length > 0) {
    // Add descriptors in parentheses
    newName = `${originalName} (${uniqueDescriptors.join(', ')})`;
  } else {
    // Try to extract mood from conversation context
    const moodWords = extractMoodFromContext(conversationContext);
    if (moodWords.length > 0) {
      newName = `${originalName} (${moodWords.join(', ')})`;
    }
  }

  // Ensure name isn't too long
  if (newName.length > 80) {
    newName = newName.substring(0, 77) + '...';
  }

  logger.info('✅ Generated patch name', {
    originalName,
    newName,
    descriptors: uniqueDescriptors,
  });

  return newName;
}

/**
 * Extract mood descriptors from conversation context
 */
function extractMoodFromContext(conversationContext: string[]): string[] {
  const moodWords: string[] = [];
  const context = conversationContext.join(' ').toLowerCase();

  // Mood patterns
  const moodPatterns = [
    { pattern: /dark|darker|darkness/i, mood: 'Dark' },
    { pattern: /bright|brighter|brightness/i, mood: 'Bright' },
    { pattern: /ambient|atmospheric|ethereal/i, mood: 'Ambient' },
    { pattern: /aggressive|harsh|intense/i, mood: 'Aggressive' },
    { pattern: /smooth|gentle|soft/i, mood: 'Smooth' },
    { pattern: /experimental|weird|strange/i, mood: 'Experimental' },
    { pattern: /melodic|musical|tuneful/i, mood: 'Melodic' },
    { pattern: /rhythmic|percussive|driving/i, mood: 'Rhythmic' },
    { pattern: /minimal|simple|clean/i, mood: 'Minimal' },
    { pattern: /complex|layered|rich/i, mood: 'Complex' },
  ];

  for (const { pattern, mood } of moodPatterns) {
    if (pattern.test(context) && !moodWords.includes(mood)) {
      moodWords.push(mood);
    }
  }

  return moodWords.slice(0, 2); // Limit to 2 mood words
}

/**
 * Generate save confirmation message
 */
export function generateSaveConfirmation(
  patchName: string,
  modifications: PatchModification[]
): string {
  const modificationCount = modifications.length;
  
  let message = `✅ Saved as "${patchName}" to your Cookbook!\n\n`;
  
  if (modificationCount > 0) {
    message += `This patch includes ${modificationCount} refinement${modificationCount > 1 ? 's' : ''}:\n`;
    for (const mod of modifications.slice(0, 3)) { // Show first 3 modifications
      message += `• ${mod.description}\n`;
    }
    if (modificationCount > 3) {
      message += `• ...and ${modificationCount - 3} more\n`;
    }
    message += '\n';
  }
  
  message += 'Want to try another variation or start fresh?';
  
  return message;
}

/**
 * Check if user wants to start fresh (clear session)
 */
export function detectStartFreshIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  
  const startFreshKeywords = [
    'start fresh',
    'start over',
    'new patch',
    'different patch',
    'something else',
    'try again',
    'reset',
    'clear',
    'begin again',
    'from scratch',
  ];

  return startFreshKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Check if user wants to see variations
 */
export function detectVariationsIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  
  const variationsKeywords = [
    'variations',
    'variation',
    'other options',
    'other choices',
    'different versions',
    'alternatives',
    'show me more',
    'what else',
    'try another',
    'another one',
    'different approach',
  ];

  return variationsKeywords.some(keyword => lowerMessage.includes(keyword));
}