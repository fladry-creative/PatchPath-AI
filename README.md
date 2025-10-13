# 🎸 PatchPath AI

> Your AI studio companion that transforms modular synthesis from solitary experimentation into a guided creative journey.

**Tagline**: "The path to sound. Your rack, infinite possibilities."

## 🚀 What is PatchPath AI?

PatchPath AI analyzes your ModularGrid rack and becomes the friend in your studio—suggesting patches, teaching techniques, and revealing possibilities you never knew existed.

**28 years in the making**: From Nashville warehouse raves (1997) to AI-powered synthesis tools (2025). Part of the [Fladry Creative](https://fladrycreative.com) ecosystem, built by [The Fladry Creative Group](https://fladrycreative.co) × [Trash Team](https://trashteam.tv).

### Core Features (MVP)

1. **Rack Analysis**: Paste your ModularGrid URL and get instant analysis of your rack's capabilities
2. **AI Patch Generation**: Describe what you want (mood, genre, technique) and get working patches with visual diagrams
3. **Personal Cookbook**: Save, organize, and iterate on your favorite patches
4. **Variations**: Generate 3-5 alternative routing options for any patch

## 🛠️ Tech Stack (2025 Modern Best Practices)

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS v4, Framer Motion
- **Auth**: Clerk
- **AI**: Anthropic Claude (Haiku for MVP, Sonnet for production)
- **Database**: Azure Cosmos DB (free tier)
- **Scraping**: Puppeteer (ModularGrid integration)
- **Hosting**: Azure Container Apps
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

- Node.js 18+ (tested on 20.x)
- npm or yarn
- Clerk account (free tier)
- Anthropic API key
- Azure account (with $200 credit)

## 🏃 Quick Start

### 1. Clone and Install

\`\`\`bash
git clone https://github.com/fladry-creative/patchpath-ai.git
cd patchpath-ai
npm install
\`\`\`

### 2. Setup Environment Variables

\`\`\`bash
cp .env.example .env.local
\`\`\`

Then fill in your keys:

- **Clerk**: Get keys from [clerk.com](https://clerk.com)
- **Anthropic**: Get API key from [console.anthropic.com](https://console.anthropic.com)
- **Azure Cosmos DB**: Create free tier database (see [docs/azure-setup.md](docs/azure-setup.md))

### 3. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) 🎉

## 🏗️ Project Structure

\`\`\`
patchpath-ai/
├── app/ # Next.js App Router
│ ├── api/ # API routes
│ │ ├── racks/ # Rack analysis endpoints
│ │ └── patches/ # Patch generation endpoints
│ ├── (auth)/ # Auth pages (sign-in, sign-up)
│ ├── (dashboard)/ # Protected routes
│ │ ├── dashboard/
│ │ ├── generate/
│ │ └── cookbook/
│ └── page.tsx # Landing page
├── components/
│ ├── ui/ # shadcn/ui components
│ ├── rack/ # Rack visualization
│ ├── patches/ # Patch cards, diagrams
│ └── chat/ # Conversational interface
├── lib/
│ ├── ai/ # Claude integration
│ ├── scraper/ # ModularGrid scraper
│ ├── db/ # Cosmos DB client
│ └── validation/ # Patch validation logic
├── types/ # TypeScript definitions
│ ├── module.ts
│ ├── rack.ts
│ └── patch.ts
└── docs/ # Documentation
└── azure-setup.md
\`\`\`

## 🧪 Testing

Test with the demo rack:
\`\`\`
https://modulargrid.net/e/racks/view/2383104
\`\`\`

## 🚀 Deployment

See [docs/azure-setup.md](docs/azure-setup.md) for Azure Container Apps deployment guide.

## 📝 Development Roadmap

### ✅ Phase 1: MVP (Week 1-2)

- [x] Project setup
- [ ] ModularGrid scraper
- [ ] AI patch generation
- [ ] Visual patch diagrams
- [ ] Personal cookbook
- [ ] Azure deployment

### 🔮 Phase 2: Community (Week 3-4)

- [ ] Patch sharing
- [ ] Discovery & browsing
- [ ] Learning paths
- [ ] AI personality modes

### 🌟 Phase 3: Advanced

- [ ] Multi-rack support
- [ ] Audio examples
- [ ] Community challenges
- [ ] Monetization

## 🤝 Contributing

We're in MVP mode! If you'd like to contribute:

1. Check [open issues](https://github.com/fladry-creative/patchpath-ai/issues)
2. Comment on an issue you'd like to work on
3. Fork, branch, code, PR!

## 📄 License

MIT

## 🙏 Acknowledgments

- **ModularGrid** for the incredible modular synth database
- **Anthropic** for Claude API
- **Modular synthesis community** for inspiration
- The Nashville rave scene (1997-2002) - where it all started

---

**Built with ❤️ by modular synth enthusiasts, for modular synth enthusiasts**

_"AI can't make the music, but it can show you the path."_

## 📖 The Story

Born from the chaos of Nashville warehouse raves, PatchPath AI represents 28 years of making machines scream. What started as The Ghetto Headliners throwing legendary parties in 1999 evolved through Grammy-winning engineering careers, 200+ DIY modules sold, and cross-country studio collaborations.

**July 7, 2025** - exactly 18 years after a wedding - everything launched: Fladry Creative, The Fladry Creative Group, and PatchPath AI. The weirdness when music + creativity + cutting-edge tech + physical gear + obsession over craft all mix together.

**Read the full story:** [About Page](/about)

_"Sometimes you just have to see if you can do what you talk about. Here it is."_
