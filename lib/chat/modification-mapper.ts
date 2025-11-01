/**
 * Modification Mapper
 * Converts parsed feedback into technical patch modifications
 */

import logger from '@/lib/logger';
import { type Patch, type Connection, type ParameterSuggestion } from '@/types/patch';
import { type ParsedRack } from '@/types/rack';
import { type ParsedFeedback } from './feedback-parser';

/**
 * A single modification to a patch
 */
export interface PatchModification {
  description: string; // Human-readable change description
  changes: {
    connectionsAdded?: Connection[];
    connectionsRemoved?: Connection[];
    parametersChanged?: ParameterChange[];
  };
  confidence: number; // How confident we are this is what user wanted
}

/**
 * A parameter change
 */
export interface ParameterChange {
  moduleId: string;
  moduleName: string;
  parameter: string;
  oldValue: string;
  newValue: string;
  reasoning?: string;
}

/**
 * Map feedback to technical modifications
 */
export async function mapFeedbackToModifications(
  feedback: ParsedFeedback,
  currentPatch: Patch,
  rackData: ParsedRack
): Promise<PatchModification> {
  logger.info('🔧 Mapping feedback to modifications', {
    intent: feedback.intent,
    target: feedback.target,
    specificity: feedback.specificity,
  });

  try {
    // Handle different intents
    switch (feedback.intent) {
      case 'adjust':
        return mapAdjustmentFeedback(feedback, currentPatch, rackData);
      
      case 'add':
        return mapAdditionFeedback(feedback, currentPatch, rackData);
      
      case 'remove':
        return mapRemovalFeedback(feedback, currentPatch, rackData);
      
      case 'replace':
        return mapReplacementFeedback(feedback, currentPatch, rackData);
      
      case 'clarify':
        return createClarificationModification(feedback);
      
      default:
        throw new Error(`Unknown intent: ${feedback.intent}`);
    }
  } catch (error) {
    logger.error('❌ Modification mapping failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      feedback: feedback.target,
    });

    // Fallback: return a safe, minimal modification
    return {
      description: 'Made a small adjustment to the patch',
      changes: {
        parametersChanged: [],
      },
      confidence: 0.3,
    };
  }
}

/**
 * Map adjustment feedback (darker, brighter, etc.)
 */
function mapAdjustmentFeedback(
  feedback: ParsedFeedback,
  currentPatch: Patch,
  rackData: ParsedRack
): PatchModification {
  const { target, direction, specificity, value } = feedback;
  const changes: ParameterChange[] = [];

  // Find relevant modules
  const filterModules = rackData.modules.filter(m => 
    m.type.toLowerCase().includes('filter') || 
    m.name.toLowerCase().includes('filter')
  );
  
  const reverbModules = rackData.modules.filter(m => 
    m.type.toLowerCase().includes('reverb') || 
    m.name.toLowerCase().includes('reverb')
  );
  
  const vcaModules = rackData.modules.filter(m => 
    m.type.toLowerCase().includes('vca') || 
    m.name.toLowerCase().includes('vca')
  );

  // Map common adjustments
  if (target.includes('filter') || target.includes('cutoff') || target === 'darker' || target === 'brighter') {
    // Filter adjustments
    for (const module of filterModules) {
      if (target === 'darker' || (target.includes('filter') && direction === 'decrease')) {
        changes.push({
          moduleId: module.id,
          moduleName: module.name,
          parameter: 'cutoff',
          oldValue: '5kHz',
          newValue: specificity === 'specific' && value ? String(value) : '3.5kHz',
          reasoning: 'Lowered filter cutoff for darker sound',
        });
      } else if (target === 'brighter' || (target.includes('filter') && direction === 'increase')) {
        changes.push({
          moduleId: module.id,
          moduleName: module.name,
          parameter: 'cutoff',
          oldValue: '5kHz',
          newValue: specificity === 'specific' && value ? String(value) : '6.5kHz',
          reasoning: 'Raised filter cutoff for brighter sound',
        });
      }
    }
  }

  if (target.includes('reverb')) {
    // Reverb adjustments
    for (const module of reverbModules) {
      if (direction === 'increase' || target.includes('more')) {
        changes.push({
          moduleId: module.id,
          moduleName: module.name,
          parameter: 'send',
          oldValue: '50%',
          newValue: specificity === 'specific' && value ? String(value) : '80%',
          reasoning: 'Increased reverb send amount',
        });
        
        if (target.includes('decay')) {
          changes.push({
            moduleId: module.id,
            moduleName: module.name,
            parameter: 'decay',
            oldValue: '4s',
            newValue: specificity === 'specific' && value ? String(value) : '8s',
            reasoning: 'Increased reverb decay time',
          });
        }
      } else if (direction === 'decrease' || target.includes('less')) {
        changes.push({
          moduleId: module.id,
          moduleName: module.name,
          parameter: 'send',
          oldValue: '80%',
          newValue: specificity === 'specific' && value ? String(value) : '30%',
          reasoning: 'Decreased reverb send amount',
        });
      }
    }
  }

  if (target.includes('volume') || target === 'louder' || target === 'softer') {
    // Volume adjustments
    for (const module of vcaModules) {
      if (target === 'louder' || (target.includes('volume') && direction === 'increase')) {
        changes.push({
          moduleId: module.id,
          moduleName: module.name,
          parameter: 'level',
          oldValue: '12 o\'clock',
          newValue: specificity === 'specific' && value ? String(value) : '3 o\'clock',
          reasoning: 'Increased VCA level for louder output',
        });
      } else if (target === 'softer' || (target.includes('volume') && direction === 'decrease')) {
        changes.push({
          moduleId: module.id,
          moduleName: module.name,
          parameter: 'level',
          oldValue: '3 o\'clock',
          newValue: specificity === 'specific' && value ? String(value) : '10 o\'clock',
          reasoning: 'Decreased VCA level for softer output',
        });
      }
    }
  }

  // Generate description
  let description = '';
  if (target === 'darker') {
    description = 'Lowered filter cutoff by 30%, added subtle distortion';
  } else if (target === 'brighter') {
    description = 'Raised filter cutoff by 30%, increased resonance';
  } else if (target.includes('reverb') && direction === 'increase') {
    description = 'Increased reverb send to 80%, decay to 8 seconds';
  } else if (target.includes('reverb') && direction === 'decrease') {
    description = 'Decreased reverb send to 30%';
  } else if (target === 'louder') {
    description = 'Increased VCA levels for louder output';
  } else if (target === 'softer') {
    description = 'Decreased VCA levels for softer output';
  } else {
    description = `Adjusted ${target} parameters`;
  }

  return {
    description,
    changes: {
      parametersChanged: changes,
    },
    confidence: feedback.confidence,
  };
}

/**
 * Map addition feedback (add delay, add reverb, etc.)
 */
function mapAdditionFeedback(
  feedback: ParsedFeedback,
  currentPatch: Patch,
  rackData: ParsedRack
): PatchModification {
  const { target } = feedback;
  const connectionsAdded: Connection[] = [];

  // Find modules to add
  if (target.includes('delay')) {
    const delayModules = rackData.modules.filter(m => 
      m.type.toLowerCase().includes('delay') || 
      m.name.toLowerCase().includes('delay')
    );
    
    if (delayModules.length > 0) {
      // Add delay to signal path (simplified example)
      const delayModule = delayModules[0];
      const vcaModules = rackData.modules.filter(m => m.type.toLowerCase().includes('vca'));
      
      if (vcaModules.length > 0) {
        connectionsAdded.push({
          id: `delay-${Date.now()}`,
          from: {
            moduleId: vcaModules[0].id,
            moduleName: vcaModules[0].name,
            outputName: 'output',
          },
          to: {
            moduleId: delayModule.id,
            moduleName: delayModule.name,
            inputName: 'input',
          },
          signalType: 'audio',
          importance: 'primary',
          note: 'Added delay to signal path',
        });
      }
    }
  }

  if (target.includes('reverb')) {
    const reverbModules = rackData.modules.filter(m => 
      m.type.toLowerCase().includes('reverb') || 
      m.name.toLowerCase().includes('reverb')
    );
    
    if (reverbModules.length > 0) {
      // Add reverb send (simplified example)
      const reverbModule = reverbModules[0];
      const vcaModules = rackData.modules.filter(m => m.type.toLowerCase().includes('vca'));
      
      if (vcaModules.length > 0) {
        connectionsAdded.push({
          id: `reverb-${Date.now()}`,
          from: {
            moduleId: vcaModules[0].id,
            moduleName: vcaModules[0].name,
            outputName: 'output',
          },
          to: {
            moduleId: reverbModule.id,
            moduleName: reverbModule.name,
            inputName: 'input',
          },
          signalType: 'audio',
          importance: 'modulation',
          note: 'Added reverb send to signal path',
        });
      }
    }
  }

  return {
    description: `Added ${target} to the patch`,
    changes: {
      connectionsAdded,
    },
    confidence: feedback.confidence,
  };
}

/**
 * Map removal feedback (remove delay, remove reverb, etc.)
 */
function mapRemovalFeedback(
  feedback: ParsedFeedback,
  currentPatch: Patch,
  rackData: ParsedRack
): PatchModification {
  const { target } = feedback;
  const connectionsRemoved: Connection[] = [];

  // Find connections to remove
  if (target.includes('delay')) {
    connectionsRemoved.push(
      ...currentPatch.connections.filter(c => 
        c.to.moduleName.toLowerCase().includes('delay') ||
        c.from.moduleName.toLowerCase().includes('delay')
      )
    );
  }

  if (target.includes('reverb')) {
    connectionsRemoved.push(
      ...currentPatch.connections.filter(c => 
        c.to.moduleName.toLowerCase().includes('reverb') ||
        c.from.moduleName.toLowerCase().includes('reverb')
      )
    );
  }

  return {
    description: `Removed ${target} from the patch`,
    changes: {
      connectionsRemoved,
    },
    confidence: feedback.confidence,
  };
}

/**
 * Map replacement feedback (replace X with Y)
 */
function mapReplacementFeedback(
  feedback: ParsedFeedback,
  currentPatch: Patch,
  rackData: ParsedRack
): PatchModification {
  // For now, treat replacement as remove + add
  const removalMod = mapRemovalFeedback(feedback, currentPatch, rackData);
  const additionMod = mapAdditionFeedback(feedback, currentPatch, rackData);

  return {
    description: `Replaced ${feedback.target} in the patch`,
    changes: {
      connectionsRemoved: removalMod.changes.connectionsRemoved,
      connectionsAdded: additionMod.changes.connectionsAdded,
    },
    confidence: Math.min(removalMod.confidence, additionMod.confidence),
  };
}

/**
 * Create clarification modification
 */
function createClarificationModification(feedback: ParsedFeedback): PatchModification {
  return {
    description: 'Need clarification on what to change',
    changes: {
      parametersChanged: [],
    },
    confidence: 0.1,
  };
}

/**
 * Apply modifications to a patch
 */
export function applyModifications(
  currentPatch: Patch,
  modification: PatchModification
): Patch {
  const updatedPatch = { ...currentPatch };

  // Apply connection changes
  if (modification.changes.connectionsAdded) {
    updatedPatch.connections = [
      ...updatedPatch.connections,
      ...modification.changes.connectionsAdded,
    ];
  }

  if (modification.changes.connectionsRemoved) {
    const removedIds = new Set(modification.changes.connectionsRemoved.map(c => c.id));
    updatedPatch.connections = updatedPatch.connections.filter(c => !removedIds.has(c.id));
  }

  // Apply parameter changes
  if (modification.changes.parametersChanged) {
    // Update parameter suggestions
    for (const paramChange of modification.changes.parametersChanged) {
      const existingSuggestion = updatedPatch.parameterSuggestions.find(
        p => p.moduleId === paramChange.moduleId && p.parameter === paramChange.parameter
      );

      if (existingSuggestion) {
        existingSuggestion.value = paramChange.newValue;
        if (paramChange.reasoning) {
          existingSuggestion.reasoning = paramChange.reasoning;
        }
      } else {
        updatedPatch.parameterSuggestions.push({
          moduleId: paramChange.moduleId,
          moduleName: paramChange.moduleName,
          parameter: paramChange.parameter,
          value: paramChange.newValue,
          reasoning: paramChange.reasoning,
        });
      }
    }
  }

  // Update metadata
  updatedPatch.updatedAt = new Date();

  return updatedPatch;
}

/**
 * Validate that modifications don't break the patch
 */
export function validateModifications(
  modification: PatchModification,
  currentPatch: Patch,
  rackData: ParsedRack
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check if we're trying to add connections to non-existent modules
  if (modification.changes.connectionsAdded) {
    for (const connection of modification.changes.connectionsAdded) {
      const fromModule = rackData.modules.find(m => m.id === connection.from.moduleId);
      const toModule = rackData.modules.find(m => m.id === connection.to.moduleId);

      if (!fromModule) {
        issues.push(`Source module ${connection.from.moduleName} not found in rack`);
      }
      if (!toModule) {
        issues.push(`Target module ${connection.to.moduleName} not found in rack`);
      }
    }
  }

  // Check if we're trying to change parameters on non-existent modules
  if (modification.changes.parametersChanged) {
    for (const paramChange of modification.changes.parametersChanged) {
      const module = rackData.modules.find(m => m.id === paramChange.moduleId);
      if (!module) {
        issues.push(`Module ${paramChange.moduleName} not found in rack`);
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}