# GitHub Actions Workflows

## 📁 Workflow Files

### [ci-cd.yml](ci-cd.yml)
**Main CI/CD Pipeline**
- Triggers: Push to main/develop, PRs to main, manual
- Jobs: Test → Build → Deploy → Security Scan
- Duration: ~8-20 minutes

### [pr-check.yml](pr-check.yml)
**Pull Request Validation**
- Triggers: PRs to main/develop
- Jobs: Quick validation (lint, type check, build)
- Duration: ~2-4 minutes

### [deploy-manual.yml](deploy-manual.yml)
**Manual Deployment Control**
- Triggers: Manual only
- Features: Environment selection, version rollback
- Duration: ~1-2 minutes

## 🚀 Quick Start

### 1. Configure Secrets
Go to **Settings → Secrets and variables → Actions**

Required secrets:
```
AZURE_REGISTRY_USERNAME
AZURE_REGISTRY_PASSWORD
AZURE_CREDENTIALS (for deployment)
```

### 2. Enable Workflows
Workflows are enabled by default when pushed to GitHub.

### 3. Trigger First Build
```bash
git add .
git commit -m "Enable CI/CD pipeline"
git push origin main
```

### 4. Monitor
- Actions tab: https://github.com/<owner>/<repo>/actions
- Click on workflow run to see details

## 📊 Workflow Status Badges

Add to README.md:
```markdown
[![CI/CD Pipeline](https://github.com/<owner>/patchpath-ai/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/<owner>/patchpath-ai/actions/workflows/ci-cd.yml)
```

## 🔧 Common Operations

### Run Manual Deployment
1. Go to **Actions** tab
2. Select **Manual Deployment**
3. Click **Run workflow**
4. Choose environment and image tag
5. Click **Run workflow** button

### Check Security Vulnerabilities
1. Go to **Security** tab
2. View vulnerability reports from Trivy scans
3. Review and fix critical issues

### Cancel Running Workflow
1. Go to **Actions** tab
2. Click on running workflow
3. Click **Cancel workflow** button

## 📚 Full Documentation

See [CI-CD.md](../../CI-CD.md) for complete documentation including:
- Detailed workflow descriptions
- Troubleshooting guide
- Performance optimization
- Azure integration steps

## ✅ Validation

Run validation script:
```bash
./scripts/validate-workflows.sh
```

Validates:
- Workflow file structure
- YAML syntax
- Required secrets
- Job dependencies
- Docker integration
