# Issue #1: Enhanced Chat Backend - AI-Native Intent Detection

**Parent:** AI-Native Chat Paradigm Shift
**Priority:** P0 - Critical
**Type:** Enhancement + Refactor
**Phase:** 1 of 4
**Estimated Effort:** 3-5 days
**Dependencies:** None (starting point)

---

## 🎯 Objective

Replace legacy keyword-matching and form-based logic with intelligent, AI-native intent detection that allows Claude Sonnet 4.5 to truly understand and respond to user needs without manual triggers.

---

## 📋 Current State (The Problem)

**Location:** `app/api/chat/patches/route.ts:90-99`

```typescript
// Current broken implementation
const shouldGeneratePatch =
  lastUserMessage.role === 'user' &&
  rackUrl &&
  (lastUserMessage.content.toLowerCase().includes('generate') ||
    lastUserMessage.content.toLowerCase().includes('create') ||
    lastUserMessage.content.toLowerCase().includes('make') ||
    lastUserMessage.content.toLowerCase().includes('build'));
```

**Problems:**

1. Only checks USER messages (ignores AI's decisions)
2. Requires magic keywords ("generate", "create", "make", "build")
3. System prompt tells AI to use `[GENERATE_PATCH]` marker, but it's never parsed
4. `rackUrl` must be pre-provided (no URL extraction from conversation)
5. No session state - every message is stateless
6. No fallback for invalid/gibberish input

**Result:** AI says it will generate patches, but nothing happens unless user types magic words.

---

## 🎯 Desired State (The Solution)

### **AI-Native Flow:**

```
User: "https://modulargrid.net/e/racks/view/2383104"
    ↓
AI: [Detects URL, scrapes immediately]
    "Whoa! Maths + Morphagene + Three Sisters?
     I'm seeing 3 killer patches:
     1. 🌊 Ambient drone
     2. 🎵 Melodic generative
     3. 🔊 Rhythmic percussion
     What vibe?"
    ↓
User: "melodic"
    ↓
AI: [Generates patch without user typing "generate"]
    [Shows PatchCard]
    "Dark Melodic Generative - how's this?"
```

### **Edge Cases Handled:**

```
User: "DLXJFLDJLD"
AI: "Cool vibes bro 😂 Let me pick a random rack..."
    [Generates patch from random demo rack]

User: "make it darker"
AI: [Refines existing patch - covered in Issue #2]

User: ""
AI: "Want me to surprise you with a random rack?"
```

---

## ✅ Acceptance Criteria

### 1. Intent Detection

- [ ] AI determines action from conversation context (no keyword matching)
- [ ] Supports: rack analysis, patch generation, refinement, save, random rack
- [ ] Works with natural language ("I want something dark" = generation intent)
- [ ] Handles gibberish gracefully (fallback to random rack)

### 2. Smart URL Extraction

- [ ] Detects ModularGrid URLs in any message (user or AI)
- [ ] Regex pattern: `https?://(?:www\.)?modulargrid\.net/e/racks/view/\d+`
- [ ] Auto-scrapes when URL detected (no submit button)
- [ ] Stores in session state for subsequent messages

### 3. Session State Management

- [ ] Maintains current rack data across conversation
- [ ] Tracks current patch (if any) for refinement
- [ ] Preserves conversation history for context
- [ ] User ID association for database saves

### 4. Proactive Analysis

- [ ] On rack URL detection → immediate scrape + analysis
- [ ] AI suggests 3-5 patch concepts before user asks
- [ ] Demonstrates understanding: "Your Maths can..."
- [ ] Streaming updates during scraping (not silent wait)

### 5. Random Rack Fallback

- [ ] Triggered by: gibberish, invalid URL, explicit request, empty input
- [ ] Uses existing `/api/racks/random` endpoint
- [ ] AI responds with humor/personality
- [ ] Seamlessly continues to patch generation

### 6. Error Handling

- [ ] No error messages shown to user
- [ ] All errors → intelligent fallbacks
- [ ] Logged server-side for debugging
- [ ] UX remains smooth even during failures

---

## 🏗️ Technical Specifications

### **New Session State Interface:**

```typescript
// lib/chat/session-state.ts (NEW FILE)
export interface ChatSession {
  sessionId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;

  // Rack context
  rackUrl?: string;
  rackData?: ParsedRack;
  capabilities?: RackCapabilities;
  analysis?: RackAnalysis;

  // Patch context
  currentPatch?: Patch;
  patchHistory: Patch[]; // For undo/variations

  // Conversation
  messages: ChatMessage[];
}

// Store in memory (Redis in production)
const sessions = new Map<string, ChatSession>();
```

### **Intent Detection Logic:**

```typescript
// lib/chat/intent-detector.ts (NEW FILE)
export enum Intent {
  ANALYZE_RACK = 'analyze_rack',
  GENERATE_PATCH = 'generate_patch',
  REFINE_PATCH = 'refine_patch', // Issue #2
  SAVE_PATCH = 'save_patch', // Issue #2
  RANDOM_RACK = 'random_rack',
  HELP = 'help',
  UNKNOWN = 'unknown',
}

export async function detectIntent(message: string, session: ChatSession): Promise<Intent> {
  // Use Claude to classify intent, not keyword matching
  // Consider conversation context
  // Examples:
  // - "make it darker" with existing patch → REFINE_PATCH
  // - "save this" with existing patch → SAVE_PATCH
  // - URL in message → ANALYZE_RACK
  // - gibberish/empty → RANDOM_RACK
}
```

### **URL Extraction:**

```typescript
// lib/chat/url-extractor.ts (NEW FILE)
export function extractModularGridUrl(text: string): string | null {
  const regex = /https?:\/\/(?:www\.)?modulargrid\.net\/e\/racks\/view\/\d+/i;
  const match = text.match(regex);
  return match ? match[0] : null;
}

export function isLikelyGibberish(text: string): boolean {
  // Heuristics:
  // - No spaces + random caps = gibberish
  // - All consonants
  // - < 3 characters
  // - Known patterns like keyboard mashing
  return /^[A-Z]{8,}$/i.test(text) || text.length < 3;
}
```

### **Updated Chat Route:**

```typescript
// app/api/chat/patches/route.ts (REFACTORED)
export async function POST(request: NextRequest) {
  // 1. Get or create session
  const session = await getOrCreateSession(userId, sessionId);

  // 2. Extract ModularGrid URL (if present)
  const urlInMessage = extractModularGridUrl(lastMessage.content);
  if (urlInMessage && urlInMessage !== session.rackUrl) {
    // New rack detected!
    await handleRackAnalysis(urlInMessage, session, controller);
  }

  // 3. Detect intent (AI-powered)
  const intent = await detectIntent(lastMessage.content, session);

  // 4. Route based on intent
  switch (intent) {
    case Intent.ANALYZE_RACK:
      await handleRackAnalysis(session.rackUrl, session, controller);
      break;
    case Intent.GENERATE_PATCH:
      await handlePatchGeneration(session, controller);
      break;
    case Intent.RANDOM_RACK:
      await handleRandomRack(session, controller);
      break;
    // ... other intents
  }

  // 5. Stream conversational response
  await streamConversationalResponse(session, controller);
}
```

### **Proactive Suggestions:**

```typescript
// lib/chat/suggestions.ts (NEW FILE)
export async function generatePatchSuggestions(
  rackData: ParsedRack,
  capabilities: RackCapabilities
): Promise<string[]> {
  // Use Claude to generate 3-5 creative patch concepts
  // Based on modules present, their connections, popular techniques
  // Examples:
  // - "🌊 Textured ambient drone (Morphagene looping + delay)"
  // - "🎵 Melodic generative (Maths → quantizer)"
  // - "🔊 Rhythmic percussion (trigger bursts)"

  return ['Ambient drone with looping', 'Melodic generative sequencing', 'Rhythmic percussion'];
}
```

---

## 📊 Testing Requirements

### **Unit Tests:**

- [ ] `url-extractor.test.ts`: URL detection, gibberish detection
- [ ] `intent-detector.test.ts`: Intent classification accuracy
- [ ] `session-state.test.ts`: Session CRUD operations

### **Integration Tests:**

- [ ] Chat route handles URL extraction correctly
- [ ] Session state persists across messages
- [ ] Random rack fallback works
- [ ] Scraping triggers automatically

### **E2E Tests:**

- [ ] User pastes URL → sees analysis within 5 seconds
- [ ] User sends gibberish → gets random rack
- [ ] User chats naturally → patch generated without keywords
- [ ] Session maintains context across 10+ messages

---

## 🔗 Dependencies & Related Work

### **Depends On:**

- None (this is Phase 1 - foundational)

### **Enables:**

- Issue #2: Conversational Iteration (needs session state)
- Issue #3: Form Deprecation (chat must work first)
- Issue #4: Database Growth (scraping on every URL)

### **Files Modified:**

- `app/api/chat/patches/route.ts` - Complete refactor
- `lib/scraper/modulargrid.ts` - May need streaming updates

### **Files Created:**

- `lib/chat/session-state.ts` - Session management
- `lib/chat/intent-detector.ts` - AI-powered intent classification
- `lib/chat/url-extractor.ts` - URL/gibberish detection
- `lib/chat/suggestions.ts` - Proactive patch ideas
- `__tests__/lib/chat/` - Test suite

---

## 📈 Success Metrics

### **Performance:**

- [ ] Time from URL paste to analysis: < 5 seconds
- [ ] Intent detection accuracy: > 90%
- [ ] Session state lookup: < 50ms

### **User Experience:**

- [ ] 0 "not sure what you mean" responses
- [ ] 100% of valid URLs trigger analysis
- [ ] 100% of gibberish gets graceful fallback

### **Code Quality:**

- [ ] Remove all keyword matching (`.includes('generate')`)
- [ ] Remove `[GENERATE_PATCH]` marker system
- [ ] 80%+ test coverage on new code

---

## 🚀 Implementation Checklist

### **Day 1-2: Foundation**

- [ ] Create session state management system
- [ ] Implement URL extraction with regex
- [ ] Add gibberish detection heuristics
- [ ] Set up intent detection (simple rules first, AI later)

### **Day 2-3: Chat Route Refactor**

- [ ] Refactor `POST /api/chat/patches` to use sessions
- [ ] Add automatic URL detection + scraping
- [ ] Implement random rack fallback
- [ ] Add proactive suggestion generation

### **Day 3-4: AI Intent Detection**

- [ ] Build Claude-powered intent classifier
- [ ] Train/test with example conversations
- [ ] Integrate into chat route
- [ ] Replace all keyword matching

### **Day 4-5: Testing & Polish**

- [ ] Write unit tests for all new utilities
- [ ] Integration tests for chat route
- [ ] E2E tests for user flows
- [ ] Performance optimization

---

## 💬 Technical Considerations

### **Session Storage:**

- **Option A:** In-memory Map (simple, loses state on restart)
- **Option B:** Redis (scalable, persistent, adds dependency)
- **Option C:** Cosmos DB (already have it, but slower)
- **Recommendation:** Start with in-memory, migrate to Redis for production

### **Intent Detection Approaches:**

1. **Rule-based** (fast, brittle): Check for keywords + context
2. **AI-powered** (smart, costly): Claude classifies intent
3. **Hybrid** (best?): Rules for obvious cases, AI for ambiguous

### **Cost Management:**

- Each intent classification = 1 Claude API call
- Consider caching common intents
- Use cheaper model for classification (Haiku?) if needed

### **Rate Limiting:**

- ModularGrid scraping: 5-second delay (already implemented)
- Claude API: Tier-based limits
- Session creation: Rate limit by IP/user

---

## 🎭 User Stories

### **Story 1: The URL Paster**

```
As a user,
I want to paste my ModularGrid URL and immediately see analysis,
So that I don't have to click submit buttons or wait.
```

**Acceptance:**

- Paste URL → AI responds in < 5 seconds
- AI shows module count, key modules, suggestions
- No form submission required

### **Story 2: The Gibberish Artist**

```
As a chaotic user,
I want to mash my keyboard and still get something useful,
So that I can explore without overthinking.
```

**Acceptance:**

- Gibberish → AI picks random rack with humor
- Invalid URL → Fallback to random rack
- Empty message → AI prompts for action

### **Story 3: The Natural Chatter**

```
As a conversational user,
I want to describe what I want naturally,
So that I don't have to memorize magic keywords.
```

**Acceptance:**

- "I want something dark" → Patch generation starts
- "show me ambient vibes" → Relevant suggestions
- "what can I make?" → Proactive ideas

---

## 📝 Open Questions

1. **Session Lifetime:** How long should sessions persist? 1 hour? 24 hours?
2. **Multiple Racks:** Should sessions support analyzing multiple racks? Or one rack per session?
3. **Intent Confidence:** What if AI is unsure of intent? Ask for clarification?
4. **Anonymous Users:** Do we allow chat without auth? (Currently requires Clerk login)

---

## 🔍 Testing Scenarios

### **Happy Path:**

1. User pastes `https://modulargrid.net/e/racks/view/2383104`
2. AI scrapes in < 5 seconds
3. AI responds with "Found 42 modules..." + 3 suggestions
4. User says "melodic"
5. AI generates patch (covered in Issue #2)

### **Gibberish Path:**

1. User types `DLXJFLDJLD`
2. AI detects gibberish
3. AI responds with humor + random rack
4. AI generates patch from random rack

### **Invalid URL Path:**

1. User pastes `imgur.com/my-cat.jpg`
2. AI detects non-ModularGrid URL
3. AI asks for correct URL or offers random rack
4. User says "random"
5. AI picks random rack

### **Empty Input Path:**

1. User sends empty message
2. AI prompts: "Want me to pick a random rack?"
3. User says "yes"
4. AI picks random rack

---

## 🎸 Why This Matters

This issue is the **foundation** of the AI-native vision. Without intelligent intent detection and session state:

- Issue #2 (iteration) can't work (no context)
- Issue #3 (form removal) is risky (chat must be solid)
- Issue #4 (database growth) is limited (no auto-scraping)

**This is where we stop coding like it's 1997 and embrace 2025 AI-native design.**

---

**Ready to build:** YES ✅
**Blocks other work:** NO (parallel with Issue #2 if needed)
**Estimated completion:** Week 1 of AI-Native Paradigm Shift
