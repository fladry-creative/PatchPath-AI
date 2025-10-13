# GitHub Issue: Module Database Growth & Community Verification

**Priority:** 🔥 HIGH
**Estimated Effort:** 5-7 days
**Phase:** 2 - Database Building
**Dependencies:** CDN Vision Support must be completed first
**Related Docs:** `VISION_FIRST_ARCHITECTURE.md`

---

## Vision Statement

**Build the most comprehensive Eurorack module database in existence through:**

1. **Automatic growth** via vision analysis of every rack
2. **Community verification** to ensure accuracy
3. **Smart deduplication** to handle variations in module names
4. **Rich metadata** including visual fingerprints, popularity, specs

**Goal:** 5,000+ modules with >90% accuracy by Month 6

---

## The Big Picture: From Zero to Hero

### Current State

```
Module database: ~100 modules (manually seeded)
Source: Hard-coded mock data
Accuracy: Unknown (no verification)
Growth rate: Manual additions only
```

### Target State (Month 6)

```
Module database: 5,000+ modules
Source: Vision analysis + community verification
Accuracy: >90% (verified by community)
Growth rate: Automatic (every rack analyzed adds modules)
Coverage: Top 500 modules >95% confidence
```

---

## How It Works: Automatic Database Growth

### Every Rack Analyzed = Database Growth

```typescript
User analyzes rack
        ↓
Vision AI identifies 20 modules
        ↓
For each module:
  - Check if exists in database
  - If NEW → Add with confidence score
  - If EXISTS → Increment usage count
  - If SIMILAR → Smart deduplication
        ↓
Database grows automatically!
```

---

## Technical Implementation

### 1. Smart Module Deduplication

**Problem:** Same module, different names

```
"Mutable Instruments Plaits"
"MI Plaits"
"Plaits"
"Mutable Plaits"
→ Should all map to ONE database entry
```

**Solution:** Fuzzy matching + canonical naming

**File:** `lib/database/module-deduplication.ts` (NEW)

```typescript
import { findModule, searchModules, upsertModule, type ModuleDocument } from './module-service';
import logger from '@/lib/logger';

export interface DeduplicationResult {
  action: 'new' | 'existing' | 'merged';
  module: ModuleDocument;
  canonicalName: string;
  alternatives: string[]; // Known name variations
}

/**
 * Canonicalize module name for deduplication
 * Examples:
 * - "Mutable Instruments Plaits" → "plaits"
 * - "MI Plaits" → "plaits"
 * - "Make Noise Maths" → "maths"
 */
export function canonicalize(name: string, manufacturer: string): string {
  // Remove manufacturer name from module name
  let canonical = name.toLowerCase();

  // Common manufacturer abbreviations
  const manufacturerVariations = [
    manufacturer.toLowerCase(),
    getManufacturerAbbreviation(manufacturer).toLowerCase(),
  ];

  for (const mfr of manufacturerVariations) {
    canonical = canonical.replace(new RegExp(`^${mfr}\\s+`, 'i'), '');
    canonical = canonical.replace(new RegExp(`\\s+${mfr}$`, 'i'), '');
  }

  // Remove version numbers (v1, v2, mk2, etc.)
  canonical = canonical.replace(/\s+(v\d+|mk\d+|mark\s\d+)/gi, '');

  // Normalize whitespace
  canonical = canonical.trim().replace(/\s+/g, '-');

  // Remove special characters
  canonical = canonical.replace(/[^a-z0-9-]/g, '');

  return canonical;
}

/**
 * Get manufacturer abbreviation
 */
function getManufacturerAbbreviation(manufacturer: string): string {
  const abbreviations: Record<string, string> = {
    'Mutable Instruments': 'MI',
    'Make Noise': 'MN',
    Intellijel: 'IJ',
    'ALM Busy Circuits': 'ALM',
    'LZX Industries': 'LZX',
    // Add more as discovered
  };

  return abbreviations[manufacturer] || manufacturer;
}

/**
 * Find or create module with smart deduplication
 */
export async function findOrCreateModule(
  name: string,
  manufacturer: string,
  confidence: number,
  source: ModuleDocument['source'] = 'vision'
): Promise<DeduplicationResult> {
  // Step 1: Try exact match
  const exactMatch = await findModule(name, manufacturer);
  if (exactMatch) {
    logger.info('✅ Exact module match found', { name, manufacturer });
    return {
      action: 'existing',
      module: exactMatch,
      canonicalName: exactMatch.name,
      alternatives: [],
    };
  }

  // Step 2: Try fuzzy search with canonical name
  const canonical = canonicalize(name, manufacturer);
  const fuzzyMatches = await searchModules(canonical, manufacturer);

  if (fuzzyMatches.length > 0) {
    // Found similar modules - use the highest confidence one
    const bestMatch = fuzzyMatches.sort((a, b) => b.confidence - a.confidence)[0];

    // If confidence is high enough, treat as same module
    if (bestMatch.confidence > 0.8) {
      logger.info('🔗 Fuzzy match found, using existing module', {
        newName: name,
        existingName: bestMatch.name,
        canonical,
      });

      return {
        action: 'merged',
        module: bestMatch,
        canonicalName: bestMatch.name,
        alternatives: [name],
      };
    }
  }

  // Step 3: No match found, create new module
  logger.info('✨ Creating new module', { name, manufacturer, canonical });

  const newModule = await upsertModule(
    {
      name,
      manufacturer,
      type: 'Other', // Will be enhanced later
      hp: 0, // Unknown
      inputs: [],
      outputs: [],
    },
    source,
    confidence
  );

  return {
    action: 'new',
    module: newModule,
    canonicalName: name,
    alternatives: [],
  };
}
```

---

### 2. Module Verification System

**Problem:** Vision AI isn't perfect - need human verification

**Solution:** Community verification with gamification

**File:** `lib/database/module-verification.ts` (NEW)

```typescript
import { verifyModule, type ModuleDocument } from './module-service';
import logger from '@/lib/logger';

export interface VerificationRequest {
  moduleId: string;
  manufacturer: string;
  userId: string;
  feedback: {
    nameCorrect: boolean;
    manufacturerCorrect: boolean;
    typeCorrect: boolean;
    suggestedName?: string;
    suggestedManufacturer?: string;
    suggestedType?: string;
    comments?: string;
  };
}

export interface VerificationReward {
  points: number;
  badge?: string;
  unlockedFeatures?: string[];
}

/**
 * Verify module with user feedback
 */
export async function submitModuleVerification(
  request: VerificationRequest
): Promise<{ module: ModuleDocument; reward: VerificationReward }> {
  logger.info('👤 User verifying module', {
    moduleId: request.moduleId,
    userId: request.userId,
  });

  // Step 1: Record verification
  const updatedModule = await verifyModule(request.moduleId, request.manufacturer, request.userId);

  if (!updatedModule) {
    throw new Error('Module not found');
  }

  // Step 2: If corrections suggested, flag for admin review
  if (
    !request.feedback.nameCorrect ||
    !request.feedback.manufacturerCorrect ||
    !request.feedback.typeCorrect
  ) {
    await flagModuleForReview(updatedModule, request.feedback);
  }

  // Step 3: Calculate user reward
  const reward = calculateVerificationReward(request.userId, request.feedback);

  logger.info('🎉 Module verified, user rewarded', {
    moduleId: request.moduleId,
    userId: request.userId,
    points: reward.points,
  });

  return {
    module: updatedModule,
    reward,
  };
}

/**
 * Flag module for admin review
 */
async function flagModuleForReview(
  module: ModuleDocument,
  feedback: VerificationRequest['feedback']
): Promise<void> {
  // Store in review queue (future: admin dashboard)
  logger.warn('⚠️  Module flagged for review', {
    moduleId: module.id,
    feedback,
  });

  // TODO: Implement review queue in Cosmos DB
}

/**
 * Calculate verification reward (gamification)
 */
function calculateVerificationReward(
  userId: string,
  feedback: VerificationRequest['feedback']
): VerificationReward {
  let points = 10; // Base points for verification

  // Bonus points for corrections
  if (!feedback.nameCorrect || !feedback.manufacturerCorrect || !feedback.typeCorrect) {
    points += 20; // Bonus for finding errors
  }

  // Bonus for detailed feedback
  if (feedback.comments && feedback.comments.length > 20) {
    points += 10;
  }

  return {
    points,
    badge: points >= 30 ? 'Module Expert' : undefined,
    unlockedFeatures: points >= 50 ? ['Advanced Search', 'Bulk Export'] : undefined,
  };
}
```

---

### 3. Visual Fingerprinting (ML Training Data)

**Goal:** Extract visual features for future ML training

**File:** `lib/vision/visual-fingerprint.ts` (NEW)

```typescript
import sharp from 'sharp';

export interface VisualFingerprint {
  dominantColors: string[]; // Hex colors
  panelLayout: 'minimal' | 'complex' | 'digital' | 'analog';
  knobPattern: 'few' | 'medium' | 'many';
  displayType?: 'led' | 'oled' | 'lcd' | 'none';
  textDensity: 'sparse' | 'medium' | 'dense';
}

/**
 * Extract visual fingerprint from module crop
 * Future use: Train ML model to identify modules visually
 */
export async function extractVisualFingerprint(imageCrop: Buffer): Promise<VisualFingerprint> {
  // Use sharp for image analysis
  const image = sharp(imageCrop);
  const stats = await image.stats();

  // Extract dominant colors
  const dominantColors = stats.channels.map((channel) => rgbToHex(Math.round(channel.mean)));

  // Analyze complexity (future: more sophisticated)
  const complexity = analyzeComplexity(stats);

  return {
    dominantColors: dominantColors.slice(0, 3),
    panelLayout: complexity > 0.7 ? 'complex' : 'minimal',
    knobPattern: 'medium', // Placeholder
    textDensity: 'medium', // Placeholder
  };
}

function rgbToHex(value: number): string {
  return `#${value.toString(16).padStart(2, '0')}`.repeat(3);
}

function analyzeComplexity(stats: sharp.Stats): number {
  // Calculate complexity based on color variance
  const variance = stats.channels.reduce((sum, ch) => sum + ch.stdev, 0);
  return Math.min(variance / 100, 1);
}
```

---

### 4. Module Database Analytics

**File:** `app/api/modules/stats/route.ts` (NEW)

```typescript
import { NextResponse } from 'next/server';
import { getModuleStats } from '@/lib/database/module-service';

/**
 * GET /api/modules/stats
 * Public API for module database statistics
 */
export async function GET() {
  const stats = await getModuleStats();

  return NextResponse.json({
    success: true,
    stats: {
      totalModules: stats.totalModules,
      byManufacturer: stats.byManufacturer,
      byType: stats.byType,
      bySource: stats.bySource,
      avgConfidence: stats.avgConfidence,
    },
    milestones: {
      next: getNextMilestone(stats.totalModules),
      progress: getMilestoneProgress(stats.totalModules),
    },
  });
}

function getNextMilestone(current: number): { count: number; reward: string } {
  const milestones = [
    { count: 100, reward: '🎉 First 100!' },
    { count: 500, reward: '🚀 Top modules covered!' },
    { count: 1000, reward: '💪 1K milestone!' },
    { count: 5000, reward: '🏆 5K modules - Comprehensive database!' },
    { count: 10000, reward: '👑 10K modules - World-class!' },
  ];

  return milestones.find((m) => m.count > current) || milestones[milestones.length - 1];
}

function getMilestoneProgress(current: number): number {
  const next = getNextMilestone(current);
  const prev = Math.max(...[0, 100, 500, 1000, 5000].filter((m) => m <= current));
  return ((current - prev) / (next.count - prev)) * 100;
}
```

---

### 5. Module Search & Browse UI

**File:** `app/modules/page.tsx` (NEW)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { searchModules, getPopularModules } from '@/lib/database/module-service';

export default function ModulesPage() {
  const [query, setQuery] = useState('');
  const [modules, setModules] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Load statistics
    fetch('/api/modules/stats')
      .then((res) => res.json())
      .then((data) => setStats(data.stats));
  }, []);

  const handleSearch = async () => {
    if (query.length > 2) {
      const results = await searchModules(query);
      setModules(results);
    } else {
      const popular = await getPopularModules(50);
      setModules(popular);
    }
  };

  return (
    <div className="container">
      <h1>Module Database</h1>

      {/* Stats Dashboard */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{stats.totalModules}</h3>
            <p>Total Modules</p>
          </div>
          <div className="stat-card">
            <h3>{(stats.avgConfidence * 100).toFixed(0)}%</h3>
            <p>Avg Confidence</p>
          </div>
          <div className="stat-card">
            <h3>{Object.keys(stats.byManufacturer).length}</h3>
            <p>Manufacturers</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyUp={handleSearch}
          placeholder="Search modules..."
          className="search-input"
        />
      </div>

      {/* Module Grid */}
      <div className="module-grid">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </div>
  );
}

function ModuleCard({ module }) {
  return (
    <div className="module-card">
      <h3>{module.name}</h3>
      <p className="manufacturer">{module.manufacturer}</p>
      <div className="module-meta">
        <span className="badge">{module.type}</span>
        <span className="confidence">{(module.confidence * 100).toFixed(0)}% confidence</span>
      </div>
      {module.verifiedBy && module.verifiedBy.length > 0 && (
        <div className="verified">
          ✓ Verified by {module.verifiedBy.length}{' '}
          {module.verifiedBy.length === 1 ? 'user' : 'users'}
        </div>
      )}
      <button className="verify-btn" onClick={() => verifyModule(module.id)}>
        Verify This Module (+10 pts)
      </button>
    </div>
  );
}
```

---

## Growth Strategy: Seeding the Database

### Phase 1: Curated Seed Data (Week 1)

**Goal:** 100 most popular modules, manually verified

**Method:**

1. Scrape ModularGrid "Most Popular" list (one-time, with permission)
2. Manually verify each module
3. Seed database with high confidence (1.0)

**Output:** 100 modules, 100% accuracy

---

### Phase 2: Automatic Growth via User Racks (Weeks 2-4)

**Goal:** Grow to 1,000 modules through organic usage

**Method:**

1. Every rack analyzed adds new modules automatically
2. Community verification for quality control
3. Deduplication prevents duplicates

**Projected Growth:**

- 100 racks/day × 20 modules/rack = 2,000 module identifications/day
- 50% are duplicates = 1,000 new identifications/day
- 30% confidence threshold = 300 new modules/day
- After deduplication: ~50 truly new modules/day

**Output:** 1,000 modules by Week 4

---

### Phase 3: Batch Analysis for Coverage (Weeks 5-8)

**Goal:** Analyze 10,000+ public ModularGrid racks to achieve 5,000 module coverage

**Method:**

1. Use ModularGrid API (if available) or respectful scraping of public racks
2. Batch vision analysis with Gemini Flash (cheap!)
3. Save all identified modules to database
4. Community verification for quality

**Projected Growth:**

- 10,000 racks × 20 modules = 200,000 identifications
- After deduplication: ~5,000 unique modules

**Output:** 5,000 modules, >85% confidence

---

## Success Metrics

### Database Quality

- ✅ 5,000+ modules by Month 6
- ✅ Top 500 modules: >95% confidence
- ✅ Overall accuracy: >90% (verified by community)
- ✅ <2% duplicate rate

### Community Engagement

- ✅ 1,000+ module verifications per month
- ✅ 100+ active verifiers
- ✅ 500+ corrections suggested
- ✅ 95%+ user satisfaction with results

### Technical

- ✅ Deduplication: <2% false positives
- ✅ Search latency: <100ms
- ✅ Database size: <100MB
- ✅ Query performance: <50ms per lookup

---

## Gamification & Incentives

### User Rewards for Verification

- **10 points:** Verify a module
- **20 points:** Suggest a correction
- **50 points:** First to verify new module
- **100 points:** Verify 100 modules

### Badges

- 🥉 **Bronze Verifier:** 10 verifications
- 🥈 **Silver Verifier:** 50 verifications
- 🥇 **Gold Verifier:** 100 verifications
- 💎 **Diamond Verifier:** 500 verifications

### Unlockable Features

- **Level 1 (100 pts):** Bulk module export
- **Level 2 (500 pts):** API access
- **Level 3 (1,000 pts):** Early access to new features
- **Level 4 (5,000 pts):** Custom module collections

---

## Definition of Done

- [ ] Smart deduplication implemented and tested
- [ ] Community verification system with rewards
- [ ] Module search and browse UI
- [ ] Visual fingerprinting for ML training
- [ ] Analytics dashboard for database stats
- [ ] 100 modules seeded manually (high confidence)
- [ ] Automatic growth via rack analysis
- [ ] 1,000+ modules by end of phase
- [ ] Documentation and API docs

---

**This is how we build the knowledge base that outlives us all! Let's grow! 📈🎸**
