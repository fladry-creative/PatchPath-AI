# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PatchPath AI** is an AI-powered modular synthesizer companion that analyzes Eurorack racks and generates creative patch suggestions. It combines web scraping (ModularGrid), AI patch generation (Claude Sonnet 4.5), and vision analysis to help modular synth enthusiasts discover new patching possibilities.

**28 Years in the Making** (1997-2025): From Nashville warehouse raves to AI-powered synthesis. PatchPath AI is part of the **Fladry Creative** ecosystem, built by **The Fladry Creative Group** (fladrycreative.co) × **Trash Team** (trashteam.tv). What started as The Ghetto Headliners throwing legendary parties in 1999 evolved through Grammy-winning engineering, 200+ DIY modules sold, and cross-country studio collaboration. Launched July 7, 2025 - 18 years to the day after the founders' wedding. Read the full story in `/app/about/page.tsx`.

**NEW (October 2025)**: Comprehensive video synthesis support for LZX Industries and Syntonie modules! See [VIDEO_SYNTHESIS.md](docs/VIDEO_SYNTHESIS.md)

**Tech Stack**: Next.js 15 (App Router), React 19, TypeScript, Clerk Auth, Anthropic Claude API, Google Gemini Vision, Azure Cosmos DB, Puppeteer scraping, Tailwind CSS v4

## Development Commands

### Core Development

```bash
npm run dev              # Start Next.js dev server with Turbopack
npm run build            # Production build with Turbopack
npm start                # Start production server
npm run lint             # Run ESLint
```

### Testing

```bash
npm test                 # Run Jest unit tests
npm run test:watch       # Jest in watch mode
npm run test:coverage    # Generate coverage report (70% threshold)
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Playwright interactive UI mode
npm run test:e2e:headed  # Playwright with browser visible
npm run test:e2e:debug   # Debug Playwright tests
```

### Single Test Execution

```bash
# Unit tests
npm test -- path/to/test.test.ts
npm test -- --testNamePattern="test name pattern"

# E2E tests
npx playwright test path/to/test.spec.ts
npx playwright test --grep "test name pattern"
```

## Architecture

### Core Data Flow

1. **Rack Ingestion** → User provides ModularGrid URL
2. **Scraping** → Puppeteer extracts module data from ModularGrid page
3. **Analysis** → Rack analyzer determines capabilities (VCO/VCF/VCA presence, possible techniques)
4. **Patch Generation** → Claude Sonnet 4.5 generates creative patches with cable routing
5. **Vision Enhancement** → Optional: Gemini analyzes rack images to enrich module metadata

### Key Type Definitions

**Module** (`types/module.ts`): Individual Eurorack modules with inputs/outputs, HP size, power draw
**Rack** (`types/rack.ts`): Complete rack configuration with capabilities and analysis
**Patch** (`types/patch.ts`): Cable connections, parameter suggestions, patching order

### Critical Components

**lib/scraper/modulargrid.ts**

- Puppeteer-based scraper for ModularGrid rack pages
- Extracts embedded JSON or falls back to DOM parsing
- Auto-detects module types from names/descriptions using pattern matching
- Returns `ParsedRack` with organized rows and modules

**lib/ai/claude.ts**

- Claude Sonnet 4.5 integration for patch generation
- `generatePatch()`: Creates single patch from rack + user intent
- `generatePatchVariations()`: Generates 3-5 creative variations
- Enforces strict JSON output format with connections, steps, tips
- Educational focus: includes "whyThisWorks" explanations

**lib/scraper/analyzer.ts**

- `analyzeRackCapabilities()`: Detects VCO/VCF/VCA/LFO/Envelope presence
- `analyzeRack()`: Identifies missing fundamentals, warns about power/HP
- `generateRackSummary()`: Human-readable capability summary
- Determines possible techniques (FM, subtractive, generative, etc.)

**lib/vision/rack-analyzer.ts**

- Claude Vision (Sonnet 4.5) analyzes rack photos
- Identifies modules by visual appearance
- Returns module positions, confidence scores, layout analysis
- Used to supplement/verify ModularGrid scraping

### API Routes Structure

```
app/api/
├── racks/analyze/         → POST: Analyze ModularGrid URL (saves to DB)
├── racks/random/          → GET: Random rack from cache/scrape pool
├── patches/generate/      → POST: Generate patch from rack + intent (saves to DB)
├── vision/analyze-rack/   → POST: Vision analysis of rack image
└── test-*/                → Development testing endpoints
```

### Module Type Detection

The scraper auto-classifies modules using pattern matching:

- VCO: oscillator, vco
- VCF: filter, vcf
- VCA: amplifier, vca
- EG: envelope, eg, adsr
- Sequencer, LFO, Mixer, Effect (delay/reverb), MIDI, Clock, Logic, Random, Video, Utility, Other

This classification drives the capability analysis that determines what patch techniques are possible.

## Environment Variables

Required `.env.local` keys (see `.env.example`):

- `ANTHROPIC_API_KEY`: Claude API key (Sonnet 4.5 for patch generation + vision)
- `GEMINI_API_KEY`: Google Gemini for vision analysis (optional enhancement)
- `NEXT_PUBLIC_CLERK_*`: Clerk authentication keys
- `COSMOS_*`: Azure Cosmos DB connection (free tier supported)

## Testing Strategy

### Unit Tests (Jest)

- **Location**: `__tests__/` directory with 27 test suites
- **Coverage**: 302 passing tests achieving 70%+ coverage on core business logic
- **Test Files**:
  - `__tests__/lib/` - 12 library test files (utilities, AI, scraper, database, logger)
  - `__tests__/api/` - 6 API route integration tests
  - `__tests__/components/` - 3 UI component tests (101 tests, 100% passing)
- **Uses**: `@testing-library/react` for components, real Cosmos DB and Anthropic API for integration tests
- **Coverage threshold**: 70% enforced on branches/functions/lines/statements

### E2E Tests (Playwright)

- **Location**: `e2e/` directory with 4 test suites (38 total tests)
- **Suites**:
  - `home.spec.ts` - Landing page and navigation
  - `auth.spec.ts` - Authentication flow and protected routes
  - `accessibility.spec.ts` - Comprehensive a11y checks
  - `patch-generation.spec.ts` - Complete patch generation user journey (23 tests)
- **Tests**: Complete user flows including rack analysis, patch generation, variations, error handling
- **Auto-starts**: Dev server if not running
- **CI**: Runs with 2 retries, single worker
- **Runtime**: ~15-20 minutes for full suite

### Demo Rack for Testing

**Primary Demo Rack**:

```
https://modulargrid.net/e/racks/view/2383104
```

**Random Rack Feature**: Click "🎲 Try Random Rack" to test with variety of systems (90% cached, 10% fresh scrapes)

## AI Integration Details

### Claude Patch Generation Process

1. **System Prompt**: Expert synthesizer designer role with strict JSON output format
2. **User Prompt**: Includes full module list, capabilities, user intent, optional technique/genre
3. **Response Parsing**: Handles ```json code blocks or raw JSON
4. **Validation**: Ensures only modules from user's rack are referenced
5. **Output**: Complete `Patch` object with connections, order, tips, educational explanations

### Vision Analysis Enhancement

When users upload rack photos:

1. Claude Vision identifies modules from visual appearance
2. Extracts approximate positions (x/y coordinates, width in HP)
3. Returns confidence scores for each identification
4. Can be used to cross-reference ModularGrid data or analyze custom racks

## Path Aliasing

TypeScript paths use `@/` prefix for root imports:

```typescript
import { generatePatch } from '@/lib/ai/claude';
import { type Patch } from '@/types/patch';
```

## Important Notes

- **Scraping Ethics**: ModularGrid scraping is for personal use. Consider rate limiting and caching.
- **Model Selection**: Claude Sonnet 4.5 is used for quality/price balance ($3 input / $15 output per 1M tokens)
- **Authentication**: All `/dashboard/*` routes protected by Clerk middleware
- **Database**: Cosmos DB uses containers: `racks`, `patches`, `modules`, `enrichments`, `users` (all data persists automatically)
- **Container Environment**: Devcontainer pre-configured with Azure CLI, GitHub CLI, Docker-in-Docker

## CI/CD

GitHub Actions workflows (`.github/workflows/`):

- `ci-cd.yml`: Main CI/CD pipeline with Azure Container Apps deployment
- `pr-check.yml`: Lint + test on pull requests
- `gemini-code-review.yml`: AI-powered code review with Gemini
- `deploy-manual.yml`: Manual deployment trigger

Build and deployment documentation: See `CI-CD.md` and `DOCKER.md`

## Database Services

### Patch Persistence (`lib/database/patch-service.ts`)

**CRUD Operations**:

- `savePatch()` - Save/update patch with automatic userId partitioning
- `getPatch()` - Retrieve single patch by ID
- `listUserPatches()` - Get all user patches with pagination
- `updatePatch()` - Update patch fields
- `deletePatch()` - Soft or hard delete
- `toggleFavorite()` - Mark patch as saved/favorite
- `searchPatches()` - Full-text search by title/description/techniques
- `filterPatchesByRack()` - Get all patches for a specific rack
- `updatePatchRating()` - User ratings (loved/meh/disaster)
- `getPatchStatistics()` - Usage analytics

**All patches automatically save to Cosmos DB on generation with graceful degradation**

### Rack Caching (`lib/database/rack-service.ts`)

**Cache Operations**:

- `saveRack()` - Cache rack data with 30-day expiration
- `getRack()` - Retrieve by ID or URL
- `listRecentRacks()` - Get popular/recent racks
- `incrementUseCount()` - Track rack usage
- `getRackStatistics()` - Cache analytics

**Racks automatically cache on analysis/random selection for performance**

### Random Rack Feature (`lib/scraper/random-rack.ts`)

**Intelligent Selection**:

- 90% of requests use cached racks (<100ms response time)
- 10% scrape new racks for freshness (respects 5-second rate limit)
- Weighted random selection (popular racks more likely)
- 15 curated demo racks for fallback
- Automatic database growth through user testing

**API Endpoint**: `GET /api/racks/random`

## Known Limitations

1. **Module I/O Detection**: Scraper doesn't parse individual inputs/outputs (ModularGrid doesn't expose structured I/O data in HTML)
2. **Vision Accuracy**: Module identification from images depends on lighting/angle quality
3. **Patch Validation**: No runtime validation that suggested connections are physically possible (relies on Claude's understanding)
4. **ModularGrid API**: No official API available; relies on respectful page scraping with rate limiting

## Development Workflow

When adding new features:

1. **Define Types First**: Add to `types/` if introducing new data structures
2. **Create API Route**: Add to `app/api/` for backend logic
3. **Build UI Components**: Next.js App Router pages in `app/`
4. **Test**: Add unit tests in `__tests__/`, E2E in `e2e/`
5. **Run Linting**: Pre-commit hooks auto-fix with ESLint + Prettier

## Logging & Observability

### Winston Structured Logging (`lib/logger.ts`)

**All console.log replaced with Winston structured logging**:

- `logger.info()` - General information (API calls, database operations)
- `logger.warn()` - Warnings and deprecations
- `logger.error()` - Errors with stack traces
- `logger.debug()` - Detailed debugging information

**Emoji Prefixes**:

- 🕷️ Scraper operations
- 🤖 AI operations
- 🎸 Patch operations
- 📊 Metrics and analytics
- 🔍 Vision operations

**Production**: Logs to `logs/error.log` and `logs/combined.log`

### Debugging Tips

- All API routes use Winston structured logging with contextual metadata
- Test scraper independently: `app/api/test-scraper/route.ts`
- Test patch generation: `app/api/test-patch-generation/route.ts`
- Vision analysis test: `app/api/vision/analyze-rack/route.ts`
- Database integration test: `npx tsx scripts/test-database-services.ts`

## Module Enrichment

The system has two enrichment strategies:

- **enrichment.ts**: Basic module data enhancement
- **enrichment-v2.ts**: Advanced enrichment with better metadata

Both use the module service (`lib/database/module-service.ts`) to augment scraped data with additional details from ModularGrid's module database.
