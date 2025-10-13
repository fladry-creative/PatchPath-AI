# GitHub Issue: MCP Server - Universal Modular Synthesis Knowledge Hub

**Priority:** 🌟 STRATEGIC
**Estimated Effort:** 3-4 weeks
**Phase:** 4 - Knowledge Hub
**Dependencies:** Module Database Growth, Vision Pipeline
**Related Docs:** `VISION_FIRST_ARCHITECTURE.md`

---

## Vision Statement

**Transform PatchPath AI into THE universal modular synthesis knowledge source accessible to:**

- 🤖 AI assistants (Claude, GPT-4, Gemini, etc.)
- 💻 Developer tools (IDEs, CLIs, scripts)
- 🎛️ Hardware (Eurorack controllers, sequencers)
- 🎵 DAWs and music software
- 🌐 Community tools and applications

**Through the Model Context Protocol (MCP), PatchPath becomes the knowledge layer for all modular synthesis AI applications.**

---

## The Big Picture: From App to Platform

### Current State

```
PatchPath AI = Standalone web app
↓
Users access via browser only
↓
Knowledge trapped in our database
```

### Future State (MCP Server)

```
PatchPath AI = Knowledge Platform
↓
Accessible via MCP protocol
↓
Integrated everywhere:
  • Claude Desktop → Direct module queries
  • VS Code → Patch generation in code comments
  • Hardware → Live patching suggestions
  • Community tools → Rich module data API
```

---

## What is MCP?

**Model Context Protocol** (Anthropic, November 2024)

Open standard for connecting AI systems to external data sources and tools.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   MCP CLIENT                            │
│  (Claude Desktop, GPT, IDE, Custom App)                 │
└───────────────────────────┬─────────────────────────────┘
                            │
                            │ MCP Protocol (JSON-RPC)
                            │
┌───────────────────────────▼─────────────────────────────┐
│              PATCHPATH MCP SERVER                       │
│                                                         │
│  Tools:                                                 │
│  • searchModules(query)                                 │
│  • generatePatch(rack, intent)                          │
│  • analyzeRack(imageUrl)                                │
│  • getTechnique(name)                                   │
│  • getCompatibleModules(technique)                      │
│                                                         │
│  Resources:                                             │
│  • module://make-noise/maths                            │
│  • technique://fm-synthesis                             │
│  • patch://user123/ambient-drone                        │
└───────────────────────────┬─────────────────────────────┘
                            │
                            │ Direct access
                            │
┌───────────────────────────▼─────────────────────────────┐
│           PATCHPATH KNOWLEDGE BASE                      │
│  • 5,000+ modules                                       │
│  • 100+ techniques                                      │
│  • 10,000+ patches                                      │
│  • Vision analysis                                      │
│  • AI generation                                        │
└─────────────────────────────────────────────────────────┘
```

---

## MCP Tools: What Can AI Assistants Do?

### 1. Module Knowledge Tools

#### `searchModules`

**Purpose:** Find modules by name, manufacturer, or capability

```typescript
// In Claude Desktop chat:
User: "What are some good waveshapers?"

Claude queries MCP: searchModules({ query: "waveshaper" })

Returns:
[
  { name: "Fold 6", manufacturer: "Intellijel", type: "Waveshaper", hp: 6 },
  { name: "Terrain", manufacturer: "Make Noise", type: "Waveshaper", hp: 18 },
  ...
]

Claude: "Here are some excellent waveshapers for your rack..."
```

---

#### `getModuleDetails`

**Purpose:** Get full specs for a specific module

```typescript
// In Claude Desktop:
User: "Tell me about Make Noise Maths"

Claude queries MCP: getModuleDetails({ id: "make-noise_maths" })

Returns:
{
  name: "Maths",
  manufacturer: "Make Noise",
  type: "Function Generator",
  hp: 20,
  inputs: [...],
  outputs: [...],
  capabilities: ["envelope", "lfo", "oscillator", "vca"],
  popularPatches: [...]
}

Claude: "Maths is a versatile function generator with 4 channels..."
```

---

#### `getCompatibleModules`

**Purpose:** Find modules that work well with a given technique

```typescript
// In Claude Desktop:
User: "I want to do FM synthesis, what modules do I need?"

Claude queries MCP: getCompatibleModules({ technique: "fm-synthesis" })

Returns:
{
  required: ["VCO with FM input", "VCO as modulator", "VCA", "Envelope"],
  recommended: ["Attenuverter", "LFO", "Mixer"],
  examples: [
    { name: "Dixie II+", manufacturer: "Intellijel", role: "Carrier" },
    { name: "Piston Honda", manufacturer: "Make Noise", role: "Modulator" },
    ...
  ]
}

Claude: "For FM synthesis, you'll need at least two VCOs..."
```

---

### 2. Rack Analysis Tools

#### `analyzeRack`

**Purpose:** Analyze a rack from ModularGrid URL or image

```typescript
// In Claude Desktop:
User: "Can you analyze this rack? https://modulargrid.net/e/racks/view/1186947"

Claude queries MCP: analyzeRack({ url: "https://..." })

Returns:
{
  modules: [{ name: "Maths", manufacturer: "Make Noise", ... }],
  capabilities: { hasVCO: true, hasVCF: true, ... },
  possibleTechniques: ["subtractive", "fm", "generative"],
  suggestions: ["Add more VCAs for dynamics", "Consider a sequencer"]
}

Claude: "Your rack has great fundamentals. Here's what you can do..."
```

---

#### `suggestMissingModules`

**Purpose:** Identify gaps in a rack's capabilities

```typescript
// In Claude Desktop:
User: "What's missing from my rack?"

Claude queries MCP: suggestMissingModules({ rackId: "user-rack-123" })

Returns:
{
  missing: ["Clock source", "Sequencer", "Effects"],
  priority: "high",
  recommendations: [
    { name: "Pamela's New Workout", reason: "Clock + modulation" },
    { name: "Clouds", reason: "Texture and reverb" },
  ]
}

Claude: "You're missing a clock source, which limits your sequencing options..."
```

---

### 3. Patch Generation Tools

#### `generatePatch`

**Purpose:** Generate a patch for a specific rack and intent

```typescript
// In Claude Desktop:
User: "Create a dark ambient patch for my rack"

Claude queries MCP: generatePatch({
  rackUrl: "https://modulargrid.net/...",
  intent: "dark ambient drone",
  genre: "ambient"
})

Returns:
{
  title: "Infinite Void",
  difficulty: "intermediate",
  connections: [...],
  steps: [...],
  whyThisWorks: "..."
}

Claude: "Here's a dark ambient patch called 'Infinite Void'..."
```

---

#### `generateVariations`

**Purpose:** Create variations of an existing patch

```typescript
// In Claude Desktop:
User: "Give me variations of this patch"

Claude queries MCP: generateVariations({ patchId: "patch-123", count: 3 })

Returns: [
  { title: "Variation A: Brighter", changes: [...] },
  { title: "Variation B: Slower", changes: [...] },
  { title: "Variation C: Chaotic", changes: [...] },
]

Claude: "Here are 3 variations on your patch..."
```

---

### 4. Technique Knowledge Tools

#### `getTechnique`

**Purpose:** Get detailed info about a synthesis technique

```typescript
// In Claude Desktop:
User: "Explain West Coast synthesis"

Claude queries MCP: getTechnique({ name: "west-coast" })

Returns:
{
  name: "West Coast Synthesis",
  description: "...",
  keyModules: ["Complex oscillators", "Waveshapers", "Low-pass gates"],
  pioneers: ["Don Buchla", "Serge Tcherepnin"],
  examples: [...]
}

Claude: "West Coast synthesis emphasizes timbre modulation..."
```

---

#### `searchTechniques`

**Purpose:** Find techniques by genre or capability

```typescript
// In Claude Desktop:
User: "What techniques are good for techno?"

Claude queries MCP: searchTechniques({ genre: "techno" })

Returns: [
  { name: "Subtractive Synthesis", fit: "high" },
  { name: "FM Synthesis", fit: "high" },
  { name: "Generative Sequencing", fit: "medium" },
]

Claude: "For techno, subtractive synthesis is essential..."
```

---

### 5. Community Knowledge Tools

#### `getPopularPatches`

**Purpose:** Get trending/popular patches

```typescript
// In Claude Desktop:
User: "What are people patching these days?"

Claude queries MCP: getPopularPatches({ timeframe: "week" })

Returns: [
  { title: "Acid Bassline", loves: 142, author: "user123" },
  { title: "Generative Ambient", loves: 89, author: "user456" },
  ...
]

Claude: "The most popular patches this week are..."
```

---

#### `getModuleReviews`

**Purpose:** Get community reviews/feedback on modules

```typescript
// In Claude Desktop:
User: "Is the Intellijel Rubicon worth it?"

Claude queries MCP: getModuleReviews({ moduleId: "intellijel_rubicon" })

Returns: [
  { rating: 5, comment: "Best VCO I own", user: "user123" },
  { rating: 4, comment: "Great sound but runs hot", user: "user456" },
  ...
]

Claude: "The Rubicon has a 4.5/5 average rating. Users love..."
```

---

## Technical Implementation

### 1. MCP Server Core

**File:** `mcp-server/index.ts` (NEW)

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { searchModules, getModuleDetails } from './tools/modules';
import { analyzeRack, generatePatch } from './tools/analysis';
import { getTechnique, searchTechniques } from './tools/techniques';
import logger from '@/lib/logger';

/**
 * PatchPath AI MCP Server
 * Universal modular synthesis knowledge source
 */
class PatchPathMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'patchpath-ai',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'searchModules',
          description: 'Search for Eurorack modules by name, manufacturer, or capability',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              manufacturer: { type: 'string', description: 'Filter by manufacturer' },
              type: { type: 'string', description: 'Filter by module type (VCO, VCF, etc.)' },
              limit: { type: 'number', description: 'Max results (default: 20)' },
            },
            required: ['query'],
          },
        },
        {
          name: 'getModuleDetails',
          description: 'Get detailed specifications for a specific module',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Module ID (e.g., make-noise_maths)' },
            },
            required: ['id'],
          },
        },
        {
          name: 'analyzeRack',
          description: 'Analyze a ModularGrid rack from URL or image',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'ModularGrid rack URL or CDN image URL',
              },
            },
            required: ['url'],
          },
        },
        {
          name: 'generatePatch',
          description: 'Generate a modular synth patch for a specific rack and intent',
          inputSchema: {
            type: 'object',
            properties: {
              rackUrl: { type: 'string', description: 'ModularGrid rack URL' },
              intent: { type: 'string', description: 'Patch intent (e.g., "dark ambient drone")' },
              genre: { type: 'string', description: 'Genre (optional)' },
              technique: { type: 'string', description: 'Technique (optional)' },
            },
            required: ['rackUrl', 'intent'],
          },
        },
        {
          name: 'getTechnique',
          description: 'Get detailed information about a synthesis technique',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Technique name (e.g., "fm-synthesis")' },
            },
            required: ['name'],
          },
        },
        {
          name: 'searchTechniques',
          description: 'Search for synthesis techniques by genre or capability',
          inputSchema: {
            type: 'object',
            properties: {
              genre: { type: 'string', description: 'Music genre' },
              capability: { type: 'string', description: 'Required capability' },
            },
          },
        },
        {
          name: 'getCompatibleModules',
          description: 'Find modules compatible with a specific technique',
          inputSchema: {
            type: 'object',
            properties: {
              technique: { type: 'string', description: 'Technique name' },
            },
            required: ['technique'],
          },
        },
        {
          name: 'suggestMissingModules',
          description: 'Identify gaps in a rack and suggest modules',
          inputSchema: {
            type: 'object',
            properties: {
              rackUrl: { type: 'string', description: 'ModularGrid rack URL' },
            },
            required: ['rackUrl'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      logger.info('🔧 MCP tool called', { tool: name, args });

      try {
        switch (name) {
          case 'searchModules':
            return await searchModules(args);

          case 'getModuleDetails':
            return await getModuleDetails(args);

          case 'analyzeRack':
            return await analyzeRack(args);

          case 'generatePatch':
            return await generatePatch(args);

          case 'getTechnique':
            return await getTechnique(args);

          case 'searchTechniques':
            return await searchTechniques(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error('❌ MCP tool error', {
          tool: name,
          error: error instanceof Error ? error.message : 'Unknown',
        });

        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupResourceHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'module://{manufacturer}/{name}',
          name: 'Module by manufacturer and name',
          description: 'Access detailed module information',
          mimeType: 'application/json',
        },
        {
          uri: 'technique://{name}',
          name: 'Synthesis technique',
          description: 'Access synthesis technique information',
          mimeType: 'application/json',
        },
        {
          uri: 'patch://{user}/{id}',
          name: 'User patch',
          description: 'Access saved patch information',
          mimeType: 'application/json',
        },
      ],
    }));
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      logger.error('❌ MCP server error', {
        error: error.message,
        stack: error.stack,
      });
    };

    process.on('SIGINT', async () => {
      logger.info('🛑 MCP server shutting down...');
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.info('🚀 PatchPath MCP Server running');
    logger.info('📡 Listening for MCP requests via stdio');
  }
}

// Start server
const server = new PatchPathMCPServer();
server.run().catch((error) => {
  logger.error('❌ Failed to start MCP server', { error: error.message });
  process.exit(1);
});
```

---

### 2. Claude Desktop Integration

**File:** `claude_desktop_config.json` (User's local machine)

```json
{
  "mcpServers": {
    "patchpath-ai": {
      "command": "node",
      "args": ["/path/to/patchpath-ai/mcp-server/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-...",
        "COSMOS_ENDPOINT": "https://...",
        "COSMOS_KEY": "..."
      }
    }
  }
}
```

**Usage in Claude Desktop:**

```
User: "Search for oscillators from Make Noise"

Claude Desktop automatically queries PatchPath MCP server:
→ searchModules({ query: "oscillator", manufacturer: "Make Noise" })

Returns module list → Claude presents results naturally
```

---

### 3. Standalone MCP Client (for testing)

**File:** `mcp-client/test-client.ts` (NEW)

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Test client for PatchPath MCP server
 */
async function testMCPClient() {
  console.log('🧪 Testing PatchPath MCP Server...\n');

  // Connect to server
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['./mcp-server/index.js'],
  });

  const client = new Client(
    {
      name: 'patchpath-test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);

  // Test 1: Search modules
  console.log('Test 1: Search for "Maths"');
  const searchResult = await client.request(
    {
      method: 'tools/call',
      params: {
        name: 'searchModules',
        arguments: { query: 'maths' },
      },
    },
    {}
  );
  console.log(JSON.stringify(searchResult, null, 2));

  // Test 2: Analyze rack
  console.log('\nTest 2: Analyze demo rack');
  const analyzeResult = await client.request(
    {
      method: 'tools/call',
      params: {
        name: 'analyzeRack',
        arguments: { url: 'https://modulargrid.net/e/racks/view/2383104' },
      },
    },
    {}
  );
  console.log(JSON.stringify(analyzeResult, null, 2));

  await client.close();
  console.log('\n✅ Tests complete!');
}

testMCPClient().catch(console.error);
```

**Run:**

```bash
npx tsx mcp-client/test-client.ts
```

---

## Integration Examples

### Example 1: Claude Desktop + PatchPath

**Scenario:** User wants patch suggestions

```
User in Claude Desktop:
"I have a Make Noise 0-Coast, Maths, and a Disting.
What's a good ambient patch I can make?"

Claude (using PatchPath MCP):
1. Calls searchModules() for each module to verify specs
2. Calls generatePatch() with module list and intent
3. Returns beautiful, formatted patch with step-by-step instructions

User: "Amazing! Can you make it darker?"

Claude:
1. Calls generateVariations() with "darker" parameter
2. Returns modified patch with different routing

✨ Seamless AI-powered patching assistant!
```

---

### Example 2: VS Code Extension

**Scenario:** Developer writing patch documentation

```typescript
// In VS Code with PatchPath MCP extension:

// User types comment:
// "TODO: Add FM patch using Dixie and..."

// VS Code autocompletes via MCP:
// "TODO: Add FM patch using Dixie and another VCO"
//
// Suggested patch:
// 1. Patch Dixie (carrier) to VCA
// 2. Patch VCO2 (modulator) to Dixie FM input
// 3. Patch ADSR to VCA
// 4. Patch keyboard to both VCOs

✨ Intelligent code completion for synthesis!
```

---

### Example 3: Hardware Eurorack Controller

**Scenario:** Physical controller with AI suggestions

```
┌────────────────────────────────────┐
│     EURORACK AI CONTROLLER         │
├────────────────────────────────────┤
│  Current Patch: Ambient Drone      │
│                                    │
│  [Suggest Variation] ← Button      │
│                                    │
│  ↓ Queries PatchPath MCP           │
│                                    │
│  Suggestion: "Try adding LFO to    │
│  filter cutoff for movement"       │
│                                    │
│  [Apply] [Next]                    │
└────────────────────────────────────┘

✨ Live AI patching suggestions on hardware!
```

---

## Deployment

### Option 1: Standalone Server (Local)

```bash
# Install dependencies
npm install @modelcontextprotocol/sdk

# Run server
node mcp-server/index.js
```

### Option 2: Docker Container

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "mcp-server/index.js"]
```

```bash
docker build -t patchpath-mcp .
docker run -p 8080:8080 patchpath-mcp
```

### Option 3: Cloud Deployment (Azure Container Apps)

```bash
# Build and push
az acr build --registry patchpathacr --image patchpath-mcp:latest .

# Deploy
az containerapp create \
  --name patchpath-mcp \
  --resource-group patchpath-rg \
  --image patchpathacr.azurecr.io/patchpath-mcp:latest \
  --target-port 8080
```

---

## Success Metrics

### Technical

- ✅ 10+ MCP tools implemented
- ✅ <100ms average response time
- ✅ 99.5%+ uptime
- ✅ Works with Claude Desktop, VS Code, custom clients

### Adoption

- ✅ 100+ active MCP users by Month 3
- ✅ 10+ third-party integrations by Year 1
- ✅ 1,000+ daily MCP queries
- ✅ Featured in Anthropic's MCP showcase

### Business

- ✅ Positions PatchPath as THE modular synthesis knowledge hub
- ✅ Opens revenue from API/MCP access (future)
- ✅ Creates moat through comprehensive database
- ✅ Enables ecosystem of tools built on PatchPath

---

## Definition of Done

- [ ] MCP server implemented with 10+ tools
- [ ] Claude Desktop integration tested
- [ ] Standalone test client works
- [ ] Documentation and examples
- [ ] Deployed to cloud (accessible 24/7)
- [ ] Performance optimized (<100ms responses)
- [ ] Security: API key auth, rate limiting
- [ ] Community SDK published (TypeScript + Python)
- [ ] Featured in MCP community showcase

---

**This is how we become PLATFORM, not just product. Let's build the future! 🚀🌟**
