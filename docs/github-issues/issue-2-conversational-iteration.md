# Issue #2: Conversational Patch Iteration System

**Parent:** AI-Native Chat Paradigm Shift
**Priority:** P0 - Critical
**Type:** Feature + Enhancement
**Phase:** 2 of 4
**Estimated Effort:** 4-6 days
**Dependencies:** Issue #1 (session state required)

---

## 🎯 Objective

Enable true conversational patch refinement where users can iteratively improve patches through natural language feedback without starting over. Transform vague feedback ("darker", "more reverb") into technical parameter changes.

---

## 📋 Current State (The Problem)

**Current Behavior:**

- User generates patch → gets single result
- Want to change it? Must regenerate from scratch
- No memory of previous patches
- No understanding of refinement requests
- Each generation is independent (no iteration)

**What Users Want To Say:**

- "Make it darker"
- "More reverb"
- "Faster tempo"
- "Less aggressive"
- "Add some delay"
- "Remove that connection to the VCA"

**What Actually Happens:**
Nothing. The system doesn't understand these as commands.

---

## 🎯 Desired State (The Solution)

### **Iterative Refinement Flow:**

```
AI: [Generates initial patch]
    "Dark Melodic Generative"
    [Shows PatchCard]
    "How's this?"
    ↓
User: "more reverb"
    ↓
AI: [Understands: increase reverb send/feedback]
    [Updates patch, maintains cable routing]
    "Increased reverb send to 80%, feedback to 60%"
    [Shows updated PatchCard]
    "Better?"
    ↓
User: "perfect, save it"
    ↓
AI: [Detects save intent]
    "Saved as 'Dark Melodic Generative (Reverb Heavy)' ✅
     Want another variation or start fresh?"
```

### **Natural Language Understanding:**

| User Says      | AI Understands                    | Technical Changes                       |
| -------------- | --------------------------------- | --------------------------------------- |
| "darker"       | Reduce brightness, add distortion | Lower filter cutoff, add VCA saturation |
| "brighter"     | Increase harmonic content         | Raise filter cutoff, add overtones      |
| "more reverb"  | Increase reverb amount            | Boost reverb send/feedback/decay        |
| "faster"       | Increase tempo/speed              | Adjust clock rate, envelope times       |
| "slower"       | Decrease tempo/speed              | Decrease clock rate, longer envelopes   |
| "add delay"    | Include delay in patch            | Add delay module to signal path         |
| "remove delay" | Exclude delay                     | Remove delay connections                |
| "louder"       | Increase volume                   | Boost VCA levels, mixer channels        |
| "softer"       | Decrease volume                   | Reduce VCA levels                       |

---

## ✅ Acceptance Criteria

### 1. Patch Refinement Engine

- [ ] Maintains current patch in session state
- [ ] Parses natural language feedback
- [ ] Maps feedback → technical parameter changes
- [ ] Updates patch without breaking valid connections
- [ ] Preserves user's intent from original generation

### 2. Natural Language Feedback Parser

- [ ] Understands 20+ common refinement requests
- [ ] Handles vague feedback ("darker", "more aggressive")
- [ ] Handles specific feedback ("increase reverb decay to 5 seconds")
- [ ] Contextual understanding (knows which modules are in use)
- [ ] Graceful handling of impossible requests ("add reverb" when no reverb module)

### 3. Live Patch Updates

- [ ] PatchCard updates smoothly (no page reload)
- [ ] Shows what changed ("Increased reverb send to 80%")
- [ ] Maintains conversation flow
- [ ] Option to undo (revert to previous version)

### 4. Save Intent Detection

- [ ] Detects: "save this", "I like it", "perfect", "save", "keep this"
- [ ] Intelligent naming based on conversation
- [ ] Tags with techniques, modules, mood
- [ ] Saves to user's Cookbook
- [ ] Confirmation message with save location

### 5. Variation Requests

- [ ] "Try another variation" → generates new patch (keeps current)
- [ ] "Start fresh" → clears session, new patch
- [ ] "Go back" → reverts to previous version
- [ ] Maintains history of last 5 patches per session

### 6. Impossible Request Handling

- [ ] "add reverb" with no reverb module → suggests modules to add
- [ ] Conflicting requests → AI asks for clarification
- [ ] Nonsensical requests → AI rephrases understanding, confirms

---

## 🏗️ Technical Specifications

### **Patch Refinement System:**

```typescript
// lib/chat/patch-refinement.ts (NEW FILE)

export interface RefinementRequest {
  type: 'modify' | 'add' | 'remove';
  target: 'connection' | 'parameter' | 'module';
  feedback: string; // User's natural language input
}

export interface PatchModification {
  description: string; // Human-readable change
  changes: {
    connectionsAdded?: Connection[];
    connectionsRemoved?: Connection[];
    parametersChanged?: ParameterChange[];
  };
}

export async function refinePatch(
  currentPatch: Patch,
  feedback: string,
  rackData: ParsedRack
): Promise<{ updatedPatch: Patch; modification: PatchModification }> {
  // 1. Parse feedback using Claude
  const refinementRequest = await parseFeedback(feedback, currentPatch, rackData);

  // 2. Determine what changes are needed
  const modification = await determineModifications(refinementRequest, currentPatch, rackData);

  // 3. Apply changes to patch
  const updatedPatch = applyModifications(currentPatch, modification);

  // 4. Validate patch still makes sense
  const isValid = validatePatch(updatedPatch, rackData);
  if (!isValid) {
    throw new Error('Modifications would break patch');
  }

  return { updatedPatch, modification };
}
```

### **Feedback Parser:**

```typescript
// lib/chat/feedback-parser.ts (NEW FILE)

export interface ParsedFeedback {
  intent: 'adjust' | 'add' | 'remove' | 'replace';
  target: string; // What to change (reverb, filter, tempo)
  direction?: 'increase' | 'decrease'; // For adjustments
  specificity: 'vague' | 'specific'; // "darker" vs "set cutoff to 2kHz"
  value?: number | string; // If specific
}

export async function parseFeedback(
  feedback: string,
  currentPatch: Patch,
  rackData: ParsedRack
): Promise<ParsedFeedback> {
  // Use Claude to understand user intent
  // Examples:
  // "darker" → { intent: 'adjust', target: 'filter_cutoff', direction: 'decrease', specificity: 'vague' }
  // "add delay" → { intent: 'add', target: 'delay', specificity: 'vague' }
  // "set reverb decay to 5 seconds" → { intent: 'adjust', target: 'reverb_decay', value: 5, specificity: 'specific' }

  const systemPrompt = `You are a modular synth parameter interpreter.
  Current patch: ${JSON.stringify(currentPatch.metadata)}
  Available modules: ${rackData.modules.map((m) => m.name).join(', ')}

  Parse this feedback into structured data:
  "${feedback}"

  Return JSON with: intent, target, direction, specificity, value`;

  // ... Claude API call
}
```

### **Modification Mapper:**

```typescript
// lib/chat/modification-mapper.ts (NEW FILE)

export const feedbackToModifications: Record<string, (patch: Patch) => PatchModification> = {
  darker: (patch) => ({
    description: 'Lowered filter cutoff by 30%, added subtle distortion',
    changes: {
      parametersChanged: [
        { module: 'filter', parameter: 'cutoff', oldValue: '5kHz', newValue: '3.5kHz' },
        { module: 'vca', parameter: 'saturation', oldValue: '0%', newValue: '15%' },
      ],
    },
  }),

  brighter: (patch) => ({
    description: 'Raised filter cutoff by 30%, increased resonance',
    changes: {
      parametersChanged: [
        { module: 'filter', parameter: 'cutoff', oldValue: '5kHz', newValue: '6.5kHz' },
        { module: 'filter', parameter: 'resonance', oldValue: '20%', newValue: '35%' },
      ],
    },
  }),

  'more reverb': (patch) => ({
    description: 'Increased reverb send to 80%, decay to 8 seconds',
    changes: {
      parametersChanged: [
        { module: 'reverb', parameter: 'send', oldValue: '50%', newValue: '80%' },
        { module: 'reverb', parameter: 'decay', oldValue: '4s', newValue: '8s' },
      ],
    },
  }),

  // ... 50+ more mappings
};
```

### **Save Intent Detection:**

```typescript
// lib/chat/save-detector.ts (NEW FILE)

export function detectSaveIntent(message: string): boolean {
  const saveKeywords = [
    'save',
    'save this',
    'save it',
    'keep this',
    'keep it',
    'perfect',
    'great',
    'love it',
    'I like it',
    'looks good',
    'done',
    'finished',
    'that works',
  ];

  const lowerMessage = message.toLowerCase().trim();

  return saveKeywords.some((keyword) => {
    // Exact match or at end of sentence
    return lowerMessage === keyword || lowerMessage.endsWith(keyword);
  });
}

export function generatePatchName(
  originalName: string,
  modifications: PatchModification[],
  conversationContext: string[]
): string {
  // Smart naming based on changes
  // "Dark Melodic Generative" + more reverb → "Dark Melodic Generative (Reverb Heavy)"
  // "Dark Melodic Generative" + darker + slower → "Darker Slower Melodic Generative"

  const descriptors = modifications.map((m) => m.description.split(' ')[0].toLowerCase());
  const uniqueDescriptors = [...new Set(descriptors)];

  if (uniqueDescriptors.length > 0) {
    return `${originalName} (${uniqueDescriptors.join(', ')})`;
  }

  return originalName;
}
```

### **Updated Chat Route:**

```typescript
// app/api/chat/patches/route.ts (ENHANCED)

export async function POST(request: NextRequest) {
  const session = await getOrCreateSession(userId, sessionId);
  const intent = await detectIntent(lastMessage.content, session);

  switch (intent) {
    case Intent.REFINE_PATCH:
      if (!session.currentPatch) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'content', content: "I don't have a patch to refine yet. Let me generate one first!" })}\n\n`
          )
        );
        // Fallback to generation
        await handlePatchGeneration(session, controller);
        break;
      }

      // Parse feedback
      const feedback = lastMessage.content;
      const { updatedPatch, modification } = await refinePatch(
        session.currentPatch,
        feedback,
        session.rackData!
      );

      // Update session
      session.patchHistory.push(session.currentPatch); // Save for undo
      session.currentPatch = updatedPatch;

      // Stream update
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'content', content: `✨ ${modification.description}\n\n` })}\n\n`
        )
      );

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'patch', patch: updatedPatch })}\n\n`)
      );

      break;

    case Intent.SAVE_PATCH:
      if (!session.currentPatch) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'content', content: 'No patch to save yet!' })}\n\n`
          )
        );
        break;
      }

      // Generate intelligent name
      const patchName = generatePatchName(
        session.currentPatch.metadata.title,
        session.modifications || [],
        session.messages.map((m) => m.content)
      );

      session.currentPatch.metadata.title = patchName;
      session.currentPatch.userId = userId;

      const savedPatch = await savePatch(session.currentPatch);

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'content', content: `✅ Saved as "${patchName}" to your Cookbook!\n\nWant to try another variation or start fresh?` })}\n\n`
        )
      );

      break;

    // ... other intents
  }
}
```

---

## 📊 Testing Requirements

### **Unit Tests:**

- [ ] `feedback-parser.test.ts`: 50+ feedback examples parsed correctly
- [ ] `modification-mapper.test.ts`: All mappings produce valid changes
- [ ] `save-detector.test.ts`: Save intent detection accuracy > 95%
- [ ] `patch-refinement.test.ts`: Patches updated correctly, validation works

### **Integration Tests:**

- [ ] Refinement preserves valid connections
- [ ] Multiple refinements compound correctly
- [ ] Undo/redo works across 5+ changes
- [ ] Save persists to database with correct metadata

### **E2E Tests:**

- [ ] User generates patch → refines 3 times → saves
- [ ] User says "darker" → sees filter cutoff change
- [ ] User says "add delay" when no delay module → gets helpful message
- [ ] User says "save" → sees confirmation, can find in Cookbook

---

## 🔗 Dependencies & Related Work

### **Depends On:**

- Issue #1: Enhanced Chat Backend (session state, intent detection)

### **Enables:**

- Issue #3: Form Deprecation (chat must support full workflow)
- Issue #4: Database Growth (saves = more data)

### **Files Modified:**

- `app/api/chat/patches/route.ts` - Add REFINE_PATCH and SAVE_PATCH handlers
- `lib/ai/claude.ts` - May need refinement-specific prompts
- `components/chat/ChatMessage.tsx` - Show patch updates smoothly

### **Files Created:**

- `lib/chat/patch-refinement.ts` - Core refinement logic
- `lib/chat/feedback-parser.ts` - Natural language parsing
- `lib/chat/modification-mapper.ts` - Feedback → technical changes
- `lib/chat/save-detector.ts` - Save intent detection
- `__tests__/lib/chat/` - Test suite

---

## 📈 Success Metrics

### **Performance:**

- [ ] Refinement response time: < 5 seconds
- [ ] Feedback parsing accuracy: > 90%
- [ ] Patch validation success: > 98%

### **User Experience:**

- [ ] Save rate: > 60% (users like their patches)
- [ ] Refinement rate: Average 3+ refinements per patch
- [ ] Undo usage: < 10% (means refinements are good)

### **Code Quality:**

- [ ] 80%+ test coverage
- [ ] All 20+ common feedback phrases handled
- [ ] No patch corruption from refinements

---

## 🚀 Implementation Checklist

### **Day 1-2: Feedback Parsing**

- [ ] Build feedback parser using Claude
- [ ] Create 50+ feedback → modification mappings
- [ ] Test parser accuracy with real examples
- [ ] Handle edge cases (impossible requests)

### **Day 2-3: Patch Refinement Engine**

- [ ] Implement patch modification logic
- [ ] Add validation to prevent broken patches
- [ ] Support undo/redo with patch history
- [ ] Test with complex patches

### **Day 3-4: Save System**

- [ ] Build save intent detector
- [ ] Implement intelligent naming
- [ ] Auto-tag with techniques/modules/mood
- [ ] Integration with existing patch-service

### **Day 4-5: Chat Integration**

- [ ] Add REFINE_PATCH intent handler
- [ ] Add SAVE_PATCH intent handler
- [ ] Smooth PatchCard updates
- [ ] Conversation flow polish

### **Day 5-6: Testing & Iteration**

- [ ] Unit tests for all components
- [ ] Integration tests for full workflow
- [ ] E2E tests for user stories
- [ ] Fix bugs, improve accuracy

---

## 💬 Technical Considerations

### **Feedback Ambiguity:**

What if user says "make it better"?

- AI asks for clarification: "Better how? Darker? More reverb? Faster?"
- Or AI tries 2-3 interpretations, shows options

### **Impossible Requests:**

User says "add reverb" but no reverb module in rack.

- Option A: "You don't have a reverb module. Want suggestions?"
- Option B: Simulate reverb with delay + feedback
- Option C: Show ModularGrid modules that could add reverb

### **Patch History Management:**

- Store last 5 patches per session (undo limit)
- Clear history on "start fresh"
- Option to export history as variations

### **Cost Optimization:**

- Feedback parsing = 1 Claude API call per refinement
- Use cached mappings for common requests (faster + cheaper)
- Batch multiple refinements if user types fast

---

## 🎭 User Stories

### **Story 1: The Iterative Tweaker**

```
As a perfectionist,
I want to refine my patch through conversation,
So that I can dial in exactly what I need.
```

**Acceptance:**

- "darker" → filter cutoff lowered
- "more reverb" → reverb send increased
- Patch card updates smoothly

### **Story 2: The Saver**

```
As a user who found a great patch,
I want to save it naturally,
So that I don't lose my work.
```

**Acceptance:**

- "save this" → patch saved to Cookbook
- Intelligent naming based on modifications
- Confirmation message with location

### **Story 3: The Undoer**

```
As someone who made a mistake,
I want to undo my last change,
So that I can get back to what worked.
```

**Acceptance:**

- "undo" or "go back" → reverts to previous version
- Works for last 5 changes
- Smooth transition

---

## 📝 Open Questions

1. **Undo Limit:** 5 patches? 10? Unlimited?
2. **Variation vs Refinement:** Is "try another" a refinement or new generation?
3. **Conflicting Feedback:** "darker" then "brighter" - compound or replace?
4. **Export History:** Should users be able to save all variations as a "patch pack"?

---

## 🔍 Testing Scenarios

### **Happy Path:**

1. AI generates "Dark Melodic Generative"
2. User says "more reverb"
3. AI increases reverb send to 80%
4. Patch card updates
5. User says "perfect, save it"
6. AI saves as "Dark Melodic Generative (Reverb Heavy)"

### **Impossible Request Path:**

1. AI generates patch (no reverb module in rack)
2. User says "add reverb"
3. AI responds: "You don't have a reverb module. Want suggestions?"
4. User says "yes"
5. AI lists 3 reverb modules from ModularGrid

### **Undo Path:**

1. AI generates patch
2. User refines 3 times
3. User says "go back"
4. AI reverts to previous version
5. Patch card updates

### **Ambiguous Feedback Path:**

1. AI generates patch
2. User says "make it better"
3. AI asks: "Better how? Darker? More reverb? Faster?"
4. User says "darker"
5. AI refines accordingly

---

## 🎸 Why This Matters

**Without iteration:** Users get one shot, must regenerate from scratch
**With iteration:** Users explore creatively, build on ideas, save winners

This is the difference between:

- "Generate Patch" button (1997)
- Conversational design partner (2025)

**This issue enables the core promise: AI as a creative collaborator, not a one-shot generator.**

---

**Ready to build:** After Issue #1 completes ✅
**Blocks other work:** Partial (Issue #3 can start in parallel)
**Estimated completion:** Week 1-2 of AI-Native Paradigm Shift
