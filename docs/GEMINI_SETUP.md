# Gemini 2.5 Flash Image Setup Guide

Complete guide for integrating Google Gemini image generation into PatchPath.

---

## 🔐 API Key Storage

### Development (.env.local)
**Status:** ✅ READY - Just add your key!

1. Open `.env.local` in your editor
2. Add this line:
   ```bash
   # Google Gemini API (for image generation)
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
3. Save the file
4. **NEVER commit `.env.local`** (already in .gitignore ✅)

### GitHub Secrets (CI/CD)
**Purpose:** Automated deployment pipeline

1. Go to: `https://github.com/<your-username>/patchpath-ai/settings/secrets/actions`
2. Click **New repository secret**
3. Name: `GEMINI_API_KEY`
4. Value: Your Gemini API key
5. Click **Add secret**

### Azure Container Apps (Production)
**Purpose:** Runtime access in production

**Option 1: Environment Variables (Quick)**
```bash
az containerapp update \
  --name patchpath-app \
  --resource-group patchpath-rg \
  --set-env-vars GEMINI_API_KEY=your_key_here
```

**Option 2: Azure Key Vault (Best Practice - Later)**
```bash
# Create Key Vault
az keyvault create \
  --name patchpath-vault \
  --resource-group patchpath-rg \
  --location eastus

# Add secret
az keyvault secret set \
  --vault-name patchpath-vault \
  --name GEMINI-API-KEY \
  --value your_key_here

# Reference in Container App
az containerapp update \
  --name patchpath-app \
  --resource-group patchpath-rg \
  --set-env-vars GEMINI_API_KEY=secretref:gemini-api-key
```

---

## 📦 Installation

### 1. Install Gemini SDK
```bash
npm install @google/generative-ai
```

### 2. Install Type Definitions (if needed)
```bash
npm install --save-dev @types/node
```

### 3. Verify Installation
```bash
npm list @google/generative-ai
```

---

## 🏗️ Implementation

### 1. Create Gemini Client

**File:** `lib/ai/gemini.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const geminiImageModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash-image'
});

export async function generatePatchDiagram(params: {
  patchInstructions: string;
  modules: string[];
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
}): Promise<{ imageUrl: string; imageData: string }> {
  const prompt = buildDiagramPrompt(params);

  const result = await geminiImageModel.generateContent({
    prompt,
    generationConfig: {
      temperature: 0.7,
      aspectRatio: params.aspectRatio || '1:1'
    }
  });

  const response = await result.response;
  const imageData = response.image(); // Base64 encoded

  // Upload to Azure Blob Storage (implement separately)
  const imageUrl = await uploadToAzureBlob(imageData);

  return { imageUrl, imageData };
}

function buildDiagramPrompt(params: {
  patchInstructions: string;
  modules: string[];
}): string {
  return `
Create a professional, technical schematic diagram for a modular synthesizer patch.

MODULES PRESENT:
${params.modules.join(', ')}

PATCH INSTRUCTIONS:
${params.patchInstructions}

STYLE REQUIREMENTS:
- Technical schematic style (like professional service manuals)
- Clean, minimalist design with white/light gray background
- Module blocks should be rectangular with clear labels
- Cables should be color-coded:
  🟠 Orange = Audio signals
  🔵 Blue = CV (Control Voltage)
  🟢 Green = Gate/Trigger
  🟣 Purple = Clock
- Use smooth curved lines for cable paths (avoid sharp angles)
- Show signal flow direction with subtle arrows
- Label connection points clearly (VCO IN, VCA IN, etc.)
- Include brief annotations explaining key connections
- Professional, shareable quality suitable for social media

OUTPUT:
A single, complete patch diagram showing all connections in the described patch.
  `.trim();
}
```

### 2. Create API Endpoint

**File:** `app/api/patches/generate-diagram/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generatePatchDiagram } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    const { patchInstructions, modules, aspectRatio } = await req.json();

    if (!patchInstructions || !modules) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const diagram = await generatePatchDiagram({
      patchInstructions,
      modules,
      aspectRatio
    });

    return NextResponse.json({
      success: true,
      diagram
    });

  } catch (error) {
    console.error('Diagram generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate diagram' },
      { status: 500 }
    );
  }
}
```

### 3. Update Patch Generation

**File:** `app/api/patches/generate/route.ts`

```typescript
// Add to existing patch generation
export async function POST(req: NextRequest) {
  const { rackUrl } = await req.json();

  // Step 1: Analyze rack (Claude - existing)
  const rackAnalysis = await analyzeRack(rackUrl);

  // Step 2: Generate patch (Claude - existing)
  const patch = await generatePatch(rackAnalysis);

  // Step 3: Generate diagram (Gemini - NEW!)
  const diagram = await generatePatchDiagram({
    patchInstructions: patch.instructions.join('\n'),
    modules: rackAnalysis.modules.map(m => m.name),
    aspectRatio: '1:1' // Instagram-ready
  });

  // Step 4: Store everything (existing + diagram)
  await storePatch({
    ...patch,
    diagramUrl: diagram.imageUrl
  });

  return NextResponse.json({
    patch,
    diagram
  });
}
```

---

## 🧪 Testing

### Quick Test Script

**File:** `scripts/test-gemini.ts`

```typescript
import { generatePatchDiagram } from '../lib/ai/gemini';

async function testGemini() {
  console.log('🧪 Testing Gemini image generation...');

  const result = await generatePatchDiagram({
    patchInstructions: `
1. Patch VCO sawtooth to VCF cutoff input
2. Patch ADSR envelope to VCA
3. Patch VCF output to VCA input
4. VCA output to audio out
    `,
    modules: ['VCO', 'VCF', 'ADSR', 'VCA'],
    aspectRatio: '1:1'
  });

  console.log('✅ Diagram generated!');
  console.log('Image URL:', result.imageUrl);
  console.log('Image size:', result.imageData.length, 'bytes');
}

testGemini().catch(console.error);
```

**Run test:**
```bash
npx tsx scripts/test-gemini.ts
```

---

## 💰 Cost Monitoring

### Pricing
- **Cost per image:** $0.039
- **Images per $1:** ~25 images
- **Free tier usage:** 5 patches/user = $0.195 cost

### Budget Calculation
```typescript
// Track costs
interface DiagramMetrics {
  totalGenerated: number;
  totalCost: number;
  avgGenerationTime: number;
}

const COST_PER_IMAGE = 0.039;

function calculateCost(imageCount: number): number {
  return imageCount * COST_PER_IMAGE;
}

// Example: 100 users, 5 patches each
const monthlyImages = 100 * 5; // 500 images
const monthlyCost = calculateCost(monthlyImages); // $19.50
```

---

## 🚀 Deployment Checklist

### Local Development
- [x] Install Gemini SDK
- [ ] Add `GEMINI_API_KEY` to `.env.local`
- [ ] Create Gemini client
- [ ] Test diagram generation
- [ ] Verify image quality

### GitHub (CI/CD)
- [ ] Add `GEMINI_API_KEY` to GitHub Secrets
- [ ] Update workflow to include Gemini key
- [ ] Test deployment with secret

### Azure (Production)
- [ ] Add environment variable to Container App
- [ ] OR setup Azure Key Vault
- [ ] Verify production access
- [ ] Monitor costs in Azure portal

---

## 🔒 Security Best Practices

### ✅ DO
- Store keys in `.env.local` (development)
- Use GitHub Secrets (CI/CD)
- Use Azure Key Vault (production)
- Rotate keys periodically
- Monitor API usage

### ❌ DON'T
- Commit `.env.local` to git
- Hardcode keys in source files
- Share keys in chat/email
- Use same key across environments
- Ignore cost monitoring

---

## 🐛 Troubleshooting

### Error: "GEMINI_API_KEY is not set"
**Solution:**
```bash
# Check if key is set
echo $GEMINI_API_KEY

# If not set, add to .env.local
echo "GEMINI_API_KEY=your_key_here" >> .env.local

# Restart dev server
npm run dev
```

### Error: "Invalid API key"
**Solution:**
- Verify key is correct in Google AI Studio
- Ensure no extra spaces in `.env.local`
- Check key has image generation enabled

### Error: "Rate limit exceeded"
**Solution:**
- Implement caching (save generated diagrams)
- Add rate limiting to API endpoint
- Upgrade to paid Gemini tier

### Slow Generation
**Expected:** First image ~5-10 seconds
**If slower:**
- Check network connection
- Verify Gemini service status
- Consider caching frequently used diagrams

---

## 📊 Integration Status

### Current Status
- [x] Architecture designed
- [x] API key storage strategy defined
- [x] Cost analysis complete
- [ ] SDK installed
- [ ] Client implemented
- [ ] API endpoint created
- [ ] Testing complete
- [ ] Production deployment

### Next Steps
1. Add your Gemini API key to `.env.local`
2. Install Gemini SDK: `npm install @google/generative-ai`
3. Implement Gemini client
4. Create diagram generation endpoint
5. Test with real patches
6. Deploy to production

---

## 📚 Resources

- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Image Generation Guide](https://ai.google.dev/gemini-api/docs/image-generation)
- [Pricing Calculator](https://ai.google.dev/pricing)
- [Google AI Studio](https://aistudio.google.com/)

---

## 🎯 Success Metrics

### Technical
- ✅ Diagram generation < 10 seconds
- ✅ Image quality professional grade
- ✅ Cost < $0.05 per patch (including diagram)
- ✅ 95%+ uptime

### Business
- ✅ User engagement increases (diagram shares)
- ✅ Social media virality (Instagram/Reddit)
- ✅ Conversion to paid tier increases
- ✅ User retention improves

---

**Ready to generate beautiful patch diagrams! 🎨✨**
