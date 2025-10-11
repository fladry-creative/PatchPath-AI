# CI/CD Pipeline Documentation

Complete GitHub Actions automation for PatchPath AI with Azure deployment.

## 🎯 Overview

Three automated workflows handle testing, building, and deployment:

1. **[ci-cd.yml](.github/workflows/ci-cd.yml)** - Main pipeline (test → build → deploy)
2. **[pr-check.yml](.github/workflows/pr-check.yml)** - Pull request validation
3. **[deploy-manual.yml](.github/workflows/deploy-manual.yml)** - Manual deployment trigger

## 🔄 Workflows

### 1. Main CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**
- Push to `main` branch
- Push to `develop` branch
- Pull requests to `main`
- Manual trigger

**Jobs:**

#### Job 1: Test & Lint
```yaml
✓ Checkout code
✓ Setup Node.js 20
✓ Install dependencies (npm ci)
✓ Run ESLint
✓ TypeScript type checking
✓ Build application
```

**Duration:** ~3-5 minutes

#### Job 2: Build & Push Docker Image
```yaml
✓ Setup Docker Buildx
✓ Login to Azure Container Registry
✓ Extract image metadata
✓ Build multi-stage Docker image
✓ Push to ACR with tags:
  - main-<sha>
  - latest (on main branch)
✓ Layer caching for faster builds
```

**Duration:** ~5-10 minutes (first), ~2-3 minutes (cached)

**Image tags created:**
- `patchpathregistry.azurecr.io/patchpath-ai:latest`
- `patchpathregistry.azurecr.io/patchpath-ai:main-abc1234`

#### Job 3: Deploy to Azure (Placeholder)
```yaml
✓ Azure login
✓ Deploy to Container Apps (ready when #20 complete)
✓ Deployment summary
```

**Note:** Deployment commands ready, waiting for Azure Container App creation (Issue #20)

#### Job 4: Security Scan
```yaml
✓ Login to ACR
✓ Run Trivy vulnerability scanner
✓ Upload results to GitHub Security tab
✓ Security summary
```

**Duration:** ~2-3 minutes

### 2. PR Check Workflow (`pr-check.yml`)

**Triggers:**
- Pull requests to `main` or `develop`

**Jobs:**
```yaml
✓ Lint code
✓ Type check
✓ Build verification
✓ Docker build test (deps stage only)
```

**Duration:** ~2-4 minutes

**Purpose:** Fast feedback for contributors without full Docker build

### 3. Manual Deployment (`deploy-manual.yml`)

**Triggers:**
- Manual trigger via GitHub Actions UI

**Inputs:**
- `environment`: production | staging
- `image-tag`: Docker tag to deploy (default: latest)

**Use cases:**
- Rollback to previous version
- Deploy specific commit
- Staging environment testing
- Emergency hotfix deployment

## 🔐 Required Secrets

Configure in: **Repository Settings → Secrets and variables → Actions**

### Azure Container Registry
```bash
AZURE_REGISTRY_USERNAME=patchpathregistry
AZURE_REGISTRY_PASSWORD=<from Azure>
AZURE_REGISTRY_LOGIN_SERVER=patchpathregistry.azurecr.io
```

### Azure Credentials (for deployment)
```bash
AZURE_CREDENTIALS=<JSON service principal>
```

**Generate Azure credentials:**
```bash
az ad sp create-for-rbac \
  --name "github-actions-patchpath" \
  --role contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/patchpath-rg \
  --sdk-auth
```

Copy the JSON output to `AZURE_CREDENTIALS` secret.

### Application Secrets
```bash
AZURE_COSMOS_CONNECTION_STRING=<from Azure>
ANTHROPIC_API_KEY=<from Anthropic>
CLERK_SECRET_KEY=<from Clerk>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<from Clerk>
```

## 📊 Workflow Status

### View Workflows
- **Actions tab:** https://github.com/<owner>/patchpath-ai/actions
- **Per commit:** Click ✓ or ✗ next to commit in GitHub

### Job Summaries
Each workflow creates a markdown summary with:
- Build artifacts
- Image tags and digests
- Deployment status
- Security scan results

### Notifications
GitHub notifications for:
- ✅ Workflow success
- ❌ Workflow failure
- 🔒 Security vulnerabilities

## 🚀 Usage Examples

### Automatic Deployment (Main Branch)
```bash
# Make changes
git checkout -b feature/my-feature
git commit -m "Add awesome feature"
git push origin feature/my-feature

# Create PR → pr-check.yml runs
# Merge to main → ci-cd.yml runs
# Automatically: test → build → push → deploy
```

### Manual Deployment
1. Go to **Actions** tab
2. Select **Manual Deployment**
3. Click **Run workflow**
4. Choose:
   - Environment: production
   - Image tag: latest (or specific tag)
5. Click **Run workflow**

### Deploy Specific Version
```bash
# Find image tag from previous build
# Example: main-abc1234

# Use Manual Deployment workflow with:
# - environment: production
# - image-tag: main-abc1234
```

### Rollback Deployment
```bash
# Find previous working image tag
# Use Manual Deployment workflow with old tag
```

## 🐛 Troubleshooting

### Build Fails: "npm ci" Error
**Cause:** package-lock.json out of sync

**Fix:**
```bash
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
git push
```

### Docker Build Fails: Layer Caching
**Cause:** Cache corruption

**Fix:** Clear cache manually
```bash
# In workflow, add:
cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache
cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache,mode=max
```

Or disable caching temporarily:
```yaml
# Remove cache-from and cache-to lines
```

### ACR Login Fails
**Cause:** Expired or incorrect credentials

**Fix:**
```bash
# Get new credentials
az acr credential show --name patchpathregistry

# Update secrets in GitHub:
# AZURE_REGISTRY_USERNAME
# AZURE_REGISTRY_PASSWORD
```

### Deployment Fails: Container App Not Found
**Expected:** Issue #20 not complete yet

**Fix:** Complete Azure Container Apps setup first

### Security Scan Fails
**Cause:** Critical vulnerabilities found

**Fix:**
1. Check **Security** tab for details
2. Update vulnerable dependencies:
   ```bash
   npm audit fix
   ```
3. Rebuild and push

### Workflow Stuck/Not Running
**Check:**
1. GitHub Actions enabled? (Settings → Actions)
2. Quota exceeded? (Free tier: 2000 min/month)
3. Branch protection rules blocking?

## 📈 Performance Optimization

### Build Speed
- ✅ npm ci caching (~30s faster)
- ✅ Docker layer caching (~3-5 min faster)
- ✅ Multi-stage builds (smaller images)
- ✅ Parallel job execution

### Cost Optimization
- ✅ Skip deployment on PR (only test)
- ✅ Conditional jobs (only deploy on main)
- ✅ Efficient Docker caching
- ✅ Free tier friendly (~50 min per push)

**Estimated runtime per push to main:**
```
Test & Lint:        3-5 min
Build & Push:       5-10 min (first) / 2-3 min (cached)
Security Scan:      2-3 min
Deploy:             1-2 min
------------------------
Total:              ~12-20 min (first) / ~8-12 min (cached)
```

## 🎯 Next Steps

### After Issue #20 Complete
1. Update `ci-cd.yml` deploy job:
   ```yaml
   - name: Deploy to Azure Container Apps
     run: |
       az containerapp update \
         --name patchpath-app \
         --resource-group patchpath-rg \
         --image ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
   ```

2. Configure environment variables in Container App:
   ```bash
   az containerapp update \
     --name patchpath-app \
     --resource-group patchpath-rg \
     --set-env-vars \
       AZURE_COSMOS_CONNECTION_STRING=secretref:cosmos-connection \
       ANTHROPIC_API_KEY=secretref:anthropic-key
   ```

3. Test full pipeline:
   ```bash
   git commit --allow-empty -m "Test CI/CD pipeline"
   git push origin main
   ```

### Monitoring
- **GitHub Actions tab:** Workflow history
- **Azure Portal:** Container App logs
- **Security tab:** Vulnerability reports

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Azure Container Apps CI/CD](https://learn.microsoft.com/azure/container-apps/github-actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Trivy Security Scanner](https://github.com/aquasecurity/trivy-action)

## ✅ Checklist

Before enabling CI/CD:
- [x] Azure Container Registry created (Issue #3)
- [x] Docker configuration complete (Issue #19)
- [x] GitHub secrets configured
- [ ] Azure Container App created (Issue #20)
- [ ] Test manual deployment
- [ ] Monitor first automatic deployment
- [ ] Verify health checks pass
