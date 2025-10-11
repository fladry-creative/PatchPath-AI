import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ═══════════════════════════════════════════════════════════
  // PATCHPATH AI - OPTIMIZED NEXT.JS CONFIGURATION
  // ═══════════════════════════════════════════════════════════

  // React 19 Compiler (Stable in Oct 2025 - v1.0 released)
  // Eliminates need for manual memo/useMemo/useCallback
  // Performance: 12% faster initial loads, 2.5x faster interactions
  experimental: {
    reactCompiler: true, // Auto-memoization, granular optimization
    serverActions: {
      // Allow GitHub Codespaces and local origins for Server Actions
      allowedOrigins: ['localhost:3000', '*.app.github.dev'],
    },
  },

  // Turbopack Configuration (replaces experimental.turbo in Next.js 15+)
  turbopack: {
    rules: {
      // Optimize Turbopack for our stack
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Performance Optimizations
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Image Optimization (for future rack diagrams)
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'modulargrid.net',
        pathname: '/**',
      },
    ],
  },

  // Build Optimization (swcMinify is now default in Next.js 15+, no need to specify)
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Headers for Security & Performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Webpack Bundle Analyzer (development only)
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }

    // Add source maps in development
    if (dev) {
      config.devtool = 'eval-source-map';
    }

    return config;
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
