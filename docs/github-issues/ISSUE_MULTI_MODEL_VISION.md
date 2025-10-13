# GitHub Issue: Multi-Model Vision Pipeline (Claude + Gemini)

**Priority:** 🔥 HIGH
**Estimated Effort:** 3-5 days
**Phase:** 3 - Optimization
**Dependencies:** CDN Vision Support issue must be completed first
**Related Docs:** `VISION_FIRST_ARCHITECTURE.md`, `GEMINI_SETUP.md`

---

## Problem Statement

Current vision analysis uses **Claude Sonnet 4.5 exclusively**, which:

- ✅ Has excellent reasoning and module identification
- ✅ Produces high-quality results
- ❌ Costs $3/1M input tokens + $15/1M output tokens
- ❌ Can be slower for bulk operations
- ❌ Single point of failure (if Claude is down, we're down)

**Opportunity:** Gemini 2.5 models offer:

- ⚡ Faster processing (Gemini Flash)
- 💰 Lower cost (especially for bulk)
- 🎯 Comparable accuracy (Gemini Pro)
- 🔄 Redundancy (failover if one model is down)

---

## Proposed Solution: Smart Model Router

### Three-Tier Vision Pipeline

```typescript
┌─────────────────────────────────────────────────────────────┐
│                    VISION ANALYSIS REQUEST                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     MODEL ROUTER                            │
│  Analyzes request complexity and chooses optimal model      │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Gemini Flash │  │ Claude 4.5   │  │ Gemini Pro   │
│ (Tier 1)     │  │ (Tier 2)     │  │ (Tier 3)     │
│              │  │              │  │              │
│ • 70% cases  │  │ • 25% cases  │  │ • 5% cases   │
│ • $0.01/op   │  │ • $0.05/op   │  │ • $0.08/op   │
│ • <1 second  │  │ • 1-2 sec    │  │ • 2-3 sec    │
│ • Standard   │  │ • Complex    │  │ • Very       │
│   racks      │  │   racks      │  │   complex    │
└──────────────┘  └──────────────┘  └──────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              CONFIDENCE SCORING & VALIDATION                │
│  If confidence < 0.7, escalate to next tier                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### 1. Model Router Service

**File:** `lib/vision/model-router.ts` (NEW)

```typescript
import logger from '@/lib/logger';

export type VisionModel = 'gemini-flash' | 'claude' | 'gemini-pro';

export interface VisionRequest {
  imageBuffer: Buffer;
  imageType: 'image/jpeg' | 'image/png' | 'image/webp';
  complexity?: 'simple' | 'standard' | 'complex';
  userId?: string;
  priorityLevel?: 'fast' | 'balanced' | 'accurate';
}

export interface ModelRoutingDecision {
  chosenModel: VisionModel;
  reason: string;
  estimatedCost: number;
  estimatedTime: number;
}

/**
 * Smart model router - chooses optimal vision model for each request
 */
export class VisionModelRouter {
  /**
   * Choose optimal model based on request characteristics
   */
  static route(request: VisionRequest): ModelRoutingDecision {
    // Priority: User can force accuracy over speed
    if (request.priorityLevel === 'accurate') {
      return {
        chosenModel: 'gemini-pro',
        reason: 'User requested highest accuracy',
        estimatedCost: 0.08,
        estimatedTime: 2500,
      };
    }

    if (request.priorityLevel === 'fast') {
      return {
        chosenModel: 'gemini-flash',
        reason: 'User requested fastest processing',
        estimatedCost: 0.01,
        estimatedTime: 800,
      };
    }

    // Complexity-based routing (default: balanced)
    switch (request.complexity) {
      case 'simple':
        // Small racks, clear images → Gemini Flash
        return {
          chosenModel: 'gemini-flash',
          reason: 'Simple rack detected, using fast model',
          estimatedCost: 0.01,
          estimatedTime: 800,
        };

      case 'complex':
        // Large racks, video synthesis, DIY modules → Claude
        return {
          chosenModel: 'claude',
          reason: 'Complex rack detected, using high-accuracy model',
          estimatedCost: 0.05,
          estimatedTime: 1500,
        };

      case 'standard':
      default:
        // Most racks → Gemini Flash (fast + cheap)
        // Will escalate to Claude if confidence < 0.7
        return {
          chosenModel: 'gemini-flash',
          reason: 'Standard rack, using balanced model with auto-escalation',
          estimatedCost: 0.01,
          estimatedTime: 800,
        };
    }
  }

  /**
   * Determine rack complexity from image analysis (heuristics)
   */
  static async analyzeComplexity(imageBuffer: Buffer): Promise<'simple' | 'standard' | 'complex'> {
    // Use image dimensions as proxy for complexity
    const size = imageBuffer.length;

    // Small image (<500KB) = likely simple rack
    if (size < 500_000) return 'simple';

    // Large image (>2MB) = likely complex rack
    if (size > 2_000_000) return 'complex';

    // Default
    return 'standard';
  }
}
```

---

### 2. Unified Vision Analyzer Interface

**File:** `lib/vision/unified-analyzer.ts` (NEW)

```typescript
import { analyzeRackImage as analyzeWithClaude } from './rack-analyzer';
import { analyzeRackImageGemini } from './gemini-analyzer';
import { VisionModelRouter, type VisionRequest, type VisionModel } from './model-router';
import logger from '@/lib/logger';

export interface UnifiedVisionResult {
  modules: Array<{
    name: string;
    manufacturer: string;
    confidence: number;
    position: { x: number; y: number; width: number };
  }>;
  rackLayout: {
    rows: number;
    estimatedHP: number;
  };
  modelUsed: VisionModel;
  processingTime: number;
  cost: number;
  escalated?: boolean; // True if we escalated to higher tier
}

/**
 * Unified vision analyzer with smart model routing
 */
export async function analyzeRackUnified(request: VisionRequest): Promise<UnifiedVisionResult> {
  const startTime = Date.now();

  // Step 1: Analyze complexity (if not provided)
  if (!request.complexity) {
    request.complexity = await VisionModelRouter.analyzeComplexity(request.imageBuffer);
  }

  // Step 2: Route to optimal model
  const routing = VisionModelRouter.route(request);

  logger.info('🤖 Vision model selected', {
    model: routing.chosenModel,
    reason: routing.reason,
    estimatedCost: routing.estimatedCost,
    complexity: request.complexity,
  });

  // Step 3: Analyze with chosen model
  let result: UnifiedVisionResult;

  try {
    switch (routing.chosenModel) {
      case 'gemini-flash':
        result = await analyzeWithGeminiFlash(request);
        break;

      case 'gemini-pro':
        result = await analyzeWithGeminiPro(request);
        break;

      case 'claude':
      default:
        result = await analyzeWithClaudeVision(request);
        break;
    }
  } catch (error) {
    // Failover: If chosen model fails, try Claude as fallback
    logger.warn('⚠️  Primary model failed, falling back to Claude', {
      primaryModel: routing.chosenModel,
      error: error instanceof Error ? error.message : 'Unknown',
    });
    result = await analyzeWithClaudeVision(request);
    result.escalated = true;
  }

  // Step 4: Auto-escalation if confidence too low
  const avgConfidence =
    result.modules.reduce((sum, m) => sum + m.confidence, 0) / result.modules.length;

  if (avgConfidence < 0.7 && routing.chosenModel !== 'claude') {
    logger.info('📈 Low confidence detected, escalating to Claude', {
      avgConfidence,
      originalModel: routing.chosenModel,
    });

    // Re-analyze with Claude for better accuracy
    result = await analyzeWithClaudeVision(request);
    result.escalated = true;
  }

  result.processingTime = Date.now() - startTime;

  logger.info('✅ Vision analysis complete', {
    model: result.modelUsed,
    modules: result.modules.length,
    avgConfidence,
    time: `${result.processingTime}ms`,
    cost: `$${result.cost.toFixed(4)}`,
    escalated: result.escalated,
  });

  return result;
}

/**
 * Analyze with Claude Sonnet 4.5 (existing implementation)
 */
async function analyzeWithClaudeVision(request: VisionRequest): Promise<UnifiedVisionResult> {
  const result = await analyzeWithClaude(request.imageBuffer, request.imageType);

  return {
    modules: result.modules,
    rackLayout: result.rackLayout,
    modelUsed: 'claude',
    processingTime: 0, // Set by caller
    cost: 0.05, // Estimated
  };
}

/**
 * Analyze with Gemini 2.5 Flash (NEW)
 */
async function analyzeWithGeminiFlash(request: VisionRequest): Promise<UnifiedVisionResult> {
  const result = await analyzeRackImageGemini(request.imageBuffer, 'flash');

  return {
    modules: result.modules,
    rackLayout: result.rackLayout,
    modelUsed: 'gemini-flash',
    processingTime: 0,
    cost: 0.01, // Much cheaper!
  };
}

/**
 * Analyze with Gemini 2.5 Pro (NEW)
 */
async function analyzeWithGeminiPro(request: VisionRequest): Promise<UnifiedVisionResult> {
  const result = await analyzeRackImageGemini(request.imageBuffer, 'pro');

  return {
    modules: result.modules,
    rackLayout: result.rackLayout,
    modelUsed: 'gemini-pro',
    processingTime: 0,
    cost: 0.08,
  };
}
```

---

### 3. Gemini Vision Analyzer

**File:** `lib/vision/gemini-analyzer.ts` (NEW)

````typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '@/lib/logger';

if (!process.env.GEMINI_API_KEY) {
  logger.warn('⚠️  GEMINI_API_KEY not set - Gemini vision disabled');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface GeminiVisionResult {
  modules: Array<{
    name: string;
    manufacturer: string;
    confidence: number;
    position: { x: number; y: number; width: number };
  }>;
  rackLayout: {
    rows: number;
    estimatedHP: number;
  };
}

/**
 * Analyze rack image with Gemini 2.5 (Flash or Pro)
 */
export async function analyzeRackImageGemini(
  imageBuffer: Buffer,
  model: 'flash' | 'pro' = 'flash'
): Promise<GeminiVisionResult> {
  const modelName = model === 'flash' ? 'gemini-2.5-flash' : 'gemini-2.5-pro';
  const geminiModel = genAI.getGenerativeModel({ model: modelName });

  logger.info(`🔍 Analyzing with Gemini ${model}`, {
    imageSize: imageBuffer.length,
    model: modelName,
  });

  const systemPrompt = `You are an expert in modular synthesizers with deep knowledge of Eurorack modules.

Analyze this modular synthesizer rack image and identify all visible modules.

For each module, provide:
1. Module name (be as specific as possible)
2. Manufacturer (if visible or identifiable)
3. Approximate position in the rack (left to right, top to bottom as 0-1 normalized coordinates)
4. Estimated width in HP (Eurorack horizontal pitch units, typically 2-84 HP)
5. Confidence level (0-1) in your identification

Also analyze:
- Number of rows in the rack
- Estimated total HP capacity
- Overall image quality for analysis

IMPORTANT: Return your analysis as valid JSON in this exact structure:
{
  "modules": [
    {
      "name": "Module Name",
      "manufacturer": "Manufacturer Name",
      "position": { "x": 0.1, "y": 0.0, "width": 12 },
      "confidence": 0.95
    }
  ],
  "rackLayout": {
    "rows": 2,
    "estimatedHP": 104
  }
}`;

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType: 'image/jpeg',
    },
  };

  const result = await geminiModel.generateContent([systemPrompt, imagePart]);
  const response = result.response;
  const text = response.text();

  // Parse JSON from response
  let jsonText = text;
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[1] || jsonMatch[0];
  }

  const analysis: GeminiVisionResult = JSON.parse(jsonText);

  logger.info('✅ Gemini analysis complete', {
    model: modelName,
    moduleCount: analysis.modules.length,
  });

  return analysis;
}
````

---

### 4. Update Rack Analysis API to Use Multi-Model

**File:** `app/api/racks/analyze/route.ts` (MODIFY)

```typescript
import { analyzeRackUnified } from '@/lib/vision/unified-analyzer';

export async function POST(request: NextRequest) {
  // ... existing auth and URL parsing ...

  const imageBuffer = await fetchRackImage(rackInput.cdnUrl);

  // NEW: Use unified analyzer with smart model routing
  const visionAnalysis = await analyzeRackUnified({
    imageBuffer,
    imageType: 'image/jpeg',
    userId,
    priorityLevel: 'balanced', // Can be customized per user
  });

  logger.info('📊 Vision analysis complete', {
    model: visionAnalysis.modelUsed,
    modules: visionAnalysis.modules.length,
    cost: visionAnalysis.cost,
    time: visionAnalysis.processingTime,
    escalated: visionAnalysis.escalated,
  });

  // ... rest of analysis and saving ...
}
```

---

## Cost Optimization Analysis

### Current State (Claude Only)

```
Average rack analysis: $0.05 per rack
1,000 racks/month: $50/month
10,000 racks/month: $500/month
```

### With Multi-Model Pipeline

```
Tier breakdown:
- 70% Gemini Flash @ $0.01 = $7 per 1,000 racks
- 25% Claude @ $0.05 = $12.50 per 1,000 racks
- 5% Gemini Pro @ $0.08 = $4 per 1,000 racks

Total: $23.50 per 1,000 racks (53% cost reduction!)

1,000 racks/month: $23.50/month (was $50)
10,000 racks/month: $235/month (was $500)

Annual savings at 10K racks/month: $3,180
```

---

## Speed Improvements

### Current State (Claude Only)

```
Average analysis time: 1.5 seconds
```

### With Multi-Model Pipeline

```
Weighted average:
- 70% Gemini Flash @ 0.8s = 0.56s
- 25% Claude @ 1.5s = 0.375s
- 5% Gemini Pro @ 2.5s = 0.125s

Total: 1.06s average (29% speed improvement!)
```

---

## Testing Strategy

### A/B Testing Plan

**Phase 1: Accuracy Validation (Week 1)**

- Test 100 racks with all three models
- Compare module identification accuracy
- Measure confidence scores
- Identify failure patterns

**Phase 2: Cost Optimization (Week 2)**

- Deploy router to 10% of users
- Monitor cost vs accuracy tradeoff
- Tune routing thresholds
- Measure escalation rates

**Phase 3: Full Rollout (Week 3)**

- Deploy to 100% of users
- Monitor cost savings
- Track user satisfaction
- Optimize routing rules

---

### Unit Tests

**File:** `__tests__/lib/model-router.test.ts` (NEW)

```typescript
import { VisionModelRouter } from '@/lib/vision/model-router';

describe('VisionModelRouter', () => {
  test('routes simple racks to Gemini Flash', () => {
    const decision = VisionModelRouter.route({
      imageBuffer: Buffer.from('fake'),
      imageType: 'image/jpeg',
      complexity: 'simple',
    });

    expect(decision.chosenModel).toBe('gemini-flash');
    expect(decision.estimatedCost).toBeLessThan(0.02);
  });

  test('routes complex racks to Claude', () => {
    const decision = VisionModelRouter.route({
      imageBuffer: Buffer.from('fake'),
      imageType: 'image/jpeg',
      complexity: 'complex',
    });

    expect(decision.chosenModel).toBe('claude');
  });

  test('respects user priority override', () => {
    const decision = VisionModelRouter.route({
      imageBuffer: Buffer.from('fake'),
      imageType: 'image/jpeg',
      priorityLevel: 'accurate',
    });

    expect(decision.chosenModel).toBe('gemini-pro');
  });
});
```

---

## Success Metrics

### Technical

- ✅ 50%+ cost reduction vs Claude-only
- ✅ 25%+ speed improvement on average
- ✅ <5% accuracy degradation (maintained >85% accuracy)
- ✅ <10% escalation rate (Gemini → Claude)
- ✅ 99.5%+ uptime with failover

### Business

- ✅ Lower per-rack cost = higher margins
- ✅ Faster analysis = better UX
- ✅ Multi-model redundancy = more reliable
- ✅ Ability to scale to 100K+ racks/month

---

## Rollout Plan

### Week 1: Integration

- [ ] Implement Gemini vision analyzer
- [ ] Build model router with routing logic
- [ ] Create unified analyzer interface
- [ ] A/B test with 100 racks

### Week 2: Validation

- [ ] Compare accuracy across models
- [ ] Tune routing thresholds
- [ ] Deploy to 10% of traffic
- [ ] Monitor cost and speed metrics

### Week 3: Production

- [ ] Deploy to 100% of traffic
- [ ] Update documentation
- [ ] Monitor error rates
- [ ] Celebrate cost savings! 🎉

---

## Open Questions

1. **Should users be able to choose their model?**
   - YES - Add "Fast", "Balanced", "Accurate" toggle
   - Default to "Balanced" (auto-routing)

2. **What if Gemini API keys aren't configured?**
   - Graceful degradation to Claude-only
   - Warning in logs but no user-facing errors

3. **How do we train the router to get smarter over time?**
   - Log routing decisions + outcomes
   - ML model to predict optimal routing (Phase 4)

---

## Definition of Done

- [ ] Gemini 2.5 Flash integrated
- [ ] Gemini 2.5 Pro integrated (for difficult cases)
- [ ] Model router selects optimal model
- [ ] Auto-escalation if confidence < 0.7
- [ ] Failover to Claude if Gemini fails
- [ ] Cost tracking per model
- [ ] A/B testing validates accuracy
- [ ] Documentation updated
- [ ] 50%+ cost reduction achieved

---

**This is how we become THE modular synthesis AI at scale! Let's optimize! 🚀💰**
