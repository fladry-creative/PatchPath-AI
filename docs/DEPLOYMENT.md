# 🚀 Production Deployment Guide

## Quick Deploy to Vercel (30 minutes)

### Prerequisites

- GitHub account connected to Vercel
- Vercel CLI installed: `npm i -g vercel`
- All environment variables ready (see `.env.example`)

---

## Step 1: Install Vercel CLI (if not installed)

```bash
npm install -g vercel
```

---

## Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

---

## Step 3: Deploy to Vercel

### Option A: CLI Deployment (Fastest)

```bash
# From project root
vercel

# Follow prompts:
# - Link to existing project? N
# - Project name? patchpath-ai
# - Directory? ./
# - Override settings? N
```

This creates a **preview deployment**.

### Option B: Production Deployment

```bash
vercel --prod
```

This deploys directly to production.

---

## Step 4: Configure Environment Variables

You can set env vars via:

- Vercel Dashboard: https://vercel.com → Project → Settings → Environment Variables
- CLI: `vercel env add VARIABLE_NAME`

### Required Variables:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini API (optional - for patch diagrams)
GEMINI_API_KEY=your-gemini-api-key

# Azure Cosmos DB
COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
COSMOS_KEY=your-cosmos-key
COSMOS_DATABASE_NAME=patchpath
COSMOS_CONTAINER_RACKS=racks
COSMOS_CONTAINER_PATCHES=patches
COSMOS_CONTAINER_MODULES=modules
COSMOS_CONTAINER_ENRICHMENTS=enrichments
COSMOS_CONTAINER_USERS=users

# Node Environment
NODE_ENV=production
```

### Setting Variables via CLI:

```bash
# Example for one variable:
vercel env add ANTHROPIC_API_KEY production

# You'll be prompted to enter the value
```

### Bulk Import from .env.local:

```bash
# Use vercel-env-import (community tool)
npx vercel-env-import
```

---

## Step 5: Trigger Production Deployment

After adding environment variables:

```bash
vercel --prod
```

Vercel will build and deploy your app. You'll get a URL like:

```
https://patchpath-ai.vercel.app
```

---

## Step 6: Configure Custom Domain (patch.tfcg.dev)

### In Vercel Dashboard:

1. Go to **Project Settings** → **Domains**
2. Add domain: `patch.tfcg.dev`
3. Vercel will show you DNS records to add

### In Cloudflare (or your DNS provider):

Add CNAME record:

```
Type: CNAME
Name: patch
Target: cname.vercel-dns.com
Proxy: Proxied (orange cloud ON)
TTL: Auto
```

### Wait for DNS Propagation (5-15 minutes)

Check status:

```bash
dig patch.tfcg.dev
```

### SSL Certificate:

Vercel auto-provisions SSL certificates. Once DNS propagates, visit:

```
https://patch.tfcg.dev
```

---

## Step 7: Update Clerk URLs

In [Clerk Dashboard](https://dashboard.clerk.com):

1. Navigate to your application
2. **Settings** → **Domains**
3. Add production domain: `patch.tfcg.dev`
4. Update redirect URLs:
   - Sign-in redirect: `https://patch.tfcg.dev/dashboard`
   - Sign-up redirect: `https://patch.tfcg.dev/dashboard`
   - Allowed redirect URLs: `https://patch.tfcg.dev/*`

---

## Step 8: Test Production Deployment

```bash
# Test endpoints:
curl https://patch.tfcg.dev
curl https://patch.tfcg.dev/about
curl https://patch.tfcg.dev/api/health

# Test in browser:
# 1. Sign up flow
# 2. Generate a patch
# 3. Check cookbook
# 4. Test on mobile device
```

---

## Monitoring & Logs

### View Logs:

```bash
vercel logs patchpath-ai
```

### Vercel Dashboard:

- Analytics: https://vercel.com/[username]/patchpath-ai/analytics
- Deployments: https://vercel.com/[username]/patchpath-ai/deployments
- Logs: https://vercel.com/[username]/patchpath-ai/logs

---

## CI/CD (Automatic Deployments)

### GitHub Integration:

Vercel auto-deploys on push to `main` branch:

1. Go to Vercel Dashboard → Settings → Git
2. Connect GitHub repository
3. Configure:
   - **Production Branch**: `main`
   - **Preview Branches**: All branches
   - **Deploy Hooks**: Optional webhooks

Every push to `main` = auto-deploy to production ✅

---

## Rollback

If something breaks:

```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

Or use Vercel Dashboard → Deployments → Promote to Production

---

## Performance Optimization

### Vercel Automatically Handles:

- ✅ CDN distribution (global edge network)
- ✅ Image optimization
- ✅ Gzip/Brotli compression
- ✅ HTTP/2 & HTTP/3
- ✅ Smart caching

### Next.js Optimizations Already Configured:

- ✅ Turbopack build system
- ✅ React Compiler (auto-memoization)
- ✅ Server Components
- ✅ Route prefetching

---

## Cost Estimate (Vercel Pro Plan)

- **Hosting**: $20/month (Pro plan)
- **Bandwidth**: Included (100GB)
- **Build Minutes**: Included (6000 min/month)
- **Serverless Function Execution**: Included (1M invocations)

**Free Hobby tier available** for non-commercial use!

---

## Alternative: Azure Container Apps

If you need more control or prefer Azure:

See [docs/AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) for Container Apps setup.

**Pros**:

- Full container control
- Direct Azure Cosmos DB integration
- Custom scaling rules
- Lower egress costs if all Azure

**Cons**:

- More complex setup (2 hours vs 30 min)
- Manual SSL/CDN configuration
- Requires Docker knowledge

---

## Troubleshooting

### Build Fails:

```bash
# Check build logs
vercel logs --output=json | jq

# Test build locally
npm run build
```

### Environment Variables Not Working:

```bash
# Verify variables are set
vercel env ls

# Pull env vars locally to test
vercel env pull .env.local
```

### Domain Not Resolving:

```bash
# Check DNS propagation
dig patch.tfcg.dev
nslookup patch.tfcg.dev

# Check Vercel status
vercel domains ls
```

### Clerk Authentication Errors:

1. Verify domain is added in Clerk Dashboard
2. Check redirect URLs match production domain
3. Verify env vars are set in Vercel

---

## Health Check Endpoint

Create this endpoint for monitoring:

**File**: `app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
}
```

Test:

```bash
curl https://patch.tfcg.dev/api/health
```

---

## Post-Deployment Checklist

- [ ] All pages load correctly
- [ ] Authentication works (sign up/sign in)
- [ ] Patch generation works
- [ ] Cookbook displays patches
- [ ] Vision upload works (if enabled)
- [ ] Mobile responsive design working
- [ ] SSL certificate valid
- [ ] Analytics configured
- [ ] Error tracking setup (optional: Sentry)
- [ ] Monitoring configured

---

## Success! 🎸

Your app is now live at:

```
https://patch.tfcg.dev
```

Share it with the world! 🚀

---

**Deployed by**: Fladry Creative × Trash Team
**Est.**: Lucky 13
**BPM**: ∞
