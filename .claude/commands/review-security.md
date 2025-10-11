---
description: Security audit of codebase and dependencies
---

Perform comprehensive security review:

1. Check for exposed secrets:
   - Search for API keys, tokens, passwords in code
   - Verify .gitignore excludes .env.local
   - Check git history for accidentally committed secrets
2. Review dependencies:
   - Run `npm audit` and analyze vulnerabilities
   - Check for outdated packages with known issues
3. Review API routes:
   - Verify authentication on protected routes
   - Check input validation and sanitization
   - Review rate limiting implementation
4. Check Next.js security headers in next.config.ts
5. Verify Clerk authentication setup
6. Review Puppeteer scraping for injection risks

Provide detailed security report with recommendations.
