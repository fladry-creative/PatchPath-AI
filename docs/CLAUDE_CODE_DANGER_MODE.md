# Claude Code DANGER MODE 🔥

**Container Edition: Maximum Aggression, Zero Confirmations**

---

## Why Danger Mode?

You're in a **disposable cloud container**. If something breaks:
- Delete the Codespace
- Create a new one
- You're back in 2 minutes

So why click "Approve" 100 times? **LET CLAUDE COOK!**

---

## What's Enabled

### 🚨 Skip ALL Confirmations
```json
"claudeCode.dangerouslySkipWriteConfirmations": true
"claudeCode.dangerouslySkipReadConfirmations": true
"claudeCode.dangerouslySkipEditConfirmations": true
"claudeCode.alwaysAllowBash": true
```

Claude can:
- ✅ Read any file instantly
- ✅ Write/edit files without asking
- ✅ Run bash commands freely
- ✅ Delete files (it's a container!)
- ✅ Install dependencies
- ✅ Run tests
- ✅ Fix errors automatically

### ⚡ Maximum Performance
```json
"claudeCode.model": "claude-sonnet-4-5"
"claudeCode.maxTokens": 8192
"claudeCode.tokenBudget": 200000
"claudeCode.parallelToolExecution": true
"claudeCode.maxConcurrentTools": 10
```

Claude operates at:
- 🧠 **Best model** (Sonnet 4.5)
- 🚀 **Maximum tokens** (8K response, 200K context)
- ⚡ **Parallel execution** (10 tools at once)
- 🎯 **Aggressive caching** (faster repeat operations)

### 🤖 Full Autonomy
```json
"claudeCode.autoApproveAllTools": true
"claudeCode.autoFixErrors": true
"claudeCode.autoInstallDependencies": true
```

Claude will:
- Fix errors without asking
- Install missing packages automatically
- Use any tool needed
- Take initiative on complex tasks
- Parallel execution for speed

---

## Safety Nets That ARE Enabled

Even in danger mode, these protections remain:

✅ **Git tracking** - All changes are versioned
✅ **Rollback capability** - `git reset --hard` if needed
✅ **No auto-commit** - You control when code is committed
✅ **No auto-push** - You control when code goes to GitHub
✅ **Container isolation** - Can't affect your laptop

---

## When to Use Danger Mode

### ✅ Perfect For:
- **Active development** in Codespace
- **Rapid prototyping** with minimal friction
- **Complex refactoring** requiring many file changes
- **Database operations** (it's isolated)
- **Testing destructive changes** (container is disposable)
- **Learning/experimentation** (just rebuild if broken)

### ❌ NOT For:
- **Production environments** (use normal mode)
- **Shared Codespaces** (others might not expect it)
- **Critical data operations** (extra validation needed)

---

## How It Works

### Regular Claude Code:
```
You: "Fix all TypeScript errors"
Claude: Here are the errors I found...
You: Approve file1.ts
You: Approve file2.ts
You: Approve file3.ts
You: Approve bash npm install
You: Approve file4.ts
...😴
```

### Danger Mode:
```
You: "Fix all TypeScript errors"
Claude: *reads all files*
       *edits 15 files in parallel*
       *runs npm install*
       *fixes import errors*
       *runs type check*
       ✅ Done in 30 seconds! 🔥
```

---

## Example Workflows

### Scenario 1: Refactor Component Structure
```
You: "Move all components to feature-based folders"

Danger Mode:
- Reads all component files
- Creates new folder structure
- Moves files with parallel operations
- Updates all imports automatically
- Runs lint to verify
- Done in 1 minute
```

### Scenario 2: Add New Feature
```
You: "Add user profile page with avatar upload"

Danger Mode:
- Creates route file
- Creates component files
- Installs image processing library
- Adds API endpoint
- Updates types
- Adds tests
- All done without 20 confirmation clicks
```

### Scenario 3: Database Schema Change
```
You: "Add userId field to all modules in Cosmos DB"

Danger Mode:
- Reads schema files
- Updates TypeScript types
- Updates database service
- Creates migration script
- Updates API routes
- Runs tests
- Shows summary of changes
```

---

## Rollback Strategies

If Claude goes too far:

### Quick Rollback:
```bash
# Undo all changes since last commit
git reset --hard HEAD

# Or just undo specific file
git checkout HEAD -- path/to/file.ts
```

### File-by-File Review:
```bash
# See what changed
git diff

# Review specific file
git diff path/to/file.ts

# Restore if needed
git restore path/to/file.ts
```

### Nuclear Option:
```bash
# Delete entire Codespace
# Create new one (2 minutes)
# All secrets auto-load
# Back to clean slate
```

---

## Performance Comparison

### Local Development (Safe Mode):
- 100 confirmation clicks
- Manual npm install
- One file at a time
- 30-45 minutes for complex refactor
- 😫 Friction everywhere

### Codespace Danger Mode:
- Zero confirmations
- Auto dependency management
- Parallel file operations
- 5-10 minutes for same refactor
- 🚀 Pure velocity

---

## Settings Location

### Automatic (Codespace):
Settings are pre-configured in `.devcontainer/devcontainer.json`

### Manual Override:
If you want different settings locally:

**macOS/Linux:**
```bash
~/.config/Code/User/settings.json
```

**Windows:**
```
%APPDATA%\Code\User\settings.json
```

**Just for this workspace:**
```bash
.vscode/settings.json  # Add to .gitignore!
```

---

## FAQ

### Q: What if Claude breaks something?
**A:** `git reset --hard` or delete Codespace. It's disposable!

### Q: Will this work on my local machine?
**A:** Yes, but less recommended. Container = safe sandbox.

### Q: Can I turn it off?
**A:** Yes! Edit `.devcontainer/devcontainer.json`, remove danger mode settings, rebuild.

### Q: Does this cost more?
**A:** No! Same Codespace cost. Just more efficient use of time.

### Q: What about security?
**A:** Container is isolated. Secrets are in GitHub. No local machine access.

### Q: Can Claude delete my entire codebase?
**A:** Theoretically yes. Practically: Git protects you. Worst case: rebuild Codespace.

---

## The Philosophy

### Old Way (Local):
- "Better safe than sorry"
- Click approve 100 times
- Laptop overheats
- Slow progress
- Friction kills flow

### New Way (Container):
- "Move fast, git protects you"
- Claude has full autonomy
- Cloud does the heavy lifting
- Rapid iteration
- Flow state unlocked

---

## Real Talk

You're building a startup. Time is money. Every confirmation click is wasted seconds.

**Container = Playground**
Break things. Try stuff. Roll back. Iterate fast.

**Git = Safety Net**
All changes tracked. Easy rollback. Nothing is lost.

**Danger Mode = Speed**
Let the AI cook. Focus on product, not process.

---

## Ready to Go Batshit?

Your Codespace is configured. Just:

```bash
# Start developing
npm run dev

# Tell Claude to build something
# Watch it go BRRRR 🔥
```

No confirmations. No friction. Just **pure velocity**.

---

**⚠️ Remember**: This is ONLY for containerized development. Don't use danger mode on production servers or your local machine unless you know what you're doing!

**🚀 Now go build something amazing!**
