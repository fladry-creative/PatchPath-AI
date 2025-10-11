# PatchPath Dev Container

This directory contains the GitHub Codespaces configuration for cloud-based development.

## Quick Links
- 📖 Full Setup Guide: [CODESPACE_SETUP.md](../docs/CODESPACE_SETUP.md)
- 🚀 Create Codespace: [GitHub Repo](https://github.com/fladry-creative/PatchPath-AI)

## What's Configured

### Base Image
- `mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye`
- Node.js 20 (LTS)
- TypeScript support
- Debian Bullseye base

### Features Installed
- **Azure CLI** - Manage Cosmos DB, Container Apps
- **GitHub CLI** - Manage secrets, issues, PRs
- **Docker** - Build and test containers

### VS Code Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Azure Tools
- GitHub Copilot

### Forwarded Ports
- **3000** - Next.js app (primary)
- **3001** - Next.js dev server (fallback)

### Post-Create Commands
- `npm install` - Install all dependencies
- Git safe directory configuration
- Success message with next steps

## File Structure

```
.devcontainer/
├── devcontainer.json    # Main configuration
└── README.md           # This file
```

## Customization

### Add Extensions
Edit `devcontainer.json`:
```json
"customizations": {
  "vscode": {
    "extensions": [
      "your.extension.id"
    ]
  }
}
```

### Change Machine Size
In GitHub:
1. Open Codespace
2. Command Palette → "Change Machine Type"
3. Select: 2-core (free), 4-core ($), 8-core ($$)

### Add Features
Browse: https://containers.dev/features
```json
"features": {
  "ghcr.io/devcontainers/features/your-feature:1": {}
}
```

## Troubleshooting

### Codespace Won't Start
- Check `.devcontainer/devcontainer.json` syntax
- Rebuild: Command Palette → "Rebuild Container"

### npm install Fails
- Delete Codespace and create new one
- Check `package.json` for syntax errors

### Extensions Not Loading
- Wait for post-create command to finish
- Reload window: Command Palette → "Reload Window"

## Cost Management

### Free Tier Usage
- 60 hours/month on 2-core
- Auto-stops after 30 min inactivity
- View usage: GitHub Settings → Billing → Codespaces

### Reduce Costs
- Stop Codespace when done
- Use prebuilds for faster startup
- Delete unused Codespaces
- Set shorter timeout: Settings → Codespaces

## Next Steps

1. ✅ Push this configuration to GitHub
2. ✅ Create your first Codespace
3. ✅ Add secrets (see CODESPACE_SETUP.md)
4. ✅ Run `npm run dev`
5. ✅ Code without killing your laptop!
