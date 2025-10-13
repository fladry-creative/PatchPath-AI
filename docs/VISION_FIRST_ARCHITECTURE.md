# Vision-First Architecture for PatchPath AI

**Date:** October 11, 2025
**Purpose:** Architectural design for vision-based module identification and database building

---

## Executive Summary

PatchPath AI is pivoting to a **vision-first architecture** that:

1. **Respects ModularGrid's anti-scraping policy** by using CDN images instead of page scraping
2. **Builds a comprehensive module database** through AI vision analysis
3. **Positions PatchPath as the "cool cousin"** - preserving modular synthesis knowledge when others won't
4. **Enables MCP server capabilities** - becoming THE universal modular synthesis knowledge source

---

## The Big Picture: From Scraper to Knowledge Hub

### Current State (Scraping-Based)

```
User provides URL → Puppeteer scrapes HTML → Parse modules → Generate patches
                                ↓
                          (ModularGrid unhappy)
```

### Vision-First Future

```
User provides URL/Image → Extract CDN image → Vision AI identifies modules → Build database → Generate patches
                                                        ↓
                                              (Respects ModularGrid + Builds knowledge base)
```

---

## URL Input Options: Supporting Both Worlds

### Option 1: Rack Page URL (Current)

**Format:** `https://modulargrid.net/e/racks/view/1186947`

**Advantages:**

- Familiar to users
- Contains rack metadata (name, owner, etc.)
- Can extract CDN URL programmatically

**Disadvantages:**

- Requires page scraping for metadata (ethical concern)
- Slower (network overhead)
- ModularGrid can block/rate limit

**Use Case:** Users who want full rack context and metadata

---

### Option 2: Direct CDN Image URL (NEW)

**Format:** `https://cdn.modulargrid.net/img/racks/modulargrid_1186947.jpg`

**Advantages:**

- **No scraping required** - just fetch image
- Fast (~100-200ms vs 2-3 seconds for scraping)
- No rate limiting concerns
- Works for private/unlisted racks (if you know the ID)
- Pure vision analysis workflow

**Disadvantages:**

- No metadata (rack name, owner, description)
- User needs to know rack ID or construct URL manually
- Can't verify rack still exists on ModularGrid

**Use Case:** Power users, vision-only analysis, respect for ModularGrid's policies

---

### Option 3: Image Upload (FUTURE)

**Format:** User uploads PNG/JPG from their device

**Advantages:**

- Works for custom racks NOT on ModularGrid
- Complete independence from ModularGrid
- Supports physical rack photos

**Disadvantages:**

- Image quality varies
- No standardization
- Requires more sophisticated vision analysis

**Use Case:** Custom racks, physical photos, ModularGrid-independent workflow

---

## Vision Analysis Workflow

### Input Processing

```typescript
// Support all three input types
interface RackInput {
  type: 'url' | 'cdn_image' | 'upload';
  value: string; // URL or base64 image
  metadata?: {
    rackId?: string;
    rackName?: string;
    owner?: string;
  };
}
```

### Step 1: Image Acquisition

```typescript
async function acquireRackImage(input: RackInput): Promise<Buffer> {
  switch (input.type) {
    case 'url':
      // Extract CDN URL from rack page (minimal scraping)
      const rackId = extractRackId(input.value);
      return fetchCDNImage(rackId);

    case 'cdn_image':
      // Direct CDN fetch
      return fetchImage(input.value);

    case 'upload':
      // Convert uploaded file to buffer
      return Buffer.from(input.value, 'base64');
  }
}

function extractCDNUrl(rackId: string): string {
  return `https://cdn.modulargrid.net/img/racks/modulargrid_${rackId}.jpg`;
}
```

---

### Step 2: Vision Analysis (Multi-Model Approach)

**Primary: Claude Sonnet 4.5 Vision**

- Best reasoning capabilities
- Superior module identification
- Understands context and relationships
- Cost: $3/1M input tokens, $15/1M output tokens

**Secondary: Gemini 2.5 Flash Vision**

- Faster processing
- Lower cost
- Good for bulk operations
- Native multimodal with 1M token context
- Cost: Lower than Claude

**Tertiary: Gemini 2.5 Pro Vision**

- Highest accuracy for difficult cases
- Best for complex racks
- 2M token context (future)
- Cost: Higher, use sparingly

```typescript
interface VisionAnalysisResult {
  modules: Array<{
    name: string;
    manufacturer: string;
    type: ModuleType;
    position: { x: number; y: number; width: number };
    confidence: number; // 0-1
    visualFeatures?: string[]; // Color, panel design, etc.
  }>;
  rackLayout: {
    rows: number;
    estimatedHP: number;
    case?: string;
  };
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}
```

---

### Step 3: Module Database Enrichment

**Confidence-Based Workflow:**

```typescript
// High confidence (>0.8) - Auto-add to database
if (module.confidence > 0.8) {
  await upsertModule(module, 'vision', module.confidence);
}

// Medium confidence (0.5-0.8) - Add with flag for review
if (module.confidence >= 0.5 && module.confidence <= 0.8) {
  await upsertModule(module, 'vision', module.confidence);
  await flagForCommunityVerification(module);
}

// Low confidence (<0.5) - Don't add, suggest manual entry
if (module.confidence < 0.5) {
  await suggestManualEntry(module);
}
```

**Community Verification:**

- Users can verify module identifications
- Each verification boosts confidence by +0.05
- Verified modules become training data
- Build trust and accuracy over time

---

## Module Database Architecture

### Schema Enhancement

```typescript
interface ModuleDocument extends Module {
  id: string;
  partitionKey: string; // manufacturer
  createdAt: string;
  updatedAt: string;

  // Vision metadata
  source: 'vision' | 'manual' | 'enrichment' | 'community';
  confidence: number;
  verifiedBy?: string[]; // User IDs who verified

  // Usage tracking
  usageCount: number; // Times seen in racks
  popularityScore: number; // Weighted usage + verification

  // Visual features (for ML training)
  visualFingerprint?: {
    dominantColors: string[];
    panelLayout: string;
    knobPattern: string;
    displayType?: string;
  };

  // Enrichment from ModularGrid (optional)
  moduleGridData?: {
    url: string;
    description: string;
    specs: Record<string, any>;
    lastUpdated: string;
  };
}
```

---

## MCP Server Architecture

### Vision: PatchPath as Universal Modular Synthesis Knowledge Source

**What is MCP?**
Model Context Protocol - Anthropic's open standard for connecting AI systems to external data sources and tools.

**PatchPath MCP Server Capabilities:**

```typescript
// MCP Server Tools
interface PatchPathMCPTools {
  // Module knowledge
  searchModules(query: string): Module[];
  getModuleSpecs(moduleId: string): ModuleSpecs;
  getCompatibleModules(technique: string): Module[];

  // Rack analysis
  analyzeRack(imageUrl: string): RackAnalysis;
  suggestMissingModules(rack: Rack): Module[];

  // Patch generation
  generatePatch(rack: Rack, intent: string): Patch;
  generateVariations(patch: Patch): Patch[];

  // Techniques database
  getTechnique(name: string): Technique;
  searchTechniques(genre: string): Technique[];

  // Community knowledge
  getPopularPatches(timeframe: string): Patch[];
  getModuleReviews(moduleId: string): Review[];
}
```

**Use Cases:**

- **AI assistants:** Claude, GPT-4, etc. can query PatchPath for modular synthesis knowledge
- **Plugin in Claude Desktop:** Direct integration for musicians
- **API for other tools:** VCV Rack, DAWs, hardware controllers
- **Community knowledge base:** Preserve synthesis knowledge forever

---

## Implementation Roadmap

### Phase 1: Vision-First Foundation (Weeks 1-2)

**Goal:** Support CDN image URLs and direct vision analysis

**Tasks:**

1. Add CDN URL parsing and validation
2. Create image acquisition service
3. Enhance vision analysis with module database integration
4. Update UI to accept both URL types
5. Add "How to get CDN URL" help dialog

**Deliverables:**

- Support both `modulargrid.net/e/racks/view/X` and `cdn.modulargrid.net/img/racks/modulargrid_X.jpg`
- Vision analysis saves to module database automatically
- Confidence scoring and verification system

---

### Phase 2: Module Database Growth (Weeks 3-4)

**Goal:** Build comprehensive module database through usage

**Tasks:**

1. Implement community verification UI
2. Add module search and browse interface
3. Create module detail pages with specs
4. Batch vision analysis for database seeding
5. Analytics dashboard for database growth

**Deliverables:**

- 1,000+ modules in database with confidence scores
- Community verification system
- Module popularity tracking
- Visual fingerprinting for ML training

---

### Phase 3: Gemini Multi-Model Integration (Weeks 5-6)

**Goal:** Optimize vision analysis with multiple AI models

**Tasks:**

1. Add Gemini 2.5 Flash for bulk operations
2. Add Gemini 2.5 Pro for difficult cases
3. Implement model router (choose best model for task)
4. A/B test accuracy across models
5. Optimize costs with smart routing

**Deliverables:**

- Multi-model vision pipeline
- Cost optimization (30-50% reduction)
- Accuracy improvements for edge cases
- Parallel analysis for speed

---

### Phase 4: MCP Server Development (Weeks 7-10)

**Goal:** Become universal modular synthesis knowledge source

**Tasks:**

1. Implement MCP protocol server
2. Define tool schemas for all capabilities
3. Create MCP client examples (Claude Desktop, etc.)
4. Document API and integration patterns
5. Launch community SDK

**Deliverables:**

- Production MCP server
- Claude Desktop integration
- API documentation
- Community SDKs (TypeScript, Python)
- Public knowledge base API

---

### Phase 5: Advanced Features (Weeks 11-16)

**Goal:** Next-generation synthesis companion

**Tasks:**

1. Physical rack photo analysis (mobile app)
2. Real-time patch suggestion (live patching companion)
3. Hardware controller integration
4. Module recommendation engine
5. Patch library with social features

**Deliverables:**

- Mobile app for physical rack analysis
- Hardware controller support
- Recommendation engine
- Social features (share, collaborate, remix)

---

## Technical Specifications

### Image Processing

```typescript
// CDN image extraction
function extractCDNUrl(input: string): string {
  // From rack page URL
  if (input.includes('/racks/view/')) {
    const rackId = input.match(/\/view\/(\d+)/)?.[1];
    return `https://cdn.modulargrid.net/img/racks/modulargrid_${rackId}.jpg`;
  }

  // Already a CDN URL
  if (input.includes('cdn.modulargrid.net')) {
    return input;
  }

  throw new Error('Invalid rack URL format');
}
```

### Vision Analysis Pipeline

```typescript
async function analyzeRackImage(
  imageBuffer: Buffer,
  options: {
    model: 'claude' | 'gemini-flash' | 'gemini-pro';
    saveToDatabase: boolean;
    userId?: string;
  }
): Promise<VisionAnalysisResult> {
  // Choose model based on options
  const analyzer = createVisionAnalyzer(options.model);

  // Analyze image
  const result = await analyzer.analyze(imageBuffer);

  // Save to database if requested
  if (options.saveToDatabase) {
    await batchUpsertModules(result.modules, 'vision');
  }

  // Track usage
  await trackVisionAnalysis({
    model: options.model,
    moduleCount: result.modules.length,
    quality: result.quality,
    userId: options.userId,
  });

  return result;
}
```

---

## Cost Analysis

### Current Scraping Approach

- **Puppeteer:** Free but slow (2-3s per rack)
- **Claude patch generation:** $0.05-0.15 per patch
- **Total:** $0.05-0.15 per operation

### Vision-First Approach

**Option A: Claude Sonnet 4.5 Only**

- **Vision analysis:** ~$0.03-0.10 per image
- **Patch generation:** $0.05-0.15 per patch
- **Total:** $0.08-0.25 per operation
- **Speed:** 1-2s (vs 2-3s scraping)

**Option B: Multi-Model Optimization**

- **Gemini Flash (80% of cases):** $0.01-0.03 per image
- **Claude (20% complex cases):** $0.03-0.10 per image
- **Blended cost:** ~$0.02-0.04 per vision analysis
- **Total:** $0.07-0.19 per operation
- **Speed:** 0.5-1s (Gemini is faster)

**Recommendation:** Multi-model approach for cost + speed optimization

---

## Success Metrics

### Technical KPIs

- **Module database size:** 5,000+ modules by month 6
- **Vision accuracy:** >90% confidence for top 500 modules
- **Analysis speed:** <1 second average
- **Cost per analysis:** <$0.10
- **Uptime:** 99.5%+

### Business KPIs

- **User growth:** Respect for ModularGrid = good reputation
- **Database value:** Comprehensive module catalog = moat
- **MCP adoption:** 10+ integrations by year 1
- **Community engagement:** 1,000+ module verifications/month

---

## Ethical Considerations

### Respecting ModularGrid

✅ **DO:**

- Fetch CDN images (public, cacheable resources)
- Provide attribution and links back to ModularGrid
- Encourage users to maintain ModularGrid profiles
- Respect rate limits on CDN requests

❌ **DON'T:**

- Scrape ModularGrid pages aggressively
- Copy ModularGrid's UI/UX
- Claim ownership of ModularGrid data
- Compete directly with ModularGrid

### Positioning

**PatchPath is:**

- A complementary AI companion for ModularGrid users
- A knowledge preservation project
- An innovation in patch generation
- A bridge between ModularGrid and AI assistants

**PatchPath is NOT:**

- A ModularGrid replacement
- A rack planning tool (ModularGrid does this best)
- A competitor to ModularGrid

---

## Next Steps

### Immediate Actions (This Week)

1. ✅ Document vision-first architecture
2. ✅ Research Gemini 2.5 models
3. ✅ Design MCP server capabilities
4. ⏳ Create GitHub issues for Phase 1
5. ⏳ Update UI to accept CDN URLs

### Short Term (Next 2 Weeks)

1. Implement CDN URL support
2. Enhance vision analysis → database pipeline
3. Add community verification system
4. Test with 100+ racks to seed database

### Medium Term (Months 2-3)

1. Integrate Gemini models
2. Optimize costs and speed
3. Build MCP server prototype
4. Launch public beta

### Long Term (Months 4-6)

1. Production MCP server
2. Mobile app for physical racks
3. Hardware integrations
4. Social features and community growth

---

## Conclusion

The vision-first architecture positions PatchPath AI as:

1. **Ethical:** Respects ModularGrid's wishes while building complementary value
2. **Innovative:** Uses cutting-edge AI vision to preserve modular synthesis knowledge
3. **Scalable:** Database grows automatically through usage
4. **Future-proof:** MCP server enables unlimited integrations
5. **Community-driven:** Verification system builds trust and accuracy

**This is the path to becoming THE modular synthesis AI companion.**

🎸 **Let's build the future of modular synthesis!** 🤖
