# Docker Configuration Guide

Complete Docker setup for PatchPath AI with Azure Container Registry integration.

## 📋 Prerequisites

- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose v2+ (included with Docker Desktop)
- `.env.local` file with required environment variables

## 🏗️ Architecture

### Multi-Stage Build
The [Dockerfile](Dockerfile) uses a 3-stage build for optimization:

1. **deps** - Install dependencies only
2. **builder** - Build Next.js application with turbopack
3. **runner** - Minimal production runtime

**Benefits:**
- Smaller final image size (~150-200MB vs 1GB+)
- Faster builds with layer caching
- Secure non-root user execution
- Built-in health checks

## 🚀 Quick Start

### 1. Test Configuration
```bash
./scripts/test-docker.sh
```

This validates:
- Docker installation
- Required files exist
- Environment variables configured
- Dockerfile syntax

### 2. Build Image
```bash
docker build -t patchpath-ai .
```

**Build time:** ~5-10 minutes (first build)

### 3. Run Container
```bash
docker run -p 3000:3000 --env-file .env.local patchpath-ai
```

Visit: http://localhost:3000

## 🛠️ Docker Compose

### Production Mode
```bash
docker compose up
```

- Runs optimized production build
- Hot reload disabled
- Port 3000 exposed

### Development Mode
```bash
docker compose --profile dev up app-dev
```

- Runs `next dev` with turbopack
- Hot reload enabled
- Volume mounted for live changes

### Stop Services
```bash
docker compose down
```

### View Logs
```bash
docker compose logs -f app
```

## 🔧 Configuration

### Environment Variables

Required in `.env.local`:

```bash
# Azure Cosmos DB
AZURE_COSMOS_CONNECTION_STRING=AccountEndpoint=https://...

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-...
```

### Dockerfile Customization

**Change Node version:**
```dockerfile
FROM node:20-alpine AS deps
# Change to: FROM node:22-alpine AS deps
```

**Adjust health check:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s ...
# Modify interval, timeout, retries as needed
```

## 🐳 Azure Container Registry

### Login to ACR
```bash
az acr login --name patchpathregistry
```

### Tag Image
```bash
docker tag patchpath-ai patchpathregistry.azurecr.io/patchpath-ai:latest
```

### Push to ACR
```bash
docker push patchpathregistry.azurecr.io/patchpath-ai:latest
```

### Pull from ACR
```bash
docker pull patchpathregistry.azurecr.io/patchpath-ai:latest
```

## 🔍 Troubleshooting

### Build Fails with "npm ci" Error
**Solution:** Delete `node_modules` and `package-lock.json`, then rebuild:
```bash
rm -rf node_modules package-lock.json
npm install
docker build -t patchpath-ai .
```

### Container Exits Immediately
**Check logs:**
```bash
docker logs $(docker ps -lq)
```

**Common causes:**
- Missing environment variables
- Port 3000 already in use
- Invalid `.env.local` configuration

### Permission Denied Errors
**Solution:** Container runs as non-root user (nextjs:1001). Ensure build artifacts are owned correctly:
```bash
docker build --no-cache -t patchpath-ai .
```

### Health Check Fails
**Test manually:**
```bash
docker exec -it <container_id> sh
wget -O- http://localhost:3000/api/health
```

Create health check endpoint if missing:
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok' }, { status: 200 });
}
```

### Image Too Large
**Check size:**
```bash
docker images patchpath-ai
```

**Optimize:**
- Ensure `.dockerignore` excludes `node_modules`, `.next`, `.git`
- Use `alpine` base images
- Multi-stage build already minimizes size

## 📊 Performance

### Image Size
- **Full build:** ~1.2GB (includes all dependencies)
- **Final image:** ~150-200MB (production runtime only)

### Build Time
- **First build:** 5-10 minutes (all dependencies)
- **Subsequent builds:** 1-3 minutes (cached layers)

### Memory Usage
- **Minimum:** 512MB
- **Recommended:** 1GB
- **Production:** 2GB (for Azure Container Apps)

## 🧪 Testing

### Run Test Script
```bash
./scripts/test-docker.sh
```

### Full Build Test
```bash
./scripts/test-docker.sh --build
```

### Compose Validation
```bash
./scripts/test-docker.sh --compose
```

### Manual Container Test
```bash
# Build
docker build -t patchpath-ai:test .

# Run with test environment
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  patchpath-ai:test

# Test endpoint
curl http://localhost:3000
```

## 📝 Best Practices

1. **Always use .dockerignore** - Prevents bloated images
2. **Tag images with versions** - `patchpath-ai:v1.0.0`
3. **Use multi-stage builds** - Already configured
4. **Run as non-root** - Security best practice (configured)
5. **Include health checks** - For container orchestration
6. **Set resource limits** - Prevent resource exhaustion

### Production Deployment
```bash
# Build with version tag
docker build -t patchpathregistry.azurecr.io/patchpath-ai:v1.0.0 .

# Also tag as latest
docker tag patchpathregistry.azurecr.io/patchpath-ai:v1.0.0 \
  patchpathregistry.azurecr.io/patchpath-ai:latest

# Push both tags
docker push patchpathregistry.azurecr.io/patchpath-ai:v1.0.0
docker push patchpathregistry.azurecr.io/patchpath-ai:latest
```

## 🔗 Next Steps

After Docker configuration:
1. ✅ Test locally with `docker compose up`
2. ✅ Push to Azure Container Registry
3. 🔄 Setup CI/CD pipeline (Issue #21)
4. 🚀 Deploy to Azure Container Apps (Issue #20)

## 📚 Additional Resources

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Azure Container Registry Docs](https://docs.microsoft.com/azure/container-registry/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
