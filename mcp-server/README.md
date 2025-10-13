# PatchPath AI MCP Server

**The Universal Modular Synthesis Knowledge Platform**

Transform any AI assistant into an expert in modular synthesis through the Model Context Protocol.

---

## 🌟 The Vision

PatchPath isn't just a web app - it's **the knowledge layer for all modular synthesis AI.**

### What Makes This Revolutionary

**Traditional approach:**

- Build a web app
- Users visit website
- Knowledge stays trapped

**Our approach:**

- Build an MCP server (this!)
- **ANY** AI can access our knowledge
- **ANY** AI can CONTRIBUTE knowledge
- Knowledge grows automatically through conversations

---

## 🎯 Two-Way Knowledge Platform

### READ Tools: AI Queries Knowledge

- `searchModules` - Find modules
- `getModuleDetails` - Get comprehensive specs
- `analyzeRack` - Identify modules from images
- `generatePatch` - Create patches

### WRITE Tools: AI Contributes Knowledge 🚀

- `contributeModule` - Add rare/new modules
- `verifyModule` - Correct existing data
- `enrichModuleIO` - Add I/O specifications
- `contributePatch` - Save patches to library
- `linkModules` - Build knowledge graph

**This is Wikipedia meets AI meets Eurorack.**

---

## 🚀 Quick Start

### Installation

```bash
# Already installed if you're in PatchPath-AI repo
cd /path/to/PatchPath-AI
npm install  # Includes @modelcontextprotocol/sdk
```

### Run the Server

```bash
# Development (with auto-reload)
npm run mcp:dev

# Production
npm run mcp
```

### Configure Claude Desktop

See [CLAUDE_DESKTOP_SETUP.md](./CLAUDE_DESKTOP_SETUP.md) for detailed instructions.

**Quick version:**

1. Edit `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Add PatchPath MCP server configuration
3. Restart Claude Desktop
4. Start talking to Claude about modular synthesis!

---

## 💡 Usage Examples

### Example 1: Finding Modules

```
User in Claude Desktop:
"What are some good video sync generators?"

Claude:
→ Calls searchModules({ query: "sync generator", type: "SyncGenerator" })
→ Returns list from PatchPath database

"I found these video sync generators:
1. LZX Cadet IX - Precision timing reference
2. Syntonie CB-100 - Composite sync generator
3. LZX Gen3 - Advanced sync with multiple outputs
..."
```

### Example 2: Contributing Knowledge (THE REVOLUTION!)

```
User in Claude Desktop:
"Actually, there's also the Syntonie CB-300. It's a rare dual sync
generator. Only 15 were made before they shut down."

Claude:
→ Calls contributeModule({
    name: "CB-300",
    manufacturer: "Syntonie",
    type: "SyncGenerator",
    rarity: "very-rare",
    productionStatus: "discontinued"
  })

"✅ I've added the Syntonie CB-300 to the database!

🏆 KNOWLEDGE PRESERVED: This rare/discontinued module is now in
the permanent archive!"
```

### Example 3: Rack Analysis + Patch Generation

```
User:
"Analyze my rack and create an ambient drone patch:
https://modulargrid.net/e/racks/view/2383104"

Claude:
→ Calls analyzeRack({ url: "..." })
→ Calls generatePatch({ rackUrl: "...", intent: "ambient drone" })

"Your rack has 23 modules including:
- 4x VCOs
- 2x VCFs
- Video synthesis capability

Here's 'Infinite Drift' - an ambient drone patch:
1. Patch VCO1 → VCF1
2. Patch LFO → VCF1 cutoff
..."
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│         AI CLIENTS (Claude, GPT, Gemini, etc.)      │
│                                                     │
│  • Claude Desktop                                   │
│  • VS Code with AI extensions                       │
│  • Custom applications                              │
│  • Future: Gemini Robotics-ER (physical AI!)       │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ MCP Protocol (JSON-RPC over stdio)
                   │
┌──────────────────▼──────────────────────────────────┐
│            PATCHPATH MCP SERVER (This!)             │
│                                                     │
│  Read Tools:    │  Write Tools:                     │
│  • search       │  • contribute  🚀                  │
│  • getDetails   │  • verify      🚀                  │
│  • analyzeRack  │  • enrich      🚀                  │
│  • generatePatch│  • savePatch   🚀                  │
│                 │  • linkModules 🚀                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Direct database access
                   │
┌──────────────────▼──────────────────────────────────┐
│           PATCHPATH KNOWLEDGE BASE                  │
│                                                     │
│  • 5,000+ modules (growing automatically!)          │
│  • Module specifications (I/O, HP, type)            │
│  • Community patches                                │
│  • Rack analyses                                    │
│  • Module relationships (knowledge graph)           │
│  • Vision analysis results                          │
└─────────────────────────────────────────────────────┘
```

---

## 📚 Tool Reference

### READ TOOLS

#### `searchModules`

**Purpose:** Find modules by name, manufacturer, or capability

**Input:**

```typescript
{
  query: string;           // Required: search query
  manufacturer?: string;   // Optional: filter by manufacturer
  type?: string;          // Optional: filter by type (VCO, VCF, etc.)
  limit?: number;         // Optional: max results (default 20)
}
```

**Returns:** Array of matching modules with details

---

#### `getModuleDetails`

**Purpose:** Get comprehensive information about a specific module

**Input:**

```typescript
{
  moduleId: string; // Module ID or "manufacturer_name" format
}
```

**Returns:** Full module specification including I/O, HP, confidence, etc.

---

#### `analyzeRack`

**Purpose:** Analyze a ModularGrid rack from URL

**Input:**

```typescript
{
  url: string; // ModularGrid rack URL or CDN image URL
}
```

**Returns:** Identified modules, capabilities, techniques, warnings

---

#### `generatePatch`

**Purpose:** Generate a patch for a specific rack and intent

**Input:**

```typescript
{
  rackUrl: string;      // Required: rack to patch
  intent: string;       // Required: what you want (e.g., "ambient drone")
  genre?: string;       // Optional: musical genre
  technique?: string;   // Optional: specific technique to use
}
```

**Returns:** Complete patch with connections, steps, tips

---

### WRITE TOOLS 🚀

#### `contributeModule`

**Purpose:** Add a new module to the database

**Input:**

```typescript
{
  name: string;
  manufacturer: string;
  type: string;
  hp?: number;
  description?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'very-rare' | 'diy';
  productionStatus?: 'current' | 'discontinued' | 'limited' | 'diy';
  source?: string;
}
```

**Returns:** Confirmation with preservation note for rare modules

---

#### `verifyModule`

**Purpose:** Verify or correct existing module data

**Input:**

```typescript
{
  moduleId: string;
  corrections?: {     // Fields to update
    name?: string;
    manufacturer?: string;
    hp?: number;
    // ... any module field
  };
  verificationNote?: string;
}
```

**Returns:** Updated module with confidence boost

---

#### `enrichModuleIO`

**Purpose:** Add input/output specifications

**Input:**

```typescript
{
  moduleId: string;
  inputs?: Array<{
    name: string;
    type: string;  // CV, Audio, Gate, Sync, Ramp, Video, etc.
    description?: string;
  }>;
  outputs?: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
}
```

**Returns:** Confirmation with I/O count

---

#### `contributePatch`

**Purpose:** Save a patch to the community library

**Input:**

```typescript
{
  title: string;
  description: string;
  modules: string[];
  connections: Array<{
    from: string;
    to: string;
    cable: string;
  }>;
  technique?: string;
  genre?: string;
}
```

**Returns:** Saved patch ID and metadata

---

#### `linkModules`

**Purpose:** Identify relationships between modules

**Input:**

```typescript
{
  moduleId1: string;
  moduleId2: string;
  relationship: 'variation' | 'successor' | 'alternative' | 'similar' | 'complement';
  note?: string;
}
```

**Returns:** Confirmation of relationship recorded

---

## 🔮 The Future: Gemini Robotics Integration

**Gemini Robotics-ER 1.5** (available now in preview) can:

- Reason about the physical world
- Create multi-step plans
- **Call MCP servers** (like ours!)
- Control robots to manipulate physical objects

**The Vision:**

```
You: "Robot, patch me an ambient drone"

Gemini Robotics:
1. → MCP: analyzeRack(camera_image)
2. → MCP: generatePatch(modules, "ambient drone")
3. → Physical actions:
   - Pick up patch cable
   - Connect VCO → VCF
   - Connect LFO → VCF cutoff
   - Connect EG → VCA
4. "Done! Your ambient drone is ready."
```

**We're building the knowledge layer for the future of physical AI.**

---

## 🛠️ Development

### Project Structure

```
mcp-server/
├── index.ts                    # Main MCP server
├── tools/
│   ├── read-tools.ts          # READ tools (query knowledge)
│   └── write-tools.ts         # WRITE tools (contribute knowledge) 🚀
├── README.md                   # This file
└── CLAUDE_DESKTOP_SETUP.md    # Setup guide
```

### Adding New Tools

1. **Define tool schema** in `index.ts` → `setupToolHandlers()`
2. **Implement handler** in `tools/read-tools.ts` or `tools/write-tools.ts`
3. **Add to switch statement** in `index.ts` → `CallToolRequestSchema` handler
4. **Test with Claude Desktop** or test client

---

## 🧪 Testing

### Manual Testing with Claude Desktop

1. Configure Claude Desktop (see CLAUDE_DESKTOP_SETUP.md)
2. Start conversation
3. Ask questions that trigger tools
4. Verify responses

### Automated Testing (TODO)

```bash
# Future: Create test client
npm run test:mcp
```

---

## 📊 Metrics & Monitoring

### Logs

```bash
# View real-time logs
tail -f logs/combined.log

# View errors only
tail -f logs/error.log

# Search for specific tool
grep "searchModules" logs/combined.log
```

### Database Growth

Check how the knowledge base grows through MCP contributions:

```bash
# Future: Add analytics endpoint
curl localhost:3000/api/modules/stats
```

---

## 🌍 Deployment

### Local Development

```bash
npm run mcp:dev
```

### Production Server

```bash
# Option 1: PM2 (process manager)
pm2 start mcp-server/index.ts --name patchpath-mcp --interpreter npx -- tsx

# Option 2: Docker
docker build -t patchpath-mcp -f Dockerfile.mcp .
docker run -d patchpath-mcp

# Option 3: Systemd service
sudo systemctl start patchpath-mcp
```

---

## 🤝 Contributing

### Knowledge Contributions (via MCP)

**You don't need to code!** Just use Claude Desktop:

- Mention rare modules → Claude adds them
- Correct wrong data → Claude updates it
- Describe patches → Claude saves them

### Code Contributions

1. Fork the repo
2. Add new tools or improve existing ones
3. Submit PR
4. Help build the future!

---

## 📜 License

Part of PatchPath AI - see main LICENSE

---

## 🙏 Credits

- **MCP Protocol:** Anthropic (model-context-protocol.io)
- **Modular Synthesis Community:** Knowledge providers
- **You:** For using and contributing!

---

**LET'S BUILD THE KNOWLEDGE LAYER FOR THE FUTURE OF SYNTHESIS AI! 🎸🤖🚀**
