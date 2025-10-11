---
description: Pre-deployment checklist and validation
---

Run complete pre-deployment validation:

1. Run `npm run lint` and fix any errors
2. Run `npm test` and ensure all tests pass
3. Run `npm run build` and verify successful build
4. Check all environment variables are documented in .env.example
5. Verify Docker build works: `docker build -t patchpath-ai:test .`
6. Review recent git commits for quality
7. Check that no secrets or API keys are committed
8. Verify CI/CD workflow file is up to date

Provide a summary report with pass/fail status for each check.
