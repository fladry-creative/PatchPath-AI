---
description: Fix TypeScript errors across the codebase
---

Find and fix all TypeScript errors:

1. Run `tsc --noEmit` to find type errors
2. Analyze each error and determine the root cause
3. Fix errors by:
   - Adding proper type annotations
   - Fixing type mismatches
   - Adding missing imports
   - Updating type definitions
4. Re-run type check after each fix
5. Report summary of fixes made

Use October 2025 TypeScript 5.x best practices (verbatimModuleSyntax, bundler moduleResolution).
