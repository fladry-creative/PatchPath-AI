# PatchPath AI - Container Dependencies

## Auto-Installed on Container Creation

The following dependencies are automatically installed when the devcontainer is created:

### 1. Base Image: `typescript-node:1-20-bullseye`
- Node.js v20 (LTS)
- npm v10
- TypeScript support
- Git
- Common build tools

### 2. DevContainer Features
Configured in `devcontainer.json`:

```json
{
  "azure-cli": "Latest Azure CLI tools",
  "github-cli": "Latest GitHub CLI (gh)",
  "docker-in-docker": "Docker runtime for containers"
}
```

### 3. Browser Engines (for Scraping & Testing)

#### Puppeteer + Chrome
- **Purpose**: Scrape ModularGrid racks
- **Auto-install**: Via `setup-env.sh` + `package.json` postinstall hook
- **Location**: `/home/node/.cache/puppeteer/chrome/`
- **Version**: Chrome 141.0.7390.76 (auto-updated)

#### Playwright Chromium
- **Purpose**: E2E testing
- **Auto-install**: Via `setup-env.sh`
- **Command**: `npx playwright install --with-deps chromium`

### 4. Node Packages
Installed via `npm install` (see `package.json`):

**Production Dependencies:**
- `@anthropic-ai/sdk` - Claude AI integration
- `@azure/cosmos` - Cosmos DB client
- `@clerk/nextjs` - Authentication
- `@google/generative-ai` - Gemini Vision API
- `puppeteer` - ModularGrid scraping
- `next` v15.5.4 - React framework
- `react` v19.2.0 - UI library
- `tailwindcss` v4 - Styling

**Dev Dependencies:**
- `@playwright/test` - E2E testing
- `jest` + `@testing-library/react` - Unit testing
- `eslint` + `prettier` - Code quality
- `typescript` - Type safety
- `husky` + `lint-staged` - Git hooks

## Manual Installation (if needed)

### Chrome for Puppeteer
```bash
npx puppeteer browsers install chrome
```

### Playwright Browsers
```bash
npx playwright install --with-deps chromium
```

### All Dependencies at Once
```bash
npm install
bash .devcontainer/setup-env.sh
```

## Verifying Installation

Check if everything is installed:

```bash
# Node & NPM
node --version  # Should be v20.x
npm --version   # Should be v10.x

# Chrome (Puppeteer)
ls -la /home/node/.cache/puppeteer/chrome/

# Playwright
npx playwright --version

# Azure CLI
az --version

# GitHub CLI
gh --version
```

## Troubleshooting

### Puppeteer "Could not find Chrome" error
**Solution:**
```bash
npx puppeteer browsers install chrome
```

### Playwright browsers not found
**Solution:**
```bash
npx playwright install --with-deps chromium
```

### Environment secrets not loading
**Solution:**
1. Go to https://github.com/settings/codespaces
2. Add required secrets
3. Rebuild codespace

## Required Secrets

Add these to GitHub Codespaces secrets:

- `ANTHROPIC_API_KEY` - Claude AI (required for patch generation)
- `AZURE_COSMOS_CONNECTION_STRING` - Database (required for storage)
- `GEMINI_API_KEY` - Vision API (optional)
- `CLERK_SECRET_KEY` - Auth backend key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Auth frontend key

## Size & Performance

**Approximate sizes:**
- Puppeteer Chrome: ~300MB
- Playwright Chromium: ~400MB
- Node modules: ~500MB
- **Total workspace**: ~1.5GB

**Optimization:**
- `.devcontainer/devcontainer.json` sets `NODE_OPTIONS: --max-old-space-size=4096` (4GB heap)
- Turbopack enabled for faster Next.js builds
- Aggressive caching in Claude Code settings

## CI/CD Considerations

When building for production (Docker):
- Chrome is installed via `npx puppeteer browsers install chrome` in Dockerfile
- System dependencies handled by base image
- No Playwright needed in production (E2E tests run in CI only)
