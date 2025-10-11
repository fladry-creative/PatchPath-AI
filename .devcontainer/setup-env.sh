#!/bin/bash
# Auto-generate .env.local from GitHub Codespace secrets

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

# Check which secrets are set
echo ""
echo "✅ .env.local created"
echo ""
echo "Secret Status:"

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
  echo "🎉 All secrets configured! Ready to develop."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
