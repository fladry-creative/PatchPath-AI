# GitHub Codespaces Development Setup

**Problem**: Local development kills your laptop (hot reload, Claude Code, image processing, database connections)

**Solution**: Develop entirely in the cloud with GitHub Codespaces

---

## Why Codespaces?

✅ **Zero laptop overhead** - Everything runs in Azure
✅ **Full VS Code** - Same IDE, but in browser
✅ **Pre-configured** - All dependencies installed automatically
✅ **Port forwarding** - Access localhost:3000 from anywhere
✅ **Free tier** - 60 hours/month (2-core machine)
✅ **Git integrated** - Push/pull/commit built-in
✅ **Claude Code works** - Full extension support

---

## Quick Start (5 Minutes)

### Step 1: Create Codespace
1. Go to: https://github.com/fladry-creative/PatchPath-AI
2. Click: **Code** button (green)
3. Click: **Codespaces** tab
4. Click: **Create codespace on main**
5. Wait ~2 minutes for container to build

### Step 2: Add Secrets (First Time Only)
In the Codespace terminal:

```bash
# Add all environment variables
gh secret set ANTHROPIC_API_KEY --user
# Paste: sk-ant-api03-...

gh secret set AZURE_COSMOS_CONNECTION_STRING --user
# Paste: AccountEndpoint=https://...

gh secret set GEMINI_API_KEY --user
# Paste: AIzaSy...

gh secret set CLERK_SECRET_KEY --user
gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --user
gh secret set NEXT_PUBLIC_CLERK_SIGN_IN_URL --user
gh secret set NEXT_PUBLIC_CLERK_SIGN_UP_URL --user
gh secret set NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL --user
gh secret set NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL --user
```

**OR** add via GitHub UI:
- Go to: Settings → Codespaces → Secrets
- Add each secret there (easier!)

### Step 3: Create .env.local
```bash
# In Codespace terminal:
cp .env.example .env.local

# Edit with actual values:
code .env.local
```

### Step 4: Start Development
```bash
npm run dev
```

**Access your app:**
- Codespace will auto-forward port 3000
- Click notification to open in browser
- Or go to: Ports tab → Click globe icon next to 3000

---

## What's Included

The devcontainer has:
- ✅ Node.js 20 (latest LTS)
- ✅ npm, npx, tsx
- ✅ Azure CLI (for database management)
- ✅ GitHub CLI (for secrets, issues, PRs)
- ✅ Docker (for building containers)
- ✅ ESLint, Prettier, Tailwind extensions
- ✅ Git configured

---

## Development Workflow

### Standard Flow:
```bash
# 1. Make changes in Codespace editor
# 2. Test in browser via forwarded port
# 3. Commit and push
git add .
git commit -m "feat: amazing feature"
git push

# 4. GitHub Actions auto-deploys to Azure
# 5. Test at: https://patch.tfcg.dev (when deployed)
```

### Testing Database:
```bash
# Test Cosmos DB connection
npx tsx scripts/test-cosmos.ts

# Test full pipeline
npx tsx scripts/test-full-pipeline.ts
```

### Running Scripts:
```bash
# All npm scripts work normally
npm run build
npm run lint
npm run type-check
```

---

## Cost Breakdown

### Free Tier:
- **60 hours/month** on 2-core machine
- **15 GB/month** storage
- **Perfect for**: Part-time development, testing, MVP

### Beyond Free:
- **2-core**: $0.18/hour (~$13/month for 72 hours)
- **4-core**: $0.36/hour (~$26/month for 72 hours)
- **8-core**: $0.72/hour (~$52/month for 72 hours)

**Storage**: $0.07/GB/month for additional storage

### Comparison:
| Scenario | Hours/Month | Cost |
|----------|-------------|------|
| **Casual** (2 hrs/day) | 60 hours | **$0** (free tier) |
| **Active** (3 hrs/day) | 90 hours | **$5.40** |
| **Full-time** (8 hrs/day, weekdays) | 160 hours | **$18** |

**vs. New Laptop**: $2,000+ 😅

---

## Tips & Tricks

### Keep Codespace Running:
```bash
# In terminal, prevents 30-min timeout:
while true; do echo "still here"; sleep 300; done
```

### Connect from Local VS Code:
1. Install: "GitHub Codespaces" extension
2. Command Palette: "Codespaces: Connect to Codespace"
3. Select your Codespace
4. Full local VS Code experience, but running in cloud!

### Stop Codespace When Done:
- Browser: Click "Codespaces" icon → Stop codespace
- CLI: `gh codespace stop`
- Auto-stops after 30 min inactivity (configurable)

### Rebuild Codespace:
If you update `.devcontainer/devcontainer.json`:
```bash
# Command Palette → "Codespaces: Rebuild Container"
```

---

## Troubleshooting

### Port 3000 Not Forwarding:
```bash
# Check if dev server is running:
ps aux | grep next

# Manually forward port:
# Go to: Ports tab → Add Port → 3000
```

### Environment Variables Not Loading:
```bash
# Check .env.local exists:
cat .env.local

# Restart dev server:
pkill -f "next dev" && npm run dev
```

### Slow Performance:
- Stop other Codespaces (you can have multiple)
- Upgrade to 4-core machine (Settings → Machine type)
- Clear `.next` cache: `rm -rf .next`

### Out of Storage:
```bash
# Check usage:
df -h

# Clean up:
rm -rf node_modules .next
npm install
```

---

## Advanced: Prebuilds (Optional)

Speed up Codespace creation with prebuilds:

1. Go to: Repo → Settings → Codespaces
2. Enable: "Prebuild configuration"
3. Set: Trigger on push to main
4. Next Codespace creation: ~30 seconds instead of 2 minutes!

**Cost**: ~$0.06/hour while building (usually < 5 min)

---

## When to Use Codespaces vs Local

### Use Codespaces:
- ✅ Active development (multiple hours)
- ✅ Testing vision/database features
- ✅ When laptop is overheating
- ✅ Need consistent environment
- ✅ Collaborating with others

### Use Local:
- ✅ Quick config changes
- ✅ Documentation updates
- ✅ Git operations only
- ✅ When offline

---

## Migration Path

### Phase 1: Try It (NOW)
- Use free 60 hours to test workflow
- Keep local dev as backup

### Phase 2: Hybrid (MVP)
- Codespaces for heavy work
- Local for quick edits
- Total cost: ~$5-10/month

### Phase 3: Cloud-First (Scale)
- All development in Codespaces
- Local only for emergencies
- Laptop stays cool forever
- Total cost: ~$18-30/month

---

## Support

**GitHub Docs**: https://docs.github.com/codespaces
**PatchPath Issues**: https://github.com/fladry-creative/PatchPath-AI/issues
**Codespace Logs**: Available in VS Code Output panel

---

**Ready to code in the cloud!** 🚀☁️
