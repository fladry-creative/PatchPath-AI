#!/bin/bash
# Auto-generate .env.local from GitHub Codespace secrets
# AND install all necessary dependencies for PatchPath AI

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 PatchPath AI - Complete Environment Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ═══════════════════════════════════════════════════
# 1. Environment Variables
# ═══════════════════════════════════════════════════
echo "🔐 Setting up environment from Codespace secrets..."

# Create .env.local from secrets
cat > .env.local << EOF
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}
CLERK_SECRET_KEY=${CLERK_SECRET_KEY:-}
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Anthropic Claude API
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}

# Google Gemini API (for image generation)
GEMINI_API_KEY=${GEMINI_API_KEY:-}

# Azure Cosmos DB
AZURE_COSMOS_CONNECTION_STRING="${AZURE_COSMOS_CONNECTION_STRING:-}"

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
EOF

echo "✅ .env.local created"
echo ""

# ═══════════════════════════════════════════════════
# 2. Install Chrome for Puppeteer (ModularGrid scraping)
# ═══════════════════════════════════════════════════
echo "🌐 Installing Chrome for Puppeteer..."

if [ -d "/home/node/.cache/puppeteer/chrome" ]; then
  echo "  ℹ️  Chrome already installed, skipping..."
else
  npx puppeteer browsers install chrome
  echo "  ✅ Chrome installed"
fi
echo ""

# ═══════════════════════════════════════════════════
# 3. Install Playwright Browsers (for E2E testing)
# ═══════════════════════════════════════════════════
echo "🎭 Installing Playwright browsers..."

if npx playwright --version &> /dev/null; then
  npx playwright install --with-deps chromium
  echo "  ✅ Playwright browsers installed"
else
  echo "  ℹ️  Playwright not found, will install on first test run"
fi
echo ""

# ═══════════════════════════════════════════════════
# 4. Verify Node & NPM versions
# ═══════════════════════════════════════════════════
echo "📦 Verifying toolchain..."
echo "  Node: $(node --version)"
echo "  NPM: $(npm --version)"
echo "  Git: $(git --version)"
echo ""

# ═══════════════════════════════════════════════════
# 5. Check Secret Status
# ═══════════════════════════════════════════════════
echo "🔑 Secret Status:"

check_secret() {
  if [ -z "${!1}" ]; then
    echo "  ❌ $1 - NOT SET"
    return 1
  else
    echo "  ✅ $1 - Set"
    return 0
  fi
}

MISSING=0

check_secret "ANTHROPIC_API_KEY" || MISSING=$((MISSING+1))
check_secret "AZURE_COSMOS_CONNECTION_STRING" || MISSING=$((MISSING+1))
check_secret "GEMINI_API_KEY" || MISSING=$((MISSING+1))
check_secret "CLERK_SECRET_KEY" || MISSING=$((MISSING+1))
check_secret "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" || MISSING=$((MISSING+1))

echo ""

# ═══════════════════════════════════════════════════
# 6. Final Status
# ═══════════════════════════════════════════════════
if [ $MISSING -gt 0 ]; then
  echo "⚠️  $MISSING secrets are missing!"
  echo ""
  echo "To add Codespace secrets:"
  echo "1. Go to: https://github.com/settings/codespaces"
  echo "2. Click 'New secret'"
  echo "3. Add each missing secret"
  echo "4. Rebuild this Codespace"
  echo ""
  echo "OR use this quick command:"
  echo "gh secret set SECRET_NAME --user"
  echo ""
else
  echo "🎉 All secrets configured!"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Environment setup complete!"
echo ""
echo "🚀 Ready to develop! Run: npm run dev"
echo "📊 Run tests with: npm test"
echo "🎭 E2E tests: npm run test:e2e"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
