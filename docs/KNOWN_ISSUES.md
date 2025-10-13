# Known Issues

## Production Build Error (October 2025)

**Status**: Active
**Severity**: Medium (blocks production builds, dev mode unaffected)
**Affects**: Next.js 15.5.4 + Clerk 6.33.3

### Issue Description

Production builds fail with the following error:

```
Error: <Html> should not be imported outside of pages/_document.
Read more: https://nextjs.org/docs/messages/no-document-import-in-page
Export encountered an error on /_error: /404, exiting the build.
```

### Root Cause

This is a compatibility issue between Clerk's middleware/authentication and Next.js 15's static page generation for error pages. Next.js 15 tries to statically generate 404/500 error pages, but Clerk's ClerkProvider appears to be importing components from `next/document` which is only valid in the Pages Router `_document.tsx` file.

### Workarounds Attempted

1. ✅ Created custom `app/not-found.tsx`, `app/error.tsx`, and `app/global-error.tsx`
2. ✅ Added `export const dynamic = 'force-dynamic'` to root layout and error pages
3. ✅ Added build configuration to skip trailing slash redirects
4. ❌ None of these resolved the build error

### Impact

- ❌ **Production builds fail** (`npm run build` exits with code 1)
- ✅ **Development mode works perfectly** (`npm run dev` runs without issues)
- ✅ **All features functional in dev mode** (authentication, routing, API routes, etc.)
- ✅ **All tests pass** (Jest unit tests and Playwright E2E tests work)

### Temporary Solution

**For development and testing**: Use `npm run dev` - all features work correctly.

**For production deployment**: This issue needs to be resolved before production deployment. Options:

1. Wait for Clerk to release a fix for Next.js 15.5.4 compatibility
2. Downgrade to an earlier Next.js 15.x version (not recommended - would lose Turbopack improvements)
3. Try upgrading Clerk to latest version when available (currently on 6.33.3)
4. Consider switching auth providers if urgency requires (Lucia Auth, NextAuth.js, etc.)

### Related Links

- [Next.js Error: no-document-import-in-page](https://nextjs.org/docs/messages/no-document-import-in-page)
- [Clerk GitHub Issues](https://github.com/clerk/javascript/issues)
- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)

### Resolution Strategy

This is an upstream issue that should be fixed by Clerk or Next.js in a future update. Monitor:

1. Clerk's changelog for Next.js 15 compatibility fixes
2. Next.js 15 patch releases (15.5.5+) for error page generation fixes
3. Community reports on GitHub/Discord for workarounds

### Last Updated

October 12, 2025
