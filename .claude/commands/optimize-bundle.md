---
description: Analyze and optimize Next.js bundle size
---

Optimize the Next.js application bundle:

1. Run production build: `npm run build`
2. Analyze the build output for large bundles
3. Identify optimization opportunities:
   - Large dependencies that can be replaced
   - Unused exports that can be removed
   - Code that can be lazy-loaded
   - Images that need optimization
4. Implement optimizations using React 19 compiler features
5. Verify bundle size reduction
6. Document changes made

Target: Core Web Vitals improvements (LCP, INP, CLS).
