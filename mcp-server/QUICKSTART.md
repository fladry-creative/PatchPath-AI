# 🚀 MCP Server Quick Start (Azure Deployment)

**Get your MCP server deployed and running in 10 minutes.**

---

## Prerequisites

- Azure account with credits
- Azure CLI installed (`az --version` to check)
- Environment variables ready (from `.env.local`)

---

## Step 1: Check Your Environment Variables

Make sure you have these in `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
COSMOS_ENDPOINT=https://...
COSMOS_KEY=...
COSMOS_DATABASE=patchpath-db
```

---

## Step 2: Run the Deployment Script

**One command does everything:**

```bash
./scripts/deploy-mcp-azure.sh
```

This script will:

1. Login to Azure (if needed)
2. Create resource group
3. Create container registry
4. Build Docker image
5. Create Container Apps environment
6. Deploy MCP server
7. Give you the public URL

**Time:** ~5-10 minutes (Docker build takes the longest)

---

## Step 3: Test the Deployment

```bash
# Replace with your actual URL from the script output
curl https://patchpath-mcp.XXXXX.eastus.azurecontainerapps.io/health
```

Expected response:

```json
{
  "status": "healthy",
  "service": "patchpath-mcp-server",
  "version": "1.0.0",
  "timestamp": "2025-10-12T..."
}
```

---

## Step 4: Configure Claude Desktop

Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "patchpath-ai": {
      "url": "https://patchpath-mcp.XXXXX.eastus.azurecontainerapps.io/sse",
      "transport": "sse"
    }
  }
}
```

**Replace with YOUR actual URL from Step 2!**

---

## Step 5: Restart Claude Desktop & Test

1. Quit Claude Desktop completely
2. Reopen Claude Desktop
3. Start a conversation:

```
You: "Search for Make Noise oscillators"

Claude: [Uses your MCP server!]
```

---

## Troubleshooting

### Script fails at Azure login

```bash
# Login manually first
az login

# Then run script again
./scripts/deploy-mcp-azure.sh
```

### Health check returns 503

Wait 1-2 minutes for container to start, then try again.

### Claude Desktop can't connect

1. Check URL is correct in config (no typos!)
2. Make sure you used `/sse` endpoint
3. Test health endpoint manually first
4. Check Azure Container Apps logs:

```bash
az containerapp logs tail \
  --name patchpath-mcp \
  --resource-group patchpath-rg \
  --follow
```

### Need to update secrets

```bash
az containerapp secret set \
  --name patchpath-mcp \
  --resource-group patchpath-rg \
  --secrets anthropic-key="new-key"
```

---

## View Logs

```bash
# Follow logs in real-time
az containerapp logs tail \
  --name patchpath-mcp \
  --resource-group patchpath-rg \
  --follow

# Recent logs
az containerapp logs show \
  --name patchpath-mcp \
  --resource-group patchpath-rg
```

---

## Update Deployment

Made changes? Redeploy:

```bash
./scripts/deploy-mcp-azure.sh
```

The script detects existing resources and updates them.

---

## Cost

**Estimated: ~$0.50/day (~$15/month)**

Running 24/7 with:

- 0.5 vCPU
- 1GB memory
- External ingress

---

## Delete Everything (When Done Testing)

```bash
# Delete entire resource group
az group delete --name patchpath-rg --yes

# This removes:
# - Container Registry
# - Container Apps Environment
# - MCP Server
# - All logs
```

---

## What's Next?

### Test the Tools:

- Search modules: "Find LZX video modules"
- Analyze rack: "Analyze https://modulargrid.net/e/racks/view/2383104"
- **Contribute knowledge:** "I have a rare Syntonie CB-300..."

### Record Demo Video:

- Screen record Claude Desktop using MCP server
- Show two-way knowledge contribution
- Share with community

### Launch:

- Share with modular synthesis community
- Get feedback from early adopters
- Iterate and improve

---

**YOU'RE READY TO LAUNCH! 🚀🎸🤖**
