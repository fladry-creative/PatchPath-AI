# Claude Desktop Integration: PatchPath MCP Server

**Transform Claude Desktop into THE modular synthesis AI assistant.**

---

## What This Does

When you configure PatchPath's MCP server with Claude Desktop:

1. **Claude can READ your database**: Ask about modules, analyze racks, generate patches
2. **Claude can WRITE to your database**: Add rare modules, verify data, save patches
3. **Knowledge preservation**: Every conversation can contribute to the permanent archive

---

## Quick Setup (5 minutes)

### Step 1: Find Your Claude Desktop Config

**macOS:**

```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**

```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**

```bash
~/.config/Claude/claude_desktop_config.json
```

### Step 2: Add PatchPath MCP Server

Edit `claude_desktop_config.json` and add:

```json
{
  "mcpServers": {
    "patchpath-ai": {
      "command": "npx",
      "args": ["tsx", "/FULL/PATH/TO/PatchPath-AI/mcp-server/index.ts"],
      "env": {
        "ANTHROPIC_API_KEY": "your-claude-api-key",
        "COSMOS_ENDPOINT": "your-cosmos-db-endpoint",
        "COSMOS_KEY": "your-cosmos-db-key",
        "COSMOS_DATABASE": "patchpath-db"
      }
    }
  }
}
```

**IMPORTANT:** Replace `/FULL/PATH/TO/PatchPath-AI` with your actual path!

### Step 3: Restart Claude Desktop

Close and reopen Claude Desktop. You should see "patchpath-ai" in the MCP servers list.

---

## Example Conversations (The Magic)

### Reading Knowledge

```
You: What are some good sync generators for video synthesis?

Claude:
[Uses searchModules tool via MCP]

I found several sync generators in the PatchPath database:
1. LZX Cadet IX - Precision sync generator with H/V outputs
2. Syntonie CB-100 - Classic composite sync
3. LZX Gen3 - Advanced timing reference
...
```

### Writing Knowledge (THE REVOLUTION!)

```
You: Actually, there's also the Syntonie CB-300. It's a rare dual sync
     generator with composite out. Only 15 units were made before
     Syntonie shut down.

Claude:
[Uses contributeModule tool via MCP]

✅ I've added the Syntonie CB-300 to the PatchPath database!

Module Details:
- Name: CB-300
- Manufacturer: Syntonie
- Type: SyncGenerator (video)
- Rarity: very-rare
- Production Status: discontinued
- Production Count: ~15 units

🏆 KNOWLEDGE PRESERVED: This rare/discontinued module is now in
the permanent archive! Other users can now discover it, and it
won't be forgotten even though Syntonie is gone.
```

### Rack Analysis

```
You: Can you analyze this rack? https://modulargrid.net/e/racks/view/2383104

Claude:
[Uses analyzeRack tool via MCP]

I've analyzed your rack! Here's what I found:

Modules Identified: 23
Rack Type: Hybrid (audio + video)
Key Capabilities:
  - Video synthesis ready (sync generator present)
  - 4x VCOs (audio)
  - 2x VCFs (audio)
  - 3x video ramp generators
  - Cross-modulation possible

Suggested Techniques:
- Geometric pattern generation
- Audio-to-video modulation mapping
- Subtractive synthesis (audio)
...
```

### Patch Generation

```
You: Generate an ambient drone patch for that rack

Claude:
[Uses generatePatch tool via MCP]

Here's "Infinite Drift" - an ambient drone patch:

1. Patch VCO1 (sawtooth) → VCF1 input
2. Patch LFO → VCF1 cutoff (slow modulation)
3. Patch EG → VCA
...

[Then optionally saves it]
[Uses contributePatch tool]

✅ Patch saved to community library! Others can now discover and use it.
```

---

## Available MCP Tools

### READ TOOLS (Query Knowledge)

#### `searchModules`

Find modules by name, manufacturer, or type

```
You: Search for waveshaper modules
Claude: → searchModules({ query: "waveshaper" })
```

#### `getModuleDetails`

Get comprehensive specs for a module

```
You: Tell me about Make Noise Maths
Claude: → getModuleDetails({ moduleId: "make-noise_maths" })
```

#### `analyzeRack`

Analyze a ModularGrid rack from URL

```
You: Analyze https://modulargrid.net/e/racks/view/123456
Claude: → analyzeRack({ url: "..." })
```

#### `generatePatch`

Create a patch for a specific rack and intent

```
You: Create a techno bassline for my rack
Claude: → generatePatch({ rackUrl: "...", intent: "techno bassline" })
```

---

### WRITE TOOLS (Contribute Knowledge) 🚀

#### `contributeModule`

Add a new module to the database

```
You: I have this rare DIY module called "Dave's Chaos Generator"
Claude: → contributeModule({
  name: "Chaos Generator",
  manufacturer: "Dave (DIY)",
  type: "Random",
  rarity: "very-rare",
  productionStatus: "diy"
})
```

#### `verifyModule`

Correct existing module data

```
You: Actually, Maths is 20HP not 18HP
Claude: → verifyModule({
  moduleId: "make-noise_maths",
  corrections: { hp: 20 }
})
```

#### `enrichModuleIO`

Add input/output specifications

```
You: The Cadet IX has 3 ramp inputs and 2 ramp outputs
Claude: → enrichModuleIO({
  moduleId: "lzx_cadet-ix",
  inputs: [
    { name: "Ramp In 1", type: "Ramp" },
    { name: "Ramp In 2", type: "Ramp" },
    { name: "Ramp In 3", type: "Ramp" }
  ],
  outputs: [
    { name: "Ramp Out 1", type: "Ramp" },
    { name: "Ramp Out 2", type: "Ramp" }
  ]
})
```

#### `contributePatch`

Save a patch to the community library

```
After generating a great patch...
You: Save this patch for others to use
Claude: → contributePatch({ title: "...", modules: [...], connections: [...] })
```

#### `linkModules`

Identify module relationships

```
You: Maths v1 and Maths v2 are variations of each other
Claude: → linkModules({
  moduleId1: "make-noise_maths-v1",
  moduleId2: "make-noise_maths-v2",
  relationship: "variation"
})
```

---

## The Vision: Why This Matters

### Problem

- Video synthesis companies are dying (Syntonie gone, LZX struggling)
- Rare modules undocumented (DIY builds, limited runs)
- Collector knowledge trapped (you know about modules, but knowledge isn't shared)
- No central archive

### Solution: Two-Way Knowledge Platform

```
User has rare module
    ↓
Talks to Claude Desktop about it
    ↓
Claude: "Should I add this to PatchPath?"
    ↓
User: "Yes!"
    ↓
Claude → MCP → PatchPath database
    ↓
KNOWLEDGE PRESERVED FOREVER
```

**Every conversation becomes a potential contribution to the permanent archive.**

---

## The Future: Physical AI

When Gemini Robotics-ER 1.5 (or similar) can physically manipulate objects:

```
You to robot: "Patch me an ambient drone using that rack"

Robot:
1. → MCP: analyzeRack(camera_feed)
2. → MCP: generatePatch(modules, "ambient drone")
3. → Physical action: Picks up patch cables
4. → Patches the synth
5. "Done! Try adjusting the LFO rate."
```

**You're not just using Claude Desktop. You're building the knowledge layer for the future of physical AI.**

---

## Troubleshooting

### Claude Desktop doesn't show patchpath-ai

1. Check the config file path is correct
2. Ensure full absolute path (not `~/` or relative paths)
3. Restart Claude Desktop
4. Check Claude Desktop logs: `Help → Show Logs`

### MCP server errors

Check the PatchPath logs:

```bash
tail -f /workspaces/PatchPath-AI/logs/combined.log
```

### Environment variables not set

Make sure `.env.local` exists in your PatchPath-AI directory with:

```
ANTHROPIC_API_KEY=...
COSMOS_ENDPOINT=...
COSMOS_KEY=...
COSMOS_DATABASE=patchpath-db
```

---

## Pro Tips

1. **Be specific**: "Search for LZX video sync generators" works better than "find modules"
2. **Contribute openly**: If you mention a rare module, Claude will offer to add it
3. **Verify actively**: Correct wrong data when you notice it
4. **Save great patches**: Help build the community library
5. **Build knowledge graphs**: Link related modules when you discover relationships

---

## Privacy & Ethics

- **Your data**: Local database, you control it
- **Contributions**: Attributed to you (or anonymously if preferred)
- **Community**: All contributions help preserve knowledge
- **Respect**: We don't scrape ModularGrid, we use public CDN images
- **Open**: MCP protocol is open, anyone can use/extend

---

**LET'S PRESERVE THE KNOWLEDGE BEFORE IT'S LOST! 🎸🤖🚀**
