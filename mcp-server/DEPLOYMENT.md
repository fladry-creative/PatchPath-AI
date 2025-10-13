# MCP Server Deployment Guide

**Deploy PatchPath MCP Server to Azure Container Apps**

---

## Why Deploy?

**Localhost MCP:** Only works when running locally
**Deployed MCP:** Accessible from anywhere, always available

---

## Architecture

```
Claude Desktop (Your laptop)
         ↓ HTTP+SSE
Azure Container Apps (MCP Server)
         ↓
Azure Cosmos DB (Knowledge base)
```

---

## Deployment Steps

### 1. Install Dependencies

```bash
# Add express for HTTP server
npm install express cors

# Add express types
npm install --save-dev @types/express @types/cors
```

### 2. Build Docker Image

```bash
# Build locally first (test)
docker build -f Dockerfile.mcp -t patchpath-mcp .

# Test locally
docker run -p 3001:3001 \
  -e ANTHROPIC_API_KEY="..." \
  -e COSMOS_ENDPOINT="..." \
  -e COSMOS_KEY="..." \
  -e COSMOS_DATABASE="patchpath-db" \
  patchpath-mcp

# Test health
curl http://localhost:3001/health
```

### 3. Push to Azure Container Registry

```bash
# Login to Azure
az login

# Create resource group (if needed)
az group create --name patchpath-rg --location eastus

# Create container registry (if needed)
az acr create \
  --resource-group patchpath-rg \
  --name patchpathacr \
  --sku Basic

# Login to registry
az acr login --name patchpathacr

# Build and push
az acr build \
  --registry patchpathacr \
  --image patchpath-mcp:latest \
  --file Dockerfile.mcp \
  .
```

### 4. Deploy to Azure Container Apps

```bash
# Create Container Apps environment (if needed)
az containerapp env create \
  --name patchpath-env \
  --resource-group patchpath-rg \
  --location eastus

# Deploy MCP server
az containerapp create \
  --name patchpath-mcp \
  --resource-group patchpath-rg \
  --environment patchpath-env \
  --image patchpathacr.azurecr.io/patchpath-mcp:latest \
  --target-port 3001 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars \
    NODE_ENV=production \
    ANTHROPIC_API_KEY=secretref:anthropic-key \
    COSMOS_ENDPOINT=secretref:cosmos-endpoint \
    COSMOS_KEY=secretref:cosmos-key \
    COSMOS_DATABASE=patchpath-db \
  --secrets \
    anthropic-key="$ANTHROPIC_API_KEY" \
    cosmos-endpoint="$COSMOS_ENDPOINT" \
    cosmos-key="$COSMOS_KEY"

# Get the public URL
az containerapp show \
  --name patchpath-mcp \
  --resource-group patchpath-rg \
  --query properties.configuration.ingress.fqdn \
  --output tsv
```

---

## Configure Claude Desktop (Remote)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "patchpath-ai": {
      "url": "https://patchpath-mcp.YOUR-REGION.azurecontainerapps.io/sse",
      "transport": "sse"
    }
  }
}
```

**Replace with your actual Azure Container Apps URL!**

---

## Verify Deployment

### Health Check

```bash
curl https://patchpath-mcp.YOUR-REGION.azurecontainerapps.io/health
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

### View Logs

```bash
# Stream logs
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

```bash
# Build new image
az acr build \
  --registry patchpathacr \
  --image patchpath-mcp:latest \
  --file Dockerfile.mcp \
  .

# Update container app (auto-pulls latest)
az containerapp update \
  --name patchpath-mcp \
  --resource-group patchpath-rg
```

---

## Monitoring

### Metrics

```bash
# View metrics in Azure Portal
az containerapp show \
  --name patchpath-mcp \
  --resource-group patchpath-rg
```

### Logs

- Azure Portal → Container Apps → patchpath-mcp → Log Stream
- Or use `az containerapp logs` commands above

### Alerts (Optional)

Set up alerts for:

- High CPU usage (>80%)
- High memory usage (>80%)
- HTTP 5xx errors
- Health check failures

---

## Cost Estimation

**Azure Container Apps (Basic):**

- 0.5 vCPU, 1GB memory
- ~$0.50/day (~$15/month) with minimal traffic

**Scale to zero:**

```bash
az containerapp update \
  --name patchpath-mcp \
  --resource-group patchpath-rg \
  --min-replicas 0
```

(Not recommended for MCP - connection drops)

---

## Security

### CORS

Currently set to `origin: '*'` for development.

**Production:** Restrict to Claude Desktop origin:

```typescript
app.use(
  cors({
    origin: 'https://claude.ai',
    credentials: true,
  })
);
```

### HTTPS

Azure Container Apps provides free TLS certificates automatically.

### Secrets

Never commit secrets! Use Azure Key Vault or Container Apps secrets:

```bash
az containerapp secret set \
  --name patchpath-mcp \
  --resource-group patchpath-rg \
  --secrets anthropic-key="new-key-value"
```

---

## Troubleshooting

### Container won't start

```bash
# Check logs
az containerapp logs tail --name patchpath-mcp -g patchpath-rg

# Check revision status
az containerapp revision list \
  --name patchpath-mcp \
  --resource-group patchpath-rg
```

### Claude Desktop can't connect

1. Verify URL is correct in config
2. Check CORS settings
3. Test health endpoint manually
4. Check Container Apps ingress is `external`

### High latency

- Scale up vCPU/memory
- Add more replicas
- Check Cosmos DB performance

---

## Production Checklist

- [ ] Docker image builds successfully
- [ ] Health endpoint returns 200
- [ ] Environment variables configured
- [ ] Secrets stored securely
- [ ] CORS restricted to Claude Desktop
- [ ] Monitoring/alerts configured
- [ ] Logs accessible
- [ ] Auto-scaling configured
- [ ] Claude Desktop connects successfully
- [ ] All 9 MCP tools tested

---

**DEPLOY AND TEST! 🚀**
