/**
 * Patch Refinement Engine
 * Core system for conversational patch iteration
 */

import logger from '@/lib/logger';
import { type Patch } from '@/types/patch';
import { type ParsedRack } from '@/types/rack';
import { parseFeedback, type ParsedFeedback } from './feedback-parser';
import { mapFeedbackToModifications, applyModifications, validateModifications, type PatchModification } from './modification-mapper';
import { detectSaveIntent, generatePatchName, generateSaveConfirmation, detectStartFreshIntent, detectVariationsIntent } from './save-detector';

/**
 * Refinement request from user
 */
export interface RefinementRequest {
  type: 'modify' | 'add' | 'remove' | 'replace' | 'clarify';
  target: 'connection' | 'parameter' | 'module';
  feedback: string; // User's natural language input
}

/**
 * Result of patch refinement
 */
export interface RefinementResult {
  success: boolean;
  updatedPatch?: Patch;
  modification?: PatchModification;
  message: string;
  needsClarification?: boolean;
  impossibleRequest?: boolean;
  impossibleReason?: string;
}

/**
 * Refine a patch based on user feedback
 */
export async function refinePatch(
  currentPatch: Patch,
  feedback: string,
  rackData: ParsedRack
): Promise<RefinementResult> {
  logger.info('🔧 Starting patch refinement', {
    patchTitle: currentPatch.metadata.title,
    feedback: feedback.substring(0, 50),
    moduleCount: rackData.modules.length,
  });

  try {
    // 1. Parse user feedback
    const parsedFeedback = await parseFeedback(feedback, currentPatch, rackData);
    
    logger.debug('📝 Parsed feedback', {
      intent: parsedFeedback.intent,
      target: parsedFeedback.target,
      specificity: parsedFeedback.specificity,
      confidence: parsedFeedback.confidence,
    });

    // 2. Check if clarification is needed
    if (parsedFeedback.intent === 'clarify' || parsedFeedback.confidence < 0.5) {
      return {
        success: false,
        message: generateClarificationMessage(feedback),
        needsClarification: true,
      };
    }

    // 3. Check if request is impossible
    const { impossible, reason } = checkImpossibleRequest(parsedFeedback, rackData);
    if (impossible) {
      return {
        success: false,
        message: generateImpossibleRequestMessage(reason!),
        impossibleRequest: true,
        impossibleReason: reason,
      };
    }

    // 4. Map feedback to technical modifications
    const modification = await mapFeedbackToModifications(parsedFeedback, currentPatch, rackData);
    
    logger.debug('🔧 Generated modification', {
      description: modification.description,
      changesCount: Object.keys(modification.changes).length,
      confidence: modification.confidence,
    });

    // 5. Validate modifications
    const validation = validateModifications(modification, currentPatch, rackData);
    if (!validation.valid) {
      return {
        success: false,
        message: `I can't make that change: ${validation.issues.join(', ')}`,
      };
    }

    // 6. Apply modifications to patch
    const updatedPatch = applyModifications(currentPatch, modification);
    
    logger.info('✅ Patch refinement complete', {
      patchTitle: updatedPatch.metadata.title,
      modificationDescription: modification.description,
    });

    return {
      success: true,
      updatedPatch,
      modification,
      message: `✨ ${modification.description}`,
    };

  } catch (error) {
    logger.error('❌ Patch refinement failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      feedback,
      patchTitle: currentPatch.metadata.title,
    });

    return {
      success: false,
      message: 'Sorry, I had trouble understanding that request. Could you try rephrasing it?',
    };
  }
}

/**
 * Check if a refinement request is impossible to fulfill
 */
function checkImpossibleRequest(
  feedback: ParsedFeedback,
  rackData: ParsedRack
): { impossible: boolean; reason?: string } {
  const { intent, target } = feedback;

  // Check if trying to add modules that don't exist
  if (intent === 'add') {
    const moduleTypes = rackData.modules.map(m => m.type.toLowerCase());
    
    if (target.includes('reverb') && !moduleTypes.some(t => t.includes('reverb') || t.includes('effect'))) {
      return { impossible: true, reason: 'No reverb module in your rack' };
    }
    
    if (target.includes('delay') && !moduleTypes.some(t => t.includes('delay') || t.includes('effect'))) {
      return { impossible: true, reason: 'No delay module in your rack' };
    }
    
    if (target.includes('distortion') && !moduleTypes.some(t => t.includes('distortion') || t.includes('effect'))) {
      return { impossible: true, reason: 'No distortion module in your rack' };
    }
    
    if (target.includes('filter') && !moduleTypes.some(t => t.includes('filter'))) {
      return { impossible: true, reason: 'No filter module in your rack' };
    }
  }

  return { impossible: false };
}

/**
 * Generate clarification message for vague feedback
 */
function generateClarificationMessage(feedback: string): string {
  const vaguePatterns = [
    { pattern: /better|good|nice/i, suggestions: ['darker', 'brighter', 'more reverb', 'faster'] },
    { pattern: /fix|wrong|problem/i, suggestions: ['too dark', 'too bright', 'too complex', 'too simple'] },
    { pattern: /change|different/i, suggestions: ['darker', 'brighter', 'add delay', 'remove reverb'] },
  ];

  for (const { pattern, suggestions } of vaguePatterns) {
    if (pattern.test(feedback)) {
      return `I'd love to help! Could you be more specific? For example:\n- ${suggestions.join('\n- ')}\n\nWhat exactly would you like to change?`;
    }
  }

  return `I want to make sure I understand what you're looking for. Could you tell me more about what you'd like to change? For example:\n- Make it darker/brighter\n- Add more reverb/delay\n- Make it faster/slower\n- Add/remove specific effects`;
}

/**
 * Generate message for impossible requests
 */
function generateImpossibleRequestMessage(reason: string): string {
  return `I can't do that because ${reason}. Would you like me to suggest some modules that could add that capability to your rack?`;
}

/**
 * Handle save intent for current patch
 */
export function handleSaveIntent(
  currentPatch: Patch,
  modifications: PatchModification[],
  conversationContext: string[]
): { shouldSave: boolean; patchName?: string; confirmationMessage?: string } {
  // Generate intelligent patch name
  const patchName = generatePatchName(
    currentPatch.metadata.title,
    modifications,
    conversationContext
  );

  // Generate confirmation message
  const confirmationMessage = generateSaveConfirmation(patchName, modifications);

  return {
    shouldSave: true,
    patchName,
    confirmationMessage,
  };
}

/**
 * Handle start fresh intent
 */
export function handleStartFreshIntent(): { shouldStartFresh: boolean; message: string } {
  return {
    shouldStartFresh: true,
    message: '🔄 Starting fresh! What kind of sound would you like to create?',
  };
}

/**
 * Handle variations intent
 */
export function handleVariationsIntent(): { shouldShowVariations: boolean; message: string } {
  return {
    shouldShowVariations: true,
    message: '🎨 Let me generate some variations for you...',
  };
}

/**
 * Check if user wants to save, start fresh, or see variations
 */
export function checkSpecialIntents(message: string): {
  saveIntent?: boolean;
  startFreshIntent?: boolean;
  variationsIntent?: boolean;
} {
  const saveResult = detectSaveIntent(message);
  const startFresh = detectStartFreshIntent(message);
  const variations = detectVariationsIntent(message);

  return {
    saveIntent: saveResult.detected,
    startFreshIntent: startFresh,
    variationsIntent: variations,
  };
}

/**
 * Generate undo message for reverting changes
 */
export function generateUndoMessage(previousPatch: Patch): string {
  return `↩️ Reverted to previous version: "${previousPatch.metadata.title}"`;
}

/**
 * Generate variation request message
 */
export function generateVariationMessage(variationCount: number): string {
  return `🎨 Generated ${variationCount} variation${variationCount > 1 ? 's' : ''} for you! Which one interests you most?`;
}

/**
 * Track refinement history for undo functionality
 */
export class RefinementHistory {
  private history: Patch[] = [];
  private maxHistory = 5;

  constructor(initialPatch: Patch) {
    this.history.push(initialPatch);
  }

  addPatch(patch: Patch): void {
    this.history.push(patch);
    
    // Keep only last 5 patches
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  getCurrentPatch(): Patch | null {
    return this.history[this.history.length - 1] || null;
  }

  getPreviousPatch(): Patch | null {
    return this.history.length > 1 ? this.history[this.history.length - 2] : null;
  }

  canUndo(): boolean {
    return this.history.length > 1;
  }

  undo(): Patch | null {
    if (!this.canUndo()) {
      return null;
    }
    
    this.history.pop();
    return this.getCurrentPatch();
  }

  getHistory(): Patch[] {
    return [...this.history];
  }

  clear(): void {
    this.history = [];
  }
}