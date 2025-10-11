# GitHub Security Setup Guide

**Repository**: `fladry-creative/PatchPath-AI`
**Date**: 2025-10-11

## Step 1: Enable Dependabot

Dependabot automatically checks for dependency vulnerabilities and creates PRs to update them.

### Instructions:

1. Go to: https://github.com/fladry-creative/PatchPath-AI/settings/security_analysis
2. Under **Dependabot**, enable:
   - ✅ **Dependabot alerts** - Get notified about vulnerable dependencies
   - ✅ **Dependabot security updates** - Auto-create PRs to fix vulnerabilities
   - ✅ **Dependabot version updates** (Optional) - Auto-create PRs for new versions

### Alternative (CLI - if available):

```bash
# Enable Dependabot alerts (may require repo admin permissions)
gh api -X PATCH /repos/fladry-creative/PatchPath-AI \
  -f security_and_analysis='{"dependabot_alerts":{"status":"enabled"},"dependabot_security_updates":{"status":"enabled"}}'
```

### What This Does:

- Scans `package.json` and `package-lock.json` for known vulnerabilities
- Creates automated PRs when security updates are available
- Sends email/notification when vulnerabilities are found
- Keeps dependencies up-to-date automatically

---

## Step 2: Verify Secret Scanning

Secret scanning prevents API keys and credentials from being committed to the repo.

### Instructions:

1. Go to: https://github.com/fladry-creative/PatchPath-AI/settings/security_analysis
2. Under **Secret scanning**, verify:
   - ✅ **Secret scanning** - Should be enabled by default for public repos
   - ✅ **Push protection** - Blocks commits containing secrets

### What This Does:

- Scans all commits for API keys, tokens, credentials
- Blocks pushes that contain secrets (push protection)
- Alerts you if secrets are found in commit history
- Supports 200+ token patterns (AWS, Anthropic, Azure, etc.)

### Test It (Optional):

```bash
# This should be BLOCKED by push protection:
# echo "ANTHROPIC_API_KEY=sk-ant-1234567890" >> test.txt
# git add test.txt
# git commit -m "test secret scanning"
# Expected: Push blocked with error message
```

---

## Step 3: Add GitHub Codespace Secrets

Codespace secrets are automatically injected as environment variables when the Codespace starts.

### Instructions:

1. Go to: https://github.com/settings/codespaces
2. Click **"New secret"** and add each of the following:

### Required Secrets:

#### 1. ANTHROPIC_API_KEY

- **Value**: Your Anthropic API key (starts with `sk-ant-`)
- **Repository**: Select `fladry-creative/PatchPath-AI`

#### 2. AZURE_COSMOS_CONNECTION_STRING

- **Value**: Your Azure Cosmos DB connection string
- **Format**: `AccountEndpoint=https://your-account.documents.azure.com:443/;AccountKey=YOUR_KEY_HERE;`
- **Repository**: Select `fladry-creative/PatchPath-AI`

#### 3. GEMINI_API_KEY

- **Value**: Your Google Gemini API key (starts with `AIza...`)
- **Format**: `AIzaSy...` (get from Google AI Studio)
- **Repository**: Select `fladry-creative/PatchPath-AI`

#### 4. CLERK_SECRET_KEY

- **Value**: Your Clerk secret key (starts with `sk_test_` or `sk_live_`)
- **Repository**: Select `fladry-creative/PatchPath-AI`

#### 5. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

- **Value**: Your Clerk publishable key (starts with `pk_test_` or `pk_live_`)
- **Repository**: Select `fladry-creative/PatchPath-AI`

### How Secrets Work in Codespaces:

1. **Auto-Injected**: Secrets are automatically available as environment variables
2. **Script-Generated**: `.devcontainer/setup-env.sh` creates `.env.local` from secrets
3. **Security**: Secrets are never committed to git, only stored in GitHub

### Verify Secrets After Codespace Creation:

```bash
# In your Codespace terminal:
cat .env.local

# Should show:
# ANTHROPIC_API_KEY=sk-ant-...
# AZURE_COSMOS_CONNECTION_STRING=AccountEndpoint=...
# GEMINI_API_KEY=AIza...
# CLERK_SECRET_KEY=sk_test_...
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---

## Step 4: Enable GitHub Advanced Security (Optional)

For private repos, GitHub Advanced Security provides additional features.

### Instructions:

1. Go to: https://github.com/fladry-creative/PatchPath-AI/settings/security_analysis
2. Under **GitHub Advanced Security**, enable:
   - ✅ **Code scanning** - Automated security analysis with CodeQL
   - ✅ **Dependency review** - Review dependency changes in PRs

### What This Does:

- **CodeQL**: Scans code for security vulnerabilities (SQL injection, XSS, etc.)
- **Dependency Review**: Shows dependency changes and vulnerabilities in PRs
- **Secret Scanning**: Enhanced scanning with custom patterns

**Note**: This is FREE for public repos, but costs money for private repos.

---

## Step 5: Add Security Policy (Optional but Professional)

Create a `SECURITY.md` file to document how users should report vulnerabilities.

### Instructions:

1. Go to: https://github.com/fladry-creative/PatchPath-AI/security/policy
2. Click **"Start setup"**
3. Add this content:

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in PatchPath AI, please report it by:

1. **Email**: security@fladry.com (if available)
2. **Private GitHub Security Advisory**: https://github.com/fladry-creative/PatchPath-AI/security/advisories/new

**Please do NOT**:

- Open a public GitHub issue
- Discuss the vulnerability publicly before it's fixed

We will respond within 48 hours and work with you to address the issue.

## Security Best Practices

- All API keys are stored in environment variables, never committed to git
- Secrets are injected via GitHub Codespace secrets or local `.env.local`
- Dependabot automatically checks for vulnerable dependencies
- Secret scanning prevents accidental credential commits
```

---

## Verification Checklist

After completing the steps above, verify:

- [ ] Dependabot alerts enabled (check https://github.com/fladry-creative/PatchPath-AI/security/dependabot)
- [ ] Secret scanning enabled (check https://github.com/fladry-creative/PatchPath-AI/security/secret-scanning)
- [ ] 5 Codespace secrets added (check https://github.com/settings/codespaces)
- [ ] `.env.local` in `.gitignore` (already done ✅)
- [ ] No secrets in git history (use `git log --all -p | grep -i "api.key"` to verify)

---

## Quick Reference: Where to Go

| Task                        | URL                                                                        |
| --------------------------- | -------------------------------------------------------------------------- |
| Enable Dependabot           | https://github.com/fladry-creative/PatchPath-AI/settings/security_analysis |
| Check secret scanning       | https://github.com/fladry-creative/PatchPath-AI/settings/security_analysis |
| Add Codespace secrets       | https://github.com/settings/codespaces                                     |
| View Dependabot alerts      | https://github.com/fladry-creative/PatchPath-AI/security/dependabot        |
| View secret scanning alerts | https://github.com/fladry-creative/PatchPath-AI/security/secret-scanning   |
| Create security policy      | https://github.com/fladry-creative/PatchPath-AI/security/policy            |

---

**Last Updated**: 2025-10-11
**Status**: Manual setup required (GitHub web UI)
**Estimated Time**: 10-15 minutes total
