module.exports = {
  extends: [
    'next/core-web-vitals',
    'next/typescript',
    'prettier'
  ],
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'build/',
    'next-env.d.ts',
    '.husky/',
    '*.config.js',
    '*.config.mjs',
  ],
  rules: {
    // Basic code quality
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
  }
};
