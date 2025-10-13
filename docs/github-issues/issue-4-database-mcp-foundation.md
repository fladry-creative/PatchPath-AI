# Issue #4: Module Database Growth & MCP Server Foundation

**Parent:** AI-Native Chat Paradigm Shift
**Priority:** P1 - High (strategic)
**Type:** Feature + Infrastructure + Data Strategy
**Phase:** 4 of 4
**Estimated Effort:** 1-2 weeks (ongoing)
**Dependencies:** Issue #1 (scraping on every URL)

---

## 🎯 Objective

Transform PatchPath AI from a patch generator into **the definitive Eurorack knowledge base** by systematically collecting, enriching, and organizing module data from every user interaction. Build foundation for future MCP (Model Context Protocol) server that makes all Eurorack knowledge accessible to AI systems.

---

## 📋 Current State (The Problem)

**Scraping Exists, But Data Isn't Maximized:**

Currently:

- ✅ Scrape ModularGrid racks when user provides URL
- ✅ Cache racks for 30 days (`rack-service.ts`)
- ✅ Store individual modules (`module-service.ts`)
- ✅ Basic enrichment (`enrichment.ts`, `enrichment-v2.ts`)

**But:**

- ❌ No systematic module discovery (only scrape user-provided racks)
- ❌ No completeness tracking (% of ModularGrid modules we have)
- ❌ No usage analytics (popular modules, rare gems, common combinations)
- ❌ No relationship mapping (modules often patched together)
- ❌ No MCP server (knowledge not accessible to AI ecosystem)
- ❌ No proactive enrichment (manual process, incomplete)

**Result:** We have data, but not a **database**. We have modules, but not **knowledge**.

---

## 🎯 Desired State (The Solution)

### **Vision: The Eurorack Knowledge Graph**

```
PatchPath AI becomes the go-to source for:
1. Complete Eurorack module catalog (10,000+ modules)
2. Rich metadata (specs, techniques, sound character)
3. Usage patterns (popular combos, patch techniques)
4. Relationship graph (works well with X, replaces Y)
5. Educational content (how to use each module)
6. AI-accessible via MCP server

Everyone wins:
- Users: Better patch suggestions (more module knowledge)
- Developers: MCP server for building Eurorack tools
- Manufacturers: Visibility for their modules
- Community: Centralized, searchable knowledge base
```

### **Data Sources:**

1. **User Interactions** (primary):
   - Every rack URL = scrape all modules
   - Every patch = track module combinations
   - Every conversation = implicit usage patterns

2. **ModularGrid** (with respect):
   - Public rack pages (already scraping)
   - Module database (via search/browse, rate-limited)
   - Manufacturer pages (module lists)

3. **Community Contributions** (future):
   - User-submitted tips/tricks
   - Module reviews/ratings
   - Patch technique tutorials

4. **Manufacturer Data** (future):
   - Official manuals (PDF parsing)
   - Specification sheets
   - Demo videos (YouTube/Vimeo)

---

## ✅ Acceptance Criteria

### 1. Systematic Module Discovery

- [ ] Track modules discovered vs total ModularGrid catalog
- [ ] Proactive scraping strategy (popular racks, new modules)
- [ ] Weekly "discovery rate" metric
- [ ] Target: 80% coverage within 6 months

### 2. Enhanced Module Metadata

- [ ] Full specs: inputs, outputs, HP, power, price
- [ ] Function tags: VCO, VCF, VCA, effects, etc.
- [ ] Technique tags: FM, waveshaping, granular, etc.
- [ ] Sound character: warm, cold, digital, analog, etc.
- [ ] Difficulty: beginner, intermediate, advanced

### 3. Usage Analytics

- [ ] Track which modules appear in user racks
- [ ] Count patches generated per module
- [ ] Identify popular combinations (Maths + X)
- [ ] Detect rare gems (great but underused)
- [ ] Dashboard for internal analytics

### 4. Relationship Mapping

- [ ] "Often paired with" (co-occurrence in racks)
- [ ] "Similar to" (same function, different brand)
- [ ] "Replaces" (newer version, better alternative)
- [ ] "Complements" (fills gap in capabilities)
- [ ] Graph database or embeddings for similarity

### 5. MCP Server Foundation

- [ ] Schema design for MCP resources
- [ ] API endpoints for module search/query
- [ ] Authentication/rate limiting
- [ ] Documentation for MCP integration
- [ ] Example MCP client (for testing)

### 6. Data Quality & Completeness

- [ ] 80%+ modules have full specs
- [ ] 90%+ modules have function tags
- [ ] 60%+ modules have enriched descriptions
- [ ] Automated quality checks (missing data alerts)

---

## 🏗️ Technical Specifications

### **Enhanced Module Schema:**

```typescript
// types/module.ts (ENHANCED)

export interface EnhancedModule {
  // Existing fields
  id: string;
  name: string;
  manufacturer: string;
  hp: number;
  powerDraw: PowerConsumption;

  // NEW: Full specifications
  specs: {
    inputs: ModuleIO[];
    outputs: ModuleIO[];
    controls: ModuleControl[];
    depth: number; // mm
    price?: number; // USD
    releaseDate?: Date;
    discontinued?: boolean;
  };

  // NEW: Rich metadata
  metadata: {
    functionTags: string[]; // ['VCO', 'FM', 'Wavetable']
    techniqueTags: string[]; // ['FM synthesis', 'Phase modulation']
    soundCharacter: string[]; // ['warm', 'analog', 'versatile']
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    description: string; // AI-enriched
    shortDescription: string; // One-liner
  };

  // NEW: Usage analytics
  analytics: {
    appearsInRacks: number; // How many user racks
    usedInPatches: number; // How many patches
    popularityScore: number; // Normalized 0-100
    lastSeenAt: Date;
    firstSeenAt: Date;
  };

  // NEW: Relationships
  relationships: {
    oftenPairedWith: string[]; // Module IDs
    similarTo: string[]; // Module IDs
    replaces?: string; // Predecessor module ID
    complementedBy: string[]; // Fills gaps
  };

  // NEW: Educational content
  education: {
    tips: string[]; // Usage tips
    techniques: PatchTechnique[]; // Common patch patterns
    tutorialLinks: string[]; // YouTube, blog posts
    manualUrl?: string;
  };

  // Existing fields
  scrapeUrl: string;
  imageUrl?: string;
  lastScrapedAt: Date;
}

export interface ModuleIO {
  name: string;
  type: 'audio' | 'cv' | 'gate' | 'trigger';
  description?: string;
}

export interface ModuleControl {
  name: string;
  type: 'knob' | 'switch' | 'button' | 'attenuverter';
  function: string;
}

export interface PatchTechnique {
  name: string;
  description: string;
  requiredModules: string[]; // Module names
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}
```

### **Module Discovery Service:**

```typescript
// lib/database/module-discovery-service.ts (NEW FILE)

export class ModuleDiscoveryService {
  /**
   * Discover new modules from ModularGrid
   * Rate-limited, respectful scraping
   */
  async discoverNewModules(limit: number = 50): Promise<string[]> {
    // 1. Get popular racks from ModularGrid browse page
    // 2. Scrape each rack for modules
    // 3. Compare against our database
    // 4. Return new module IDs
    // 5. Queue for enrichment
  }

  /**
   * Calculate discovery progress
   */
  async getDiscoveryStats(): Promise<{
    totalKnown: number;
    totalModularGrid: number;
    coveragePercent: number;
    discoveredThisWeek: number;
  }> {
    // Query database + scrape ModularGrid total count
  }

  /**
   * Proactive enrichment queue
   */
  async queueEnrichment(moduleId: string, priority: 'high' | 'medium' | 'low'): Promise<void> {
    // Add to enrichment queue (Redis or Cosmos)
    // Process in background worker
  }
}
```

### **Usage Analytics Service:**

```typescript
// lib/database/module-analytics-service.ts (NEW FILE)

export class ModuleAnalyticsService {
  /**
   * Track when module appears in a rack
   */
  async recordRackAppearance(moduleIds: string[], rackId: string): Promise<void> {
    // Increment appearsInRacks counter
    // Update lastSeenAt
    // Track co-occurrences for relationships
  }

  /**
   * Track when module is used in a patch
   */
  async recordPatchUsage(moduleIds: string[], patchId: string): Promise<void> {
    // Increment usedInPatches counter
    // Update popularity score
    // Track combinations
  }

  /**
   * Get popular modules
   */
  async getPopularModules(limit: number = 100): Promise<EnhancedModule[]> {
    // Sort by popularity score
    // Return top N
  }

  /**
   * Get rare gems (high quality, low usage)
   */
  async getRareGems(limit: number = 50): Promise<EnhancedModule[]> {
    // Modules with good specs but low usage
    // Hidden gems
  }

  /**
   * Get module combinations
   */
  async getCommonPairings(
    moduleId: string,
    limit: number = 10
  ): Promise<
    Array<{
      module: EnhancedModule;
      coOccurrenceCount: number;
    }>
  > {
    // Modules often found in same racks
    // Sorted by frequency
  }
}
```

### **Relationship Mapper:**

```typescript
// lib/database/module-relationships.ts (NEW FILE)

export class ModuleRelationshipMapper {
  /**
   * Analyze racks to find common pairings
   */
  async analyzeCoOccurrence(): Promise<void> {
    // For each rack in database:
    //   For each pair of modules:
    //     Increment co-occurrence count
    // Store in relationships table
  }

  /**
   * Find similar modules (embeddings-based)
   */
  async computeSimilarity(): Promise<void> {
    // Generate embeddings for each module (specs + description)
    // Use Claude or Gemini embeddings API
    // Store in vector database (Cosmos DB supports vectors)
    // Compute cosine similarity
  }

  /**
   * Suggest replacements/alternatives
   */
  async findAlternatives(moduleId: string): Promise<EnhancedModule[]> {
    // Based on function + sound character
    // "Similar to X but cheaper/smaller/newer"
  }
}
```

### **MCP Server Schema:**

```typescript
// mcp-server/resources.ts (NEW FILE)

/**
 * MCP Server Resources for Eurorack modules
 * See: https://modelcontextprotocol.io/
 */

export const mcpResources = [
  {
    uri: 'eurorack://modules/search',
    name: 'Search Eurorack Modules',
    description: 'Search modules by name, manufacturer, function, or technique',
    mimeType: 'application/json',
  },
  {
    uri: 'eurorack://modules/{id}',
    name: 'Get Module Details',
    description: 'Full specifications and metadata for a module',
    mimeType: 'application/json',
  },
  {
    uri: 'eurorack://modules/{id}/relationships',
    name: 'Get Module Relationships',
    description: 'Modules often paired with, similar to, or complementing this module',
    mimeType: 'application/json',
  },
  {
    uri: 'eurorack://techniques',
    name: 'List Patch Techniques',
    description: 'Common synthesis techniques and required modules',
    mimeType: 'application/json',
  },
  {
    uri: 'eurorack://racks/{id}',
    name: 'Get Rack Configuration',
    description: 'Full rack data with modules and capabilities',
    mimeType: 'application/json',
  },
];

// Example query:
// URI: eurorack://modules/search?q=oscillator&function=VCO&manufacturer=Make+Noise
// Response: Array<EnhancedModule>
```

### **Proactive Scraping Strategy:**

```typescript
// lib/scraper/proactive-scraper.ts (NEW FILE)

export class ProactiveScraper {
  /**
   * Daily discovery job (cron)
   * Runs at 2am UTC, rate-limited
   */
  async dailyDiscovery(): Promise<void> {
    // 1. Scrape ModularGrid "Popular" page (top 50 racks)
    // 2. Scrape ModularGrid "Recent" page (last 50 racks)
    // 3. Extract modules from each rack
    // 4. Check against database
    // 5. Enqueue new modules for enrichment
    // 6. Sleep 5 seconds between racks (respect rate limit)
  }

  /**
   * Weekly deep scan (cron)
   * Runs on Sunday, more aggressive
   */
  async weeklyDeepScan(): Promise<void> {
    // 1. Get all manufacturers from ModularGrid
    // 2. For each manufacturer, get module list
    // 3. Compare against our database
    // 4. Enqueue missing modules
    // 5. Sleep 10 seconds between manufacturers
  }

  /**
   * Re-enrichment job (cron)
   * Updates stale module data
   */
  async reEnrichStaleModules(): Promise<void> {
    // Find modules not updated in 90 days
    // Re-scrape for updated specs/prices
    // Re-run AI enrichment
  }
}
```

---

## 📊 Testing Requirements

### **Unit Tests:**

- [ ] `module-discovery-service.test.ts`: Discovery logic
- [ ] `module-analytics-service.test.ts`: Analytics tracking
- [ ] `module-relationships.test.ts`: Relationship mapping
- [ ] `proactive-scraper.test.ts`: Scraping logic (mocked)

### **Integration Tests:**

- [ ] Discovery finds new modules correctly
- [ ] Analytics update when racks/patches created
- [ ] Relationships computed accurately
- [ ] MCP server responds correctly

### **Data Quality Tests:**

- [ ] No duplicate modules (same module, different IDs)
- [ ] All modules have minimum required fields
- [ ] Relationships are bidirectional
- [ ] Analytics counters are accurate

---

## 🔗 Dependencies & Related Work

### **Depends On:**

- Issue #1: Enhanced Chat Backend (auto-scraping on every URL)

### **Enables:**

- Better patch suggestions (more module knowledge)
- Future features: module recommendations, rack builder
- MCP ecosystem integration
- Community tools (API access)

### **Files Modified:**

- `types/module.ts` - Enhanced schema
- `lib/database/module-service.ts` - Add analytics tracking
- `lib/scraper/modulargrid.ts` - More robust scraping
- `app/api/chat/patches/route.ts` - Track usage on generation

### **Files Created:**

- `lib/database/module-discovery-service.ts`
- `lib/database/module-analytics-service.ts`
- `lib/database/module-relationships.ts`
- `lib/scraper/proactive-scraper.ts`
- `mcp-server/server.ts` - MCP server implementation
- `mcp-server/resources.ts` - MCP resource definitions
- `scripts/cron-discovery.ts` - Cron job for discovery
- `__tests__/lib/database/` - Test suite

---

## 📈 Success Metrics

### **Data Coverage:**

- [ ] Month 1: 30% of ModularGrid modules (3,000+)
- [ ] Month 3: 60% of ModularGrid modules (6,000+)
- [ ] Month 6: 80% of ModularGrid modules (8,000+)

### **Data Quality:**

- [ ] 80%+ modules have full specs
- [ ] 90%+ modules have function tags
- [ ] 60%+ modules have AI-enriched descriptions
- [ ] < 1% duplicate modules

### **Usage Tracking:**

- [ ] 100% of user racks tracked
- [ ] 100% of patches tracked
- [ ] Popularity scores updated daily
- [ ] Relationship graph updated weekly

### **MCP Server:**

- [ ] API response time: < 200ms
- [ ] 99.9% uptime
- [ ] Rate limiting: 1000 requests/hour per client
- [ ] Documentation: 100% complete

---

## 🚀 Implementation Checklist

### **Week 1: Schema & Services**

- [ ] Design enhanced module schema
- [ ] Create module discovery service
- [ ] Create analytics service
- [ ] Create relationship mapper
- [ ] Update database migrations

### **Week 1-2: Proactive Scraping**

- [ ] Build proactive scraper
- [ ] Add rate limiting/respect logic
- [ ] Create cron jobs (daily/weekly)
- [ ] Deploy to background worker
- [ ] Monitor discovery rate

### **Week 2: Analytics Integration**

- [ ] Track rack appearances
- [ ] Track patch usage
- [ ] Compute popularity scores
- [ ] Build analytics dashboard (internal)

### **Week 2-3: MCP Server**

- [ ] Design MCP resource schema
- [ ] Build MCP server endpoints
- [ ] Add authentication/rate limiting
- [ ] Write MCP documentation
- [ ] Test with example clients

### **Week 3+: Ongoing**

- [ ] Monitor data quality
- [ ] Fix duplicate modules
- [ ] Enrich missing metadata
- [ ] Build public-facing module search
- [ ] Community contributions (future)

---

## 💬 Technical Considerations

### **Ethical Scraping:**

- ModularGrid has no public API
- Scraping must be respectful:
  - 5-10 second delays between requests
  - User-Agent identifies PatchPath
  - Only scrape public pages
  - Cache aggressively (30-day cache)
  - Don't republish full content (just metadata)
- Consider reaching out to ModularGrid for partnership

### **Data Storage:**

- Cosmos DB already in use (good)
- Consider separate container for analytics (hot data)
- Vector embeddings for similarity (Cosmos supports this)
- Redis for enrichment queue (faster)

### **Cost Management:**

- AI enrichment costs money (Claude API)
- Prioritize popular modules first
- Batch enrichment (50 modules per job)
- Cache enriched descriptions forever

### **MCP Server Hosting:**

- Deploy separately from main app (scalability)
- Docker container (already have Dockerfile)
- Azure Container Apps (same as main app)
- Public endpoint with rate limiting

---

## 🎭 User Stories

### **Story 1: The Data Builder**

```
As PatchPath AI,
I want to systematically collect module data,
So that I can provide better patch suggestions.
```

**Acceptance:**

- Every user interaction = data collection
- Weekly discovery scans find new modules
- 80% coverage within 6 months

### **Story 2: The MCP Developer**

```
As an external developer,
I want to query the Eurorack knowledge base via MCP,
So that I can build tools without scraping myself.
```

**Acceptance:**

- MCP server returns module data
- API is documented and easy to use
- Rate limiting prevents abuse

### **Story 3: The User**

```
As a PatchPath user,
I want better patch suggestions,
So that I discover modules I didn't know I had.
```

**Acceptance:**

- AI knows my modules deeply (not just names)
- Suggestions are creative and accurate
- Rare modules get recognition

---

## 📝 Open Questions

1. **ModularGrid Partnership:** Should we reach out for official API access?
2. **Data Licensing:** How do we handle copyright (module descriptions, images)?
3. **Community Contributions:** Allow users to submit tips/reviews?
4. **Monetization:** MCP server free or paid? API tiers?
5. **Data Export:** Allow users to download full database?

---

## 🔍 Testing Scenarios

### **Discovery Scenario:**

1. Cron job runs daily discovery
2. Finds 50 popular racks
3. Extracts 500 modules (20 new)
4. Adds new modules to database
5. Queues for enrichment

### **Analytics Scenario:**

1. User analyzes rack with Maths + DPO
2. System tracks: Maths appeared, DPO appeared
3. Increments co-occurrence: Maths+DPO
4. Updates popularity scores
5. Relationship graph updated

### **MCP Query Scenario:**

1. External app queries: `eurorack://modules/search?q=oscillator`
2. MCP server searches database
3. Returns 100 VCO modules
4. Response includes full specs + relationships
5. Client rate limit tracked

---

## 🎸 Why This Matters

**This isn't just a feature. This is strategic.**

**Short-term:** Better patch suggestions (more module knowledge)
**Medium-term:** Community tool (module search, rack builder)
**Long-term:** The Eurorack knowledge base (MCP server, partnerships)

**Without this:** PatchPath is a cool patch generator
**With this:** PatchPath is the definitive Eurorack knowledge platform

**Data is the moat.** If we build the best database:

- Users get better suggestions (retention)
- Developers build on our MCP (ecosystem)
- Manufacturers want to partner (visibility)
- Community trusts us (authority)

**This is how we become essential, not just useful.**

---

## 📚 Related Resources

### **MCP Protocol:**

- Spec: https://modelcontextprotocol.io/
- Examples: https://github.com/anthropics/mcp-examples

### **ModularGrid:**

- Respectful scraping guide (write our own)
- Rate limiting best practices

### **Embeddings:**

- Claude Embeddings (via API)
- Gemini Embeddings (already have API key)
- Cosmos DB vector search

---

**Ready to build:** After Issue #1 (auto-scraping) ✅
**Blocks other work:** No (can build in parallel)
**Estimated completion:** Weeks 1-3 of AI-Native Paradigm Shift (ongoing)
**Long-term impact:** CRITICAL for PatchPath's future
