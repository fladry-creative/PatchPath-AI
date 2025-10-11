# PatchPath AI Documentation

**Last Updated**: 2025-10-11

## 📚 Quick Navigation

### Getting Started

- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - 📋 Complete overview of October 2025 best practices implementation

### Development Setup

- **[CODESPACE_SETUP.md](CODESPACE_SETUP.md)** - 🚀 GitHub Codespace setup and configuration
- **[GITHUB_SECURITY_SETUP.md](GITHUB_SECURITY_SETUP.md)** - 🔐 Security configuration (Dependabot, secrets, scanning)
- **[CLAUDE_CODE_DANGER_MODE.md](CLAUDE_CODE_DANGER_MODE.md)** - ⚡ Claude Code maximum efficiency settings

### Code Quality

- **[LINTING_SETUP.md](LINTING_SETUP.md)** - ✨ Auto-linting, formatting, pre-commit hooks
- **[DEVELOPMENT_GUIDE_GAP_ANALYSIS.md](DEVELOPMENT_GUIDE_GAP_ANALYSIS.md)** - 📊 Implementation status vs. best practices

### Testing

- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - 🧪 Jest unit tests + Playwright E2E tests

### Observability

- **[LOGGING_GUIDE.md](LOGGING_GUIDE.md)** - 📝 Structured logging with Winston
- **[OBSERVABILITY_GUIDE.md](OBSERVABILITY_GUIDE.md)** - 📊 Metrics, monitoring, and alerting

---

## 🎯 Quick Start

### 1. First Time Setup (15 minutes)

1. Enable Dependabot: [GitHub Security Settings](https://github.com/fladry-creative/PatchPath-AI/settings/security_analysis)
2. Add Codespace secrets: [GitHub Codespace Settings](https://github.com/settings/codespaces)
3. Create Codespace: [Repository](https://github.com/fladry-creative/PatchPath-AI)

See: [GITHUB_SECURITY_SETUP.md](GITHUB_SECURITY_SETUP.md)

### 2. Development Workflow

```bash
# Start dev server
npm run dev

# Run tests
npm test                # Unit tests
npm run test:e2e        # E2E tests

# Code quality
npm run lint            # Check linting
git commit              # Auto-format & lint
```

See: [TESTING_GUIDE.md](TESTING_GUIDE.md), [LINTING_SETUP.md](LINTING_SETUP.md)

### 3. Monitoring & Debugging

```bash
# View logs (Winston)
# Check console output

# View metrics
curl http://localhost:3000/api/metrics
```

See: [LOGGING_GUIDE.md](LOGGING_GUIDE.md), [OBSERVABILITY_GUIDE.md](OBSERVABILITY_GUIDE.md)

---

## 📖 Documentation Index

### Setup & Configuration

| Document                                                 | Purpose                         | When to Read                   |
| -------------------------------------------------------- | ------------------------------- | ------------------------------ |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)   | Overview of all implementations | Start here!                    |
| [CODESPACE_SETUP.md](CODESPACE_SETUP.md)                 | Cloud development environment   | Before creating Codespace      |
| [GITHUB_SECURITY_SETUP.md](GITHUB_SECURITY_SETUP.md)     | Security configuration          | Before production              |
| [CLAUDE_CODE_DANGER_MODE.md](CLAUDE_CODE_DANGER_MODE.md) | AI assistant optimization       | Using Claude Code in Codespace |

### Development

| Document                                                               | Purpose                     | When to Read        |
| ---------------------------------------------------------------------- | --------------------------- | ------------------- |
| [LINTING_SETUP.md](LINTING_SETUP.md)                                   | Code quality automation     | Before first commit |
| [TESTING_GUIDE.md](TESTING_GUIDE.md)                                   | Testing strategy & examples | Writing tests       |
| [DEVELOPMENT_GUIDE_GAP_ANALYSIS.md](DEVELOPMENT_GUIDE_GAP_ANALYSIS.md) | Implementation checklist    | Planning features   |

### Monitoring

| Document                                         | Purpose              | When to Read           |
| ------------------------------------------------ | -------------------- | ---------------------- |
| [LOGGING_GUIDE.md](LOGGING_GUIDE.md)             | Structured logging   | Adding logging to code |
| [OBSERVABILITY_GUIDE.md](OBSERVABILITY_GUIDE.md) | Metrics & monitoring | Performance monitoring |

---

## 🏗️ Architecture Overview

```
patchpath-ai/
├── app/                          # Next.js 15 App Router
│   ├── (dashboard)/              # Protected routes
│   ├── (auth)/                   # Authentication
│   └── api/                      # API routes
├── lib/                          # Shared libraries
│   ├── ai/                       # AI clients (Claude, Gemini)
│   ├── database/                 # Cosmos DB integration
│   ├── modules/                  # Module enrichment
│   ├── observability/            # Metrics collection
│   └── logger.ts                 # Winston logging
├── __tests__/                    # Jest unit tests
├── e2e/                          # Playwright E2E tests
├── docs/                         # Documentation (you are here)
├── .github/workflows/            # CI/CD & AI code review
└── .devcontainer/                # Codespace configuration
```

---

## 🧪 Testing Strategy

### Unit Tests (Jest)

- **Location**: `__tests__/`
- **Run**: `npm test`
- **Coverage**: 70% minimum
- **Docs**: [TESTING_GUIDE.md](TESTING_GUIDE.md)

### E2E Tests (Playwright)

- **Location**: `e2e/`
- **Run**: `npm run test:e2e`
- **Browser**: Chromium
- **Docs**: [TESTING_GUIDE.md](TESTING_GUIDE.md)

### Accessibility Tests

- **Location**: `e2e/accessibility.spec.ts`
- **Standards**: WCAG AA compliance
- **Automated**: Image alt text, heading hierarchy, keyboard nav

---

## 📊 Monitoring & Logging

### Winston Logging

- **Levels**: error, warn, info, http, debug
- **Output**: Console (dev), Files (production)
- **Docs**: [LOGGING_GUIDE.md](LOGGING_GUIDE.md)

### Metrics Collection

- **Framework**: Custom metrics collector
- **Future**: Datadog, Prometheus integration
- **Docs**: [OBSERVABILITY_GUIDE.md](OBSERVABILITY_GUIDE.md)

---

## 🔐 Security

### Secret Management

- **Local**: `.env.local` (gitignored)
- **Codespace**: GitHub secrets → auto-generated `.env.local`
- **Scanning**: Push protection enabled

### Dependency Security

- **Dependabot**: Auto-updates vulnerable packages
- **Secret Scanning**: Prevents credential commits
- **Docs**: [GITHUB_SECURITY_SETUP.md](GITHUB_SECURITY_SETUP.md)

---

## 🤖 AI Code Review

### Gemini Code Review

- **Trigger**: PR to main/develop
- **Model**: Gemini 2.0 Flash
- **Reviews**:
  - Type safety
  - Security vulnerabilities
  - Performance issues
  - Code quality
- **Output**: Structured PR comments

---

## 🚀 Deployment

### Current

- Local development
- GitHub Codespaces (cloud dev)

### Future (Production)

- Vercel deployment
- Environment variables via Vercel
- Datadog monitoring integration

---

## 📝 Contributing

### Code Quality Checklist

- [ ] TypeScript strict mode (no `any`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Tests pass (`npm test && npm run test:e2e`)
- [ ] Accessibility validated
- [ ] Logging added for operations
- [ ] Metrics recorded for performance

### Git Workflow

1. Create feature branch
2. Make changes
3. Commit (auto-lint runs)
4. Push
5. Open PR (AI review runs automatically)
6. Address feedback
7. Merge

---

## 🛠️ Troubleshooting

### Tests Failing

See: [TESTING_GUIDE.md#troubleshooting](TESTING_GUIDE.md#troubleshooting)

### Logs Not Appearing

See: [LOGGING_GUIDE.md#troubleshooting](LOGGING_GUIDE.md#troubleshooting)

### Linting Issues

See: [LINTING_SETUP.md](LINTING_SETUP.md)

### Codespace Issues

See: [CODESPACE_SETUP.md](CODESPACE_SETUP.md)

---

## 📞 Support

### Internal Resources

- Documentation: `docs/`
- Code comments: Inline documentation
- Test examples: `__tests__/`, `e2e/`

### External Resources

- Next.js 15: https://nextjs.org/docs
- React 19: https://react.dev
- TypeScript: https://www.typescriptlang.org/docs
- Jest: https://jestjs.io/docs
- Playwright: https://playwright.dev/docs

---

**Last Updated**: 2025-10-11
**Status**: Production-ready documentation
**Next Steps**: See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
