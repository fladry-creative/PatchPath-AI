# 🧪 Testing Guide - PatchPath AI

## Prerequisites

Before testing, ensure you have:

1. ✅ **Anthropic API Key** - Get from https://console.anthropic.com
2. ✅ **Clerk Keys** - Already configured! ✅
3. ✅ **Dev server running** - `npm run dev`

## Setup Anthropic API Key

1. Go to: https://console.anthropic.com
2. Sign in / Create account
3. Navigate to "API Keys"
4. Create a new key
5. Add to `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

6. Restart dev server: `npm run dev`

## Test Endpoints

### 1. Test Scraper (Already Working!)

```bash
# Test rack scraping
curl "http://localhost:3000/api/test-scraper?url=https://modulargrid.net/e/racks/view/2383104"
```

**Expected**: JSON with rack analysis, modules, capabilities

---

### 2. Test Patch Generation (NEW!)

```bash
# Generate a patch with AI!
curl "http://localhost:3000/api/test-patch-generation?url=https://modulargrid.net/e/racks/view/2383104&intent=dark+ambient+drone"
```

**Expected**: Full patch with:
- Title & description
- Cable connections
- Step-by-step instructions
- Parameter suggestions
- "Why this works" explanation

#### More Test Examples:

```bash
# Generative techno
curl "http://localhost:3000/api/test-patch-generation?url=https://modulargrid.net/e/racks/view/2383104&intent=generative+techno+sequence&genre=techno"

# FM synthesis
curl "http://localhost:3000/api/test-patch-generation?url=https://modulargrid.net/e/racks/view/2383104&intent=aggressive+FM+bass&technique=FM+synthesis"

# Ambient soundscape
curl "http://localhost:3000/api/test-patch-generation?url=https://modulargrid.net/e/racks/view/2383104&intent=evolving+ambient+soundscape&genre=ambient"
```

---

### 3. Test Full Patch Generation (Authenticated)

This requires sign-in!

```bash
# Using curl with auth (get your token from browser)
curl -X POST http://localhost:3000/api/patches/generate \
  -H "Content-Type: application/json" \
  -d '{
    "rackUrl": "https://modulargrid.net/e/racks/view/2383104",
    "intent": "Create a dark, evolving drone",
    "generateVariations": true
  }'
```

**Expected**: Patch + 3 variations!

---

## What to Look For

### ✅ Good Results:
- Patch uses ONLY modules from your rack
- Signal flow makes sense (VCO → VCF → VCA → Output)
- Creative but practical routing
- Clear step-by-step instructions
- Educational "Why this works" section

### ⚠️ Issues to Report:
- Uses modules not in rack
- Impossible connections
- Unclear instructions
- Invalid JSON response

---

## Cost Tracking

**Claude 3 Haiku** (MVP Model):
- Input: $0.25 per 1M tokens
- Output: $1.25 per 1M tokens

**Rough cost per patch**: ~$0.001 (0.1 cent!)

For MVP testing with 1000 patches: ~$1-2 total 🎉

---

## Next Steps After Testing

Once you have your Anthropic key and test is working:

1. ✅ Generate a few patches
2. ✅ Validate they make sense for the demo rack
3. ✅ We'll build the UI to display patches beautifully
4. ✅ Add visual patch diagrams (SVG cable routing)
5. ✅ Build the cookbook (save patches)

---

## Troubleshooting

### "Claude API not configured"
→ Add `ANTHROPIC_API_KEY` to `.env.local` and restart server

### "Failed to parse Claude response"
→ Claude returned invalid JSON (rare, report if happens)

### "Unauthorized"
→ Sign in at http://localhost:3000/sign-in first

### Dev server not picking up changes
→ Kill and restart: `npm run dev`

---

**🎸 Ready to rock!**
